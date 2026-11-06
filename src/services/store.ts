import { DocumentRecord, EStorageFolder, NotificationItem, AuditLogItem, User, DocumentTypeDirection, DocumentPriority, DocumentPurpose, EmailAlertRecord, WorkflowStepInstance, DocumentVersion, VersionChangeType, DocumentVersionSnapshot, SavedSearchItem, SavedSearchCriteria } from '../types';
import { INITIAL_DOCUMENTS, INITIAL_FOLDERS, INITIAL_NOTIFICATIONS, INITIAL_AUDIT_LOGS, createIncomingWorkflowSteps, createOutgoingWorkflowSteps } from './mockData';
import { checkWorkflowStepAuthorization, WorkflowActionType, AuthorizationCheckResult } from './workflowAuthMiddleware';
import { INITIAL_USERS } from './auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export function getDocStatusLao(status: string): string {
  switch (status) {
    case 'REGISTERED': return 'ລົງທະບຽນແລ້ວ';
    case 'IN_PROGRESS': return 'ກຳລັງດຳເນີນການ';
    case 'PENDING_REVIEW': return 'ລໍຖ້າກວດກາ';
    case 'PENDING_APPROVAL': return 'ລໍຖ້າອະນຸມັດ';
    case 'PENDING_SIGNATURE': return 'ລໍຖ້າລົງລາຍເຊັນ E-Signature';
    case 'APPROVED': return 'ອະນຸມັດແລ້ວ';
    case 'REJECTED': return 'ປະຕິເສດ';
    case 'RETURNED': return 'ສົ່ງກັບຄືນແກ້ໄຂ';
    case 'ARCHIVED': return 'ເກັບເຂົ້າ E-Storage';
    case 'SENT': return 'ສົ່ງອອກແລ້ວ';
    case 'COMPLETED': return 'ສຳເລັດສົມບູນ';
    default: return status;
  }
}

const STORAGE_KEYS = {
  DOCUMENTS: 'edoc_documents_v4',
  FOLDERS: 'edoc_folders_v4',
  NOTIFICATIONS: 'edoc_notifications_v4',
  AUDIT_LOGS: 'edoc_audit_logs_v4',
  EMAIL_ALERTS: 'edoc_email_alerts_v4',
  SAVED_SEARCHES: 'edoc_saved_searches_v4',
};

const INITIAL_SAVED_SEARCHES: SavedSearchItem[] = [
  {
    id: 'ss-urgent-official',
    name: 'ແຈ້ງການລັດຖະການ (ດ່ວນທີ່ສຸດ)',
    userId: 'ALL',
    userName: 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ',
    criteria: {
      direction: 'INCOMING',
      query: '',
      category: 'ແຈ້ງການລັດຖະການ',
      priority: 'URGENT',
      status: 'ALL',
    },
    notifyOnMatch: true,
    lastMatchedAt: '2026-10-06T09:00:00Z',
    lastMatchedDocNumber: 'ລຮລ/0247',
    lastMatchedDocId: 'doc-in-003',
    createdAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'ss-energy-keyword',
    name: 'ເອກະສານກ່ຽວກັບ "ພະລັງງານ"',
    userId: 'ALL',
    userName: 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ',
    criteria: {
      direction: 'INCOMING',
      query: 'ພະລັງງານ',
      category: 'ALL',
      priority: 'ALL',
      status: 'PENDING',
    },
    notifyOnMatch: true,
    lastMatchedAt: '2026-10-06T09:15:00Z',
    lastMatchedDocNumber: 'ລຮລ/0246',
    lastMatchedDocId: 'doc-in-002',
    createdAt: '2026-10-02T08:30:00Z',
  },
  {
    id: 'ss-outgoing-proposals',
    name: 'ບົດສະເໜີຂາອອກ (ດ່ວນ)',
    userId: 'ALL',
    userName: 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ',
    criteria: {
      direction: 'OUTGOING',
      query: '',
      category: 'ບົດສະເໜີ',
      priority: 'URGENT',
      status: 'PENDING',
    },
    notifyOnMatch: true,
    lastMatchedAt: '2026-10-06T09:00:00Z',
    lastMatchedDocNumber: 'ລຮລ.ຄກ/089',
    lastMatchedDocId: 'doc-out-001',
    createdAt: '2026-10-03T10:00:00Z',
  },
];

class DocumentStore {
  private documents: DocumentRecord[] = [];
  private folders: EStorageFolder[] = [];
  private notifications: NotificationItem[] = [];
  private auditLogs: AuditLogItem[] = [];
  private emailAlerts: EmailAlertRecord[] = [];
  private savedSearches: SavedSearchItem[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
    this.initFirestoreSync();
  }

  private initFirestoreSync() {
    if (typeof window === 'undefined') return;
    let unsubSnapshot: (() => void) | null = null;
    let isInitialLoad = true;

    const setupListener = () => {
      const docsPath = 'documents';
      try {
        unsubSnapshot = onSnapshot(
          collection(db, docsPath),
          (snapshot) => {
            if (!snapshot.empty) {
              const previousDocsMap = new Map(this.documents.map(d => [d.id, d]));
              const cloudDocs = snapshot.docs.map(d => d.data() as DocumentRecord);

              if (cloudDocs.length > 0) {
                // If not initial load, detect real-time status changes and new assignments
                if (!isInitialLoad) {
                  snapshot.docChanges().forEach((change) => {
                    const changedDoc = change.doc.data() as DocumentRecord;
                    const oldDoc = previousDocsMap.get(changedDoc.id);

                    if (change.type === 'modified' && oldDoc) {
                      // Check for document status change
                      if (changedDoc.status !== oldDoc.status) {
                        const statusLao = getDocStatusLao(changedDoc.status);
                        const notifItem = this.addNotification({
                          title: `ປ່ຽນສະຖານະ: ${changedDoc.documentNumber}`,
                          message: `ເອກະສານ "${changedDoc.subject}" ປ່ຽນສະຖານະເປັນ: ${statusLao}`,
                          type: changedDoc.status === 'COMPLETED' ? 'COMPLETED' : changedDoc.status === 'RETURNED' ? 'RETURNED' : 'INFO',
                          documentId: changedDoc.id,
                          documentNumber: changedDoc.documentNumber,
                          userId: 'ALL',
                        });
                        this.dispatchRealtimeAlert(notifItem);
                      }

                      // Check for new assignment or workflow step forward
                      if (changedDoc.currentStepOrder !== oldDoc.currentStepOrder) {
                        const nextStep = changedDoc.workflowSteps.find(s => s.stepOrder === changedDoc.currentStepOrder);
                        const notifItem = this.addNotification({
                          title: `🔔 ມອບໝາຍວຽກໃໝ່: ${changedDoc.documentNumber}`,
                          message: `ເອກະສານ "${changedDoc.subject}" ສົ່ງຕໍ່ເຖິງຂັ້ນຕອນ: ${nextStep?.stepNameLao || 'ຂັ້ນຕອນໃໝ່'}`,
                          type: 'ACTION_REQUIRED',
                          documentId: changedDoc.id,
                          documentNumber: changedDoc.documentNumber,
                          userId: nextStep?.assignedUserId || 'ALL',
                        });
                        this.dispatchRealtimeAlert(notifItem);
                      }
                    } else if (change.type === 'added' && !previousDocsMap.has(changedDoc.id)) {
                      // New document added to Firestore
                      const notifItem = this.addNotification({
                        title: `📄 ເອກະສານໃໝ່: ${changedDoc.documentNumber}`,
                        message: `ມີການລົງທະບຽນເອກະສານໃໝ່: "${changedDoc.subject}" (${changedDoc.direction === 'INCOMING' ? 'ຂາເຂົ້າ' : 'ຂາອອກ'})`,
                        type: 'INFO',
                        documentId: changedDoc.id,
                        documentNumber: changedDoc.documentNumber,
                        userId: 'ALL',
                      });
                      this.dispatchRealtimeAlert(notifItem);
                    }
                  });
                }

                isInitialLoad = false;
                this.documents = cloudDocs;
                localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(this.documents));
                this.notify();
              }
            } else {
              // Seed initial documents to Firestore when empty
              this.syncAllDocumentsToCloud();
              isInitialLoad = false;
            }
          },
          (error) => {
            console.warn('Firestore onSnapshot listener status:', error.message);
          }
        );
      } catch (err) {
        console.warn('Could not attach Firestore onSnapshot listener:', err);
      }
    };

    onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }
      setupListener();
    });

    // Also attach on initial boot
    setupListener();
  }

  private dispatchRealtimeAlert(notif: NotificationItem) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('edoc:realtime-notification', {
          detail: notif,
        })
      );
    }
  }

  private async syncAllDocumentsToCloud() {
    if (!auth.currentUser) return;
    const docsPath = 'documents';
    for (const d of this.documents) {
      try {
        const sanitized = JSON.parse(JSON.stringify({ ...d, ownerUid: auth.currentUser.uid }));
        await setDoc(doc(db, docsPath, d.id), sanitized);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `${docsPath}/${d.id}`);
      }
    }
  }

  private loadState() {
    try {
      const docsJson = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      this.documents = docsJson ? JSON.parse(docsJson) : INITIAL_DOCUMENTS;

      // Sanitize any existing cached records
      this.documents.forEach(d => {
        if (d.recipient === 'ລັດວິສາຫະກິດ ໄຟຟ້າລາວ') {
          d.recipient = 'ລັດວິສາຫະກິດຖືຮຸ້ນລາວ';
        }
        if (d.sender === 'ລັດວິສາຫະກິດ ໄຟຟ້າລາວ') {
          d.sender = 'ລັດວິສາຫະກິດຖືຮຸ້ນລາວ';
        }
        // Sanitize any existing signatures mistakenly signed as System Administrator
        if (d.signatures && d.signatures.length > 0) {
          d.signatures.forEach((sig, idx) => {
            if (sig.positionLao.includes('ຜູ້ຄຸ້ມຄອງລະບົບ') || sig.signerName.includes('ສົມສັກ ແກ້ວມະນີ')) {
              if (idx === 0) {
                // ເຊັນຄັ້ງທີ 1: ຫົວໜ້າພະແນກ
                sig.signerId = 'usr-dept-head';
                sig.signerName = 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ';
                sig.positionLao = 'ຫົວໜ້າພະແນກ (Department Head)';
              } else if (idx === 1) {
                // ເຊັນຄັ້ງທີ 2: ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ
                sig.signerId = 'usr-deputy-dept-head-eng';
                sig.signerName = 'ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ';
                sig.positionLao = 'ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານວິສະວະກຳ';
              } else {
                // ເຊັນຄັ້ງທີ 3: ຫົວໜ້າໜ່ວຍງານ
                sig.signerId = 'usr-unit-eng';
                sig.signerName = 'ທ່ານ ວຽງຄຳມະໂນຈິດ';
                sig.positionLao = 'ຫົວໜ້າໜ່ວຍງານວິສະວະກຳ (Engineering Unit Head)';
              }
            }
          });
        }
        // Update workflow step names in cached documents
        if (d.workflowSteps && d.workflowSteps.length > 1) {
          const step2 = d.workflowSteps.find(s => s.stepOrder === 2);
          if (step2) {
            step2.stepNameLao = 'ເຊັນຄັ້ງທີ 1: ກວດສອບ & ໃຫ້ທິດຊີ້ນຳ ຫົວໜ້າພະແນກ (Department Head) + E-Signature';
            step2.stepNameEn = '1st Signature: Dept Head Inspection & Instruction + E-Signature';
            step2.assignedUserName = 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ (ຫົວໜ້າພະແນກ)';
          }
          const step3 = d.workflowSteps.find(s => s.stepOrder === 3);
          if (step3) {
            step3.stepNameLao = 'ເຊັນຄັ້ງທີ 2: ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ ໃຫ້ທິດຊີ້ນຳ + E-Signature';
            step3.assignedUserName = 'ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ (ຮອງພະແນກ ຜູ້ຊີ້ນຳວິສະວະກຳ) / ທ່ານ ສອນປະສິດ (ຮອງພະແນກ ຜູ້ຊີ້ນຳ R&D ແລະ ປະສານງານ)';
          }
          const step4 = d.workflowSteps.find(s => s.stepOrder === 4);
          if (step4) {
            step4.stepNameLao = 'ເຊັນຄັ້ງທີ 3: ຫົວໜ້າໜ່ວຍງານ ໃຫ້ຄຳເຫັນ + E-Signature';
            step4.assignedUserName = 'ທ່ານ ວຽງຄຳມະໂນຈິດ (ວິສະວະກຳ) / ທ່ານ ຄຳແກ້ວ ພິມວົງສາ (ປະສານງານ) / ທ່ານ ມະໂນລົບ (R&D)';
          }
          const stepStaffCert = d.workflowSteps.find(s => s.stepOrder === (d.direction === 'INCOMING' ? 5 : 7));
          if (stepStaffCert) {
            stepStaffCert.stepNameLao = 'ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ';
            stepStaffCert.stepNameEn = 'Staff Verification Certificate';
            stepStaffCert.requiredRole = 'STAFF';
            stepStaffCert.assignedUserName = 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ (Staff)';
          }
          const stepArchive = d.workflowSteps.find(s => s.stepOrder === (d.direction === 'INCOMING' ? 6 : 8));
          if (stepArchive) {
            stepArchive.stepNameLao = 'E-Storage Archive & ສຳເລັດ';
            stepArchive.stepNameEn = 'Archive to E-Storage & Completed';
            stepArchive.requiredRole = 'STAFF';
            stepArchive.assignedUserName = 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ (Staff)';
          }
        }

        // Initialize Version Control history if absent
        if (!d.versions || d.versions.length === 0) {
          d.currentVersion = 1;
          d.versions = [
            {
              id: `ver-${d.id}-1`,
              versionNumber: 1,
              versionTag: 'v1.0',
              timestamp: d.createdAt || '2026-10-06T08:00:00Z',
              authorId: d.createdBy || 'usr-staff',
              authorName: d.createdByName || 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
              authorRole: 'STAFF',
              changeSummary: 'ສ້າງເອກະສານສະບັບທຳອິດ (Initial creation)',
              changeType: 'INITIAL',
              snapshot: {
                subject: d.subject,
                category: d.category,
                documentType: d.documentType,
                priority: d.priority || 'MEDIUM',
                purpose: d.purpose || 'RESEARCH',
                purposeNote: d.purposeNote,
                instructions: d.instructions,
                comments: d.comments,
                sender: d.sender,
                recipient: d.recipient,
                referenceNumber: d.referenceNumber,
                referenceDate: d.referenceDate,
                attachments: [...(d.attachments || [])],
              },
            },
          ];
        }
      });

      // Ensure doc-in-003 is present in state
      if (!this.documents.some(d => d.id === 'doc-in-003')) {
        const doc003 = INITIAL_DOCUMENTS.find(d => d.id === 'doc-in-003');
        if (doc003) this.documents.splice(2, 0, doc003);
      }

      // Ensure active documents have valid 48-hour SLA deadlines and OCR text for searchability
      const nowMs = Date.now();
      this.documents.forEach((d, idx) => {
        if (!d.ocrText) {
          d.ocrText = `[OCR Scanned Document - ${d.documentNumber}] ອ້າງອີງ: ${d.referenceNumber || '-'}\nເລື່ອງ: ${d.subject}\nຈາກ: ${d.sender} | ເຖິງ: ${d.recipient}\nໝວດເອກະສານ: ${d.category} (${d.documentType})\nເນື້ອໃນສະກັດຈາກໄຟລ໌ສະແກນ: ເອກະສານທາງການຂອງ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE) ກ່ຽວກັບ ${d.subject} ເພື່ອຄົ້ນຄວ້າ ແລະ ຈັດຕັ້ງປະຕິບັດຕາມລະບຽບການ.`;
        }
        if (!d.tags || d.tags.length === 0) {
          d.tags = [d.category, d.documentType, d.direction === 'INCOMING' ? 'ຂາເຂົ້າ' : 'ຂາອອກ'];
        }
        if (d.status !== 'COMPLETED' && d.status !== 'ARCHIVED') {
          const existingDueMs = d.dueDate ? new Date(d.dueDate).getTime() : NaN;
          if (!d.dueDate || isNaN(existingDueMs) || existingDueMs < nowMs - 12 * 3600 * 1000) {
            if (d.id === 'doc-in-001') {
              // Critical: ~3.5 hours remaining (< 6 hours)
              d.dueDate = new Date(nowMs + 3.5 * 3600 * 1000).toISOString();
            } else if (d.id === 'doc-out-001') {
              // High Urgency: ~14 hours remaining (6 - 24 hours)
              d.dueDate = new Date(nowMs + 14 * 3600 * 1000).toISOString();
            } else if (d.id === 'doc-in-003') {
              // High Urgency: ~21 hours remaining (6 - 24 hours)
              d.dueDate = new Date(nowMs + 21 * 3600 * 1000).toISOString();
            } else if (d.id === 'doc-in-002') {
              // Moderate / Approaching: ~38 hours remaining (24 - 48 hours)
              d.dueDate = new Date(nowMs + 38 * 3600 * 1000).toISOString();
            } else {
              // Default based on priority
              const hoursOffset =
                d.priority === 'URGENT' ? 5 : d.priority === 'HIGH' ? 18 : 36 + (idx % 10);
              d.dueDate = new Date(nowMs + hoursOffset * 3600 * 1000).toISOString();
            }
          }
        }
      });

      const foldersJson = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      this.folders = foldersJson ? JSON.parse(foldersJson) : INITIAL_FOLDERS;

      const notifsJson = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      this.notifications = notifsJson ? JSON.parse(notifsJson) : INITIAL_NOTIFICATIONS;

      const logsJson = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      this.auditLogs = logsJson ? JSON.parse(logsJson) : INITIAL_AUDIT_LOGS;

      const emailAlertsJson = localStorage.getItem(STORAGE_KEYS.EMAIL_ALERTS);
      this.emailAlerts = emailAlertsJson ? JSON.parse(emailAlertsJson) : [];

      const savedSearchesJson = localStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES);
      this.savedSearches = savedSearchesJson ? JSON.parse(savedSearchesJson) : INITIAL_SAVED_SEARCHES;
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
      this.documents = INITIAL_DOCUMENTS;
      this.folders = INITIAL_FOLDERS;
      this.notifications = INITIAL_NOTIFICATIONS;
      this.auditLogs = INITIAL_AUDIT_LOGS;
      this.emailAlerts = [];
      this.savedSearches = INITIAL_SAVED_SEARCHES;
    }
  }

  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(this.documents));
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(this.folders));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEYS.EMAIL_ALERTS, JSON.stringify(this.emailAlerts));
      localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(this.savedSearches));
      if (auth.currentUser) {
        this.syncAllDocumentsToCloud();
      }
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  getDocuments(): DocumentRecord[] {
    return [...this.documents];
  }

  getDocumentById(id: string): DocumentRecord | undefined {
    return this.documents.find(d => d.id === id);
  }

  getFolders(): EStorageFolder[] {
    return [...this.folders];
  }

  getNotifications(userId?: string): NotificationItem[] {
    if (!userId) return [...this.notifications];
    return this.notifications.filter(n => n.userId === userId || n.userId === 'ALL');
  }

  getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs];
  }

  addAuditLog(entry: Omit<AuditLogItem, 'id' | 'timestamp' | 'ipAddress' | 'device'>) {
    const newLog: AuditLogItem = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.' + Math.floor(10 + Math.random() * 80),
      device: typeof navigator !== 'undefined' ? `${navigator.platform} / Browser` : 'Enterprise Client',
    };
    this.auditLogs.unshift(newLog);
    this.saveState();
  }

  addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): NotificationItem {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.notifications.unshift(newNotif);
    this.saveState();
    return newNotif;
  }

  markNotificationAsRead(id: string) {
    const target = this.notifications.find(n => n.id === id);
    if (target) {
      target.read = true;
      this.saveState();
    }
  }

  markAllNotificationsAsRead(userId?: string) {
    this.notifications.forEach(n => {
      if (!userId || n.userId === userId || n.userId === 'ALL') {
        n.read = true;
      }
    });
    this.saveState();
  }

  getEmailAlerts(): EmailAlertRecord[] {
    return [...this.emailAlerts];
  }

  getEmailAlertsByDocumentId(documentId: string): EmailAlertRecord[] {
    return this.emailAlerts.filter(a => a.documentId === documentId);
  }

  findRecipientForStep(step: WorkflowStepInstance): User {
    if (step.assignedUserId) {
      const u = INITIAL_USERS.find(user => user.id === step.assignedUserId);
      if (u) return u;
    }
    // Match by role
    const matched = INITIAL_USERS.find(u => u.role === step.requiredRole);
    return matched || INITIAL_USERS[0];
  }

  sendAutomatedEmailAlert(
    doc: DocumentRecord,
    targetStep: WorkflowStepInstance,
    sender: User,
    actionType: 'REVIEW' | 'SIGN' | 'STAFF_VERIFY' | 'ARCHIVE' | 'RETURNED' = 'REVIEW',
    note?: string
  ): EmailAlertRecord {
    const recipient = this.findRecipientForStep(targetStep);
    const nowIso = new Date().toISOString();
    const alertId = `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const actionLabel =
      actionType === 'SIGN'
        ? 'ລົງລາຍເຊັນ E-Signature'
        : actionType === 'STAFF_VERIFY'
        ? 'ອອກໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ'
        : actionType === 'ARCHIVE'
        ? 'ບັນທຶກເຂົ້າຄັງ E-Storage'
        : actionType === 'RETURNED'
        ? 'ກວດສອບເອກະສານທີ່ຖືກສົ່ງຄືນ'
        : 'ກວດສອບ ແລະ ໃຫ້ທິດຊີ້ນຳ';

    const subject =
      actionType === 'RETURNED'
        ? `[ແຈ້ງເຕືອນສົ່ງຄືນ] ເອກະສານເລກທີ ${doc.documentNumber}: ${doc.subject}`
        : `[ແຈ້ງເຕືອນດ່ວນ] ເອກະສານເລກທີ ${doc.documentNumber} ລໍຖ້າ: ${actionLabel} (${targetStep.stepNameLao})`;

    const emailBodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; padding: 24px 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 19px; font-weight: bold; letter-spacing: -0.5px;">ລະບົບຈັດການເອກະສານຂາເຂົ້າ-ຂາອອກ (E-Document System)</h2>
          <p style="margin: 6px 0 0; font-size: 12px; opacity: 0.95;">ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (Lao Holding State Enterprise)</p>
          <div style="display: inline-block; margin-top: 10px; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold;">
            📧 ລະບົບແຈ້ງເຕືອນອີເມວອັດຕະໂນມັດ (Automated Workflow Alert)
          </div>
        </div>
        <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <p style="margin-top: 0; font-size: 15px;"><strong>ຮຽນ:</strong> ${recipient.fullName} (${recipient.positionLao})</p>
          <p style="color: #475569;">
            ລະບົບຂໍແຈ້ງເຕືອນວ່າ ທ່ານມີເອກະສານທາງການສະບັບໃໝ່ທີ່ຖືກສົ່ງຕໍ່ມາຮອດທ່ານ ເພື່ອດຳເນີນການໃນຂັ້ນຕອນຕໍ່ໄປ:
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 18px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 600;">ເລກທີເອກະສານ:</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #2563eb; font-size: 14px;">${doc.documentNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">ຫົວຂໍ້ / ເລື່ອງ:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${doc.subject}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">ປະເພດ / ທິດທາງ:</td>
                <td style="padding: 6px 0; color: #334155;">${doc.direction === 'INCOMING' ? '📥 ເອກະສານຂາເຂົ້າ' : '📤 ເອກະສານຂາອອກ'} (${doc.documentType})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">ລະດັບຄວາມດ່ວນ:</td>
                <td style="padding: 6px 0;">${
                  doc.priority === 'URGENT'
                    ? '<span style="color: #e11d48; font-weight: bold;">🚨 ດ່ວນທີ່ສຸດ (URGENT)</span>'
                    : doc.priority === 'HIGH'
                    ? '<span style="color: #ea580c; font-weight: bold;">🟠 ສູງ (HIGH)</span>'
                    : doc.priority === 'LOW'
                    ? '<span style="color: #16a34a; font-weight: bold;">🟢 ຕ່ຳ (LOW)</span>'
                    : '<span style="color: #2563eb; font-weight: bold;">🔵 ປານກາງ (MEDIUM)</span>'
                }</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">ຂັ້ນຕອນຕໍ່ໄປ:</td>
                <td style="padding: 6px 0; color: #4338ca; font-weight: bold;">${targetStep.stepNameLao}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">ຜູ້ສົ່ງຕໍ່ / ຜູ້ດຳເນີນການ:</td>
                <td style="padding: 6px 0; color: #334155;">${sender.fullName} (${sender.positionLao})</td>
              </tr>
              ${note ? `
              <tr>
                <td style="padding: 6px 0; color: #b45309; font-weight: 600; vertical-align: top;">ທິດຊີ້ນຳ/ຄຳເຫັນ:</td>
                <td style="padding: 6px 0; color: #b45309; font-style: italic;">"${note}"</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; color: #1e40af;">
            ⚡ <strong>ການດຳເນີນການທີ່ຕ້ອງການ:</strong> ກະລຸນາກວດສອບເນື້ອໃນເອກະສານ ແລະ ດຳເນີນການ <strong>${actionLabel}</strong> ຜ່ານລະບົບດິຈິທັລ.
          </div>

          <div style="text-align: center; margin: 26px 0 16px;">
            <a href="#" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
              🔗 ເຂົ້າສູ່ລະບົບເພື່ອກວດສອບ ແລະ ດຳເນີນການ
            </a>
          </div>
          <p style="font-size: 12px; text-align: center; color: #94a3b8; margin: 0;">
            ລະຫັດອ້າງອີງເອກະສານ: ${doc.id} • ວັນທີສົ່ງແຈ້ງເຕືອນ: ${new Date().toLocaleString('lo-LA')}
          </p>
        </div>
        <div style="background: #f8fafc; padding: 14px 20px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
          ອີເມວນີ້ສົ່ງອອກໂດຍອັດຕະໂນມັດຈາກລະບົບ E-Document System ລັດວິສາຫະກິດຖືຮຸ້ນລາວ • ຕິດຕໍ່ IT Support 020 5551 2345
        </div>
      </div>
    `.trim();

    const emailAlert: EmailAlertRecord = {
      id: alertId,
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      documentSubject: doc.subject,
      senderName: `${sender.fullName} (${sender.positionLao})`,
      recipientEmail: recipient.email,
      recipientName: recipient.fullName,
      recipientRole: recipient.role,
      stepOrder: targetStep.stepOrder,
      stepNameLao: targetStep.stepNameLao,
      actionRequired: actionType,
      subject,
      emailBodyHtml,
      sentAt: nowIso,
      status: 'DELIVERED',
    };

    this.emailAlerts.unshift(emailAlert);
    this.saveState();
    return emailAlert;
  }

  createDocument(
    user: User,
    data: {
      direction: DocumentTypeDirection;
      documentNumber: string;
      referenceNumber?: string;
      referenceDate?: string;
      documentDate: string;
      receivedDate?: string;
      dueDate?: string;
      subject: string;
      category: string;
      documentType: string;
      priority: DocumentPriority;
      purpose: DocumentPurpose;
      purposeNote?: string;
      departmentId: string;
      departmentName: string;
      sender: string;
      recipient: string;
      instructions?: string;
      comments?: string;
      ocrText?: string;
      tags?: string[];
      attachments?: {
        fileName: string;
        fileSize: number;
        fileType: string;
        url: string;
        thumbnailUrl?: string;
        storageSource?: 'FIREBASE_STORAGE' | 'LOCAL';
        storagePath?: string;
      }[];
    }
  ): DocumentRecord {
    const isIncoming = data.direction === 'INCOMING';
    const workflowSteps = isIncoming ? createIncomingWorkflowSteps() : createOutgoingWorkflowSteps();

    const defaultDueHours =
      data.priority === 'URGENT' ? 6 : data.priority === 'HIGH' ? 20 : data.priority === 'LOW' ? 72 : 42;
    const computedDueDate =
      data.dueDate || new Date(Date.now() + defaultDueHours * 3600 * 1000).toISOString();

    const newDoc: DocumentRecord = {
      id: `doc-${data.direction.toLowerCase()}-${Date.now()}`,
      direction: data.direction,
      documentNumber: data.documentNumber,
      referenceNumber: data.referenceNumber,
      referenceDate: data.referenceDate,
      documentDate: data.documentDate,
      receivedDate: data.receivedDate,
      dueDate: computedDueDate,
      subject: data.subject,
      category: data.category,
      documentType: data.documentType,
      priority: data.priority,
      purpose: data.purpose,
      purposeNote: data.purposeNote,
      departmentId: data.departmentId,
      departmentName: data.departmentName,
      sender: data.sender,
      recipient: data.recipient,
      instructions: data.instructions,
      comments: data.comments,
      ocrText: data.ocrText,
      tags: data.tags || [data.category, data.documentType],
      status: 'IN_PROGRESS',
      currentStepOrder: isIncoming ? 2 : 2, // Step 1 is already creation/registration by staff
      workflowSteps,
      attachments: (data.attachments || []).map((a, idx) => ({
        id: `att-${Date.now()}-${idx}`,
        fileName: a.fileName,
        fileSize: a.fileSize,
        fileType: a.fileType,
        uploadDate: new Date().toISOString(),
        uploadedBy: user.fullName,
        url: a.url,
        thumbnailUrl: a.thumbnailUrl,
        storageSource: a.storageSource,
        storagePath: a.storagePath,
      })),
      signatures: [],
      currentVersion: 1,
      versions: [
        {
          id: `ver-${Date.now()}-1`,
          versionNumber: 1,
          versionTag: 'v1.0',
          timestamp: new Date().toISOString(),
          authorId: user.id,
          authorName: user.fullName,
          authorRole: user.role,
          changeSummary: 'ສ້າງເອກະສານສະບັບທຳອິດ (Initial document creation)',
          changeType: 'INITIAL',
          snapshot: {
            subject: data.subject,
            category: data.category,
            documentType: data.documentType,
            priority: data.priority,
            purpose: data.purpose,
            purposeNote: data.purposeNote,
            instructions: data.instructions,
            comments: data.comments,
            ocrText: data.ocrText,
            tags: data.tags || [data.category, data.documentType],
            sender: data.sender,
            recipient: data.recipient,
            referenceNumber: data.referenceNumber,
            referenceDate: data.referenceDate,
            attachments: (data.attachments || []).map((a, idx) => ({
              id: `att-${Date.now()}-${idx}`,
              fileName: a.fileName,
              fileSize: a.fileSize,
              fileType: a.fileType,
              uploadDate: new Date().toISOString(),
              uploadedBy: user.fullName,
              url: a.url,
            })),
          },
        },
      ],
      createdBy: user.id,
      createdByName: user.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.documents.unshift(newDoc);

    // Audit log
    this.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      userPosition: user.positionLao,
      action: 'CREATE',
      documentId: newDoc.id,
      documentNumber: newDoc.documentNumber,
      details: `ສ້າງ/ລົງທະບຽນເອກະສານ${isIncoming ? 'ຂາເຂົ້າ' : 'ຂາອອກ'} ເລກທີ ${newDoc.documentNumber}`,
      newValue: `Subject: ${newDoc.subject}`,
    });

    // Notify the user in step 2
    const step2 = newDoc.workflowSteps.find(s => s.stepOrder === 2);
    if (step2) {
      this.addNotification({
        userId: 'ALL',
        title: `ເອກະສານ${isIncoming ? 'ຂາເຂົ້າ' : 'ຂາອອກ'}ໃໝ່ ລໍຖ້າດຳເນີນການ`,
        message: `ເອກະສານເລກທີ ${newDoc.documentNumber} (${newDoc.subject}) ລໍຖ້າ ${step2.stepNameLao}`,
        documentId: newDoc.id,
        documentNumber: newDoc.documentNumber,
        type: 'ACTION_REQUIRED',
      });
    }

    // Check Saved Searches with notifyOnMatch === true and trigger real-time alerts
    this.savedSearches.forEach(saved => {
      if (saved.notifyOnMatch && this.doesDocumentMatchCriteria(newDoc, saved.criteria)) {
        saved.lastMatchedAt = new Date().toISOString();
        saved.lastMatchedDocNumber = newDoc.documentNumber;
        saved.lastMatchedDocId = newDoc.id;

        this.addNotification({
          userId: 'ALL',
          title: `🔔 ພົບເອກະສານໃໝ່ກົງກັບ Saved Search: "${saved.name}"`,
          message: `ເອກະສານເລກທີ ${newDoc.documentNumber} (${newDoc.subject}) ກົງກັບເງື່ອນໄຂການຄົ້ນຫາທີ່ບັນທຶກໄວ້ "${saved.name}"`,
          documentId: newDoc.id,
          documentNumber: newDoc.documentNumber,
          type: 'WARNING',
        });
      }
    });

    this.saveState();
    return newDoc;
  }

  doesDocumentMatchCriteria(d: DocumentRecord, c: SavedSearchCriteria): boolean {
    if (c.direction !== 'ALL' && d.direction !== c.direction) {
      return false;
    }
    if (c.query && c.query.trim()) {
      const q = c.query.trim().toLowerCase();
      const hay = `${d.documentNumber} ${d.subject} ${d.sender} ${d.recipient} ${d.departmentName} ${d.category} ${d.documentType} ${d.ocrText || ''} ${(d.tags || []).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (c.category && c.category !== 'ALL' && d.category !== c.category) {
      return false;
    }
    if (c.priority && c.priority !== 'ALL') {
      if (c.priority === 'MEDIUM') {
        if (d.priority !== 'MEDIUM' && d.priority !== 'NORMAL') return false;
      } else if (d.priority !== c.priority) {
        return false;
      }
    }
    if (c.status && c.status !== 'ALL') {
      if (c.status === 'PENDING' && d.status !== 'IN_PROGRESS' && d.status !== 'REGISTERED') return false;
      if (c.status === 'RETURNED' && d.status !== 'RETURNED') return false;
      if (c.status === 'COMPLETED' && d.status !== 'COMPLETED' && d.status !== 'ARCHIVED') return false;
    }
    return true;
  }

  getSavedSearches(direction?: 'ALL' | DocumentTypeDirection): SavedSearchItem[] {
    if (!direction || direction === 'ALL') return [...this.savedSearches];
    return this.savedSearches.filter(
      s => s.criteria.direction === direction || s.criteria.direction === 'ALL'
    );
  }

  getMatchingDocumentCount(criteria: SavedSearchCriteria): number {
    return this.documents.filter(d => this.doesDocumentMatchCriteria(d, criteria)).length;
  }

  addSavedSearch(
    user: User,
    data: { name: string; criteria: SavedSearchCriteria; notifyOnMatch: boolean }
  ): SavedSearchItem {
    const matchingDocs = this.documents.filter(d => this.doesDocumentMatchCriteria(d, data.criteria));
    const latestMatch = matchingDocs[0];
    const newItem: SavedSearchItem = {
      id: `ss-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: data.name.trim(),
      userId: user.id,
      userName: user.fullName,
      criteria: { ...data.criteria },
      notifyOnMatch: data.notifyOnMatch,
      lastMatchedAt: latestMatch ? latestMatch.createdAt : undefined,
      lastMatchedDocNumber: latestMatch ? latestMatch.documentNumber : undefined,
      lastMatchedDocId: latestMatch ? latestMatch.id : undefined,
      createdAt: new Date().toISOString(),
    };
    this.savedSearches.unshift(newItem);
    this.saveState();
    if (auth.currentUser) {
      const path = 'saved_searches';
      setDoc(
        doc(db, path, newItem.id),
        JSON.parse(JSON.stringify({ ...newItem, ownerUid: auth.currentUser.uid }))
      ).catch(err => handleFirestoreError(err, OperationType.CREATE, `${path}/${newItem.id}`));
    }
    return newItem;
  }

  toggleSavedSearchNotification(id: string): SavedSearchItem | undefined {
    const target = this.savedSearches.find(s => s.id === id);
    if (target) {
      target.notifyOnMatch = !target.notifyOnMatch;
      this.saveState();
      if (auth.currentUser) {
        const path = 'saved_searches';
        setDoc(
          doc(db, path, target.id),
          JSON.parse(JSON.stringify({ ...target, ownerUid: auth.currentUser.uid }))
        ).catch(err => handleFirestoreError(err, OperationType.UPDATE, `${path}/${target.id}`));
      }
    }
    return target;
  }

  deleteSavedSearch(id: string): void {
    this.savedSearches = this.savedSearches.filter(s => s.id !== id);
    this.saveState();
    if (auth.currentUser) {
      const path = 'saved_searches';
      deleteDoc(doc(db, path, id)).catch(err =>
        handleFirestoreError(err, OperationType.DELETE, `${path}/${id}`)
      );
    }
  }

  /**
   * Dispatches a workflow action with strict central authorization verification!
   */
  advanceWorkflowStep(
    documentId: string,
    user: User,
    payload: {
      action: WorkflowActionType;
      comment?: string;
      instruction?: string;
      signatureImage?: string;
      finalAttachment?: { fileName: string; fileSize: number; fileType: string };
    }
  ): { success: boolean; error?: AuthorizationCheckResult; document?: DocumentRecord } {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) {
      return {
        success: false,
        error: {
          allowed: false,
          code: 'STEP_NOT_CURRENT',
          messageLao: 'ບໍ່ພົບເອກະສານໃນລະບົບ',
          messageEn: 'Document not found',
        },
      };
    }

    // CENTRAL AUTHORIZATION INTERCEPTION
    const authCheck = checkWorkflowStepAuthorization(user, doc, payload.action);
    if (!authCheck.allowed) {
      // Record security audit log for unauthorized attempt
      this.addAuditLog({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        userPosition: user.positionLao,
        action: 'UNAUTHORIZED_ATTEMPT',
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        details: `ພະຍາຍາມດຳເນີນການ '${payload.action}' ໂດຍບໍ່ມີສິດໃນຂັ້ນຕອນທີ ${doc.currentStepOrder}`,
        oldValue: `User Role: ${user.role}`,
        newValue: `Required Role: ${authCheck.requiredRole}`,
      });
      return { success: false, error: authCheck };
    }

    const currentStepIndex = doc.workflowSteps.findIndex(s => s.stepOrder === doc.currentStepOrder);
    if (currentStepIndex === -1) {
      return {
        success: false,
        error: {
          allowed: false,
          code: 'STEP_NOT_CURRENT',
          messageLao: 'ບໍ່ພົບຂັ້ນຕອນປັດຈຸບັນ',
          messageEn: 'Step not found',
        },
      };
    }

    const currentStep = doc.workflowSteps[currentStepIndex];
    const nowIso = new Date().toISOString();

    // Handle E-Signature
    let signatureRecord = undefined;
    if (payload.action === 'SIGN' && payload.signatureImage) {
      const verificationCode = `LA-SIG-${Math.floor(100000 + Math.random() * 900000)}`;

      // Resolve official signer for this workflow step:
      // When signing:
      // Step 2 (ເຊັນຄັ້ງທີ 1): ຫົວໜ້າພະແນກ (ທ່ານ ປັນຍາສິດ ວົງສຸລີ)
      // Step 3 (ເຊັນຄັ້ງທີ 2): ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ (ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ / ທ່ານ ສອນປະສິດ)
      // Step 4 (ເຊັນຄັ້ງທີ 3): ຫົວໜ້າໜ່ວຍງານ (ທ່ານ ວຽງຄຳມະໂນຈິດ / ທ່ານ ຄຳແກ້ວ ພິມວົງສາ / ທ່ານ ມະໂນລົບ)
      // NEVER ຜູ້ຄຸ້ມຄອງລະບົບ (System Administrator)
      let effectiveSignerId = user.id;
      let effectiveSignerName = user.fullName;
      let effectivePosition = user.positionLao;

      if (currentStep.stepOrder === 2 || currentStep.requiredRole === 'DEPARTMENT_HEAD') {
        // ເຊັນຄັ້ງທີ 1: ຫົວໜ້າພະແນກ
        if (user.role === 'ADMIN' || !user.fullName.includes('ປັນຍາສິດ')) {
          effectiveSignerId = 'usr-dept-head';
          effectiveSignerName = 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ';
          effectivePosition = 'ຫົວໜ້າພະແນກ (Department Head)';
        }
      } else if (currentStep.stepOrder === 3 || currentStep.requiredRole === 'DEPUTY_DEPARTMENT_HEAD') {
        // ເຊັນຄັ້ງທີ 2: ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ ໃຫ້ທິດຊີ້ນຳ + E-Signature
        if (user.role === 'ADMIN' || user.role !== 'DEPUTY_DEPARTMENT_HEAD') {
          effectiveSignerId = 'usr-deputy-dept-head-eng';
          effectiveSignerName = 'ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ';
          effectivePosition = 'ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານວິສະວະກຳ';
        }
      } else if (currentStep.stepOrder === 4 || currentStep.requiredRole === 'UNIT_HEAD') {
        // ເຊັນຄັ້ງທີ 3: ຫົວໜ້າໜ່ວຍງານ ໃຫ້ຄຳເຫັນ + E-Signature
        if (user.role === 'ADMIN' || user.role !== 'UNIT_HEAD') {
          effectiveSignerId = 'usr-unit-eng';
          effectiveSignerName = 'ທ່ານ ວຽງຄຳມະໂນຈິດ';
          effectivePosition = 'ຫົວໜ້າໜ່ວຍງານວິສະວະກຳ (Engineering Unit Head)';
        }
      } else if (user.role === 'ADMIN') {
        const officer = INITIAL_USERS.find(u => u.role === currentStep.requiredRole);
        if (officer) {
          effectiveSignerId = officer.id;
          effectiveSignerName = officer.fullName;
          effectivePosition = officer.positionLao;
        }
      }

      signatureRecord = {
        id: `sig-${Date.now()}`,
        documentId: doc.id,
        signerId: effectiveSignerId,
        signerName: effectiveSignerName,
        positionLao: effectivePosition,
        signedAt: nowIso,
        signatureImage: payload.signatureImage,
        verificationCode,
        ipAddress: '192.168.1.' + Math.floor(10 + Math.random() * 80),
      };
      doc.signatures.push(signatureRecord);
      currentStep.signature = signatureRecord;
      currentStep.signatureId = signatureRecord.id;

      this.addAuditLog({
        userId: effectiveSignerId,
        userName: effectiveSignerName,
        userRole: currentStep.requiredRole,
        userPosition: effectivePosition,
        action: 'SIGN',
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        details: `ລົງລາຍເຊັນ E-Signature (${currentStep.stepNameLao}) ສຳເລັດ ໂດຍ ${effectiveSignerName} (${effectivePosition}) [ລະຫັດກວດສອບ: ${verificationCode}]`,
        newValue: `Verification Code: ${verificationCode}`,
      });
    }

    // Handle file attachment if uploaded
    if (payload.finalAttachment) {
      doc.attachments.push({
        id: `att-final-${Date.now()}`,
        fileName: payload.finalAttachment.fileName,
        fileSize: payload.finalAttachment.fileSize,
        fileType: payload.finalAttachment.fileType,
        uploadDate: nowIso,
        uploadedBy: user.fullName,
        url: '#',
      });
    }

    // Handle Staff Verification Certificate ("ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ")
    const isStaffVerificationStep =
      payload.action === 'STAFF_VERIFY' ||
      currentStep.stepNameLao.includes('ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງ');

    if (isStaffVerificationStep) {
      const certNo = `STF-CERT-${Math.floor(100000 + Math.random() * 900000)}`;
      doc.staffVerification = {
        id: `stf-ver-${Date.now()}`,
        documentId: doc.id,
        verifiedByUserId: user.id,
        verifiedByUserName: user.fullName,
        verifiedByPosition: user.positionLao || 'ວິຊາການສາລະບັນ (Staff)',
        verifiedAt: nowIso,
        certificateNumber: certNo,
        verificationNote: payload.comment || 'ພະນັກງານ (Staff) ໄດ້ກວດກາຄວາມຖືກຕ້ອງຂອງລາຍເຊັນ ແລະ ເອກະສານຄົບຖ້ວນຖືກຕ້ອງ 100%',
        attachedFileName: payload.finalAttachment?.fileName,
        status: 'VERIFIED',
      };
    }

    // Mark current step as completed
    currentStep.status = 'COMPLETED';
    currentStep.completedAt = nowIso;
    currentStep.completedByUserId = signatureRecord ? signatureRecord.signerId : user.id;
    currentStep.completedByUserName = signatureRecord ? signatureRecord.signerName : user.fullName;
    currentStep.completedByPosition = signatureRecord ? signatureRecord.positionLao : user.positionLao;
    currentStep.actionTaken = isStaffVerificationStep ? 'STAFF_VERIFY' : payload.action === 'SIGN' ? 'SIGN' : payload.action === 'FORWARD' ? 'FORWARD' : payload.action === 'ARCHIVE' ? 'ARCHIVE' : 'APPROVE';
    currentStep.comment = payload.comment || currentStep.comment;
    currentStep.instruction = payload.instruction || currentStep.instruction;

    // Persist comment to document commentsList and create corresponding audit log entry
    const commentOrInstruction = payload.instruction || payload.comment;
    if (commentOrInstruction && commentOrInstruction.trim()) {
      if (!doc.commentsList) doc.commentsList = [];
      const commentUser = signatureRecord ? {
        id: signatureRecord.signerId,
        fullName: signatureRecord.signerName,
        role: currentStep.requiredRole,
        positionLao: signatureRecord.positionLao,
      } : user;

      doc.commentsList.push({
        id: `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        documentId: doc.id,
        userId: commentUser.id,
        userName: commentUser.fullName,
        userRole: commentUser.role,
        userPosition: commentUser.positionLao,
        comment: commentOrInstruction.trim(),
        createdAt: nowIso,
      });

      this.addAuditLog({
        userId: commentUser.id,
        userName: commentUser.fullName,
        userRole: commentUser.role,
        userPosition: commentUser.positionLao,
        action: 'COMMENT',
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        details: `ບັນທຶກຄຳເຫັນ/ທິດຊີ້ນຳໃນຂັ້ນຕອນ "${currentStep.stepNameLao}": "${commentOrInstruction.trim()}"`,
        newValue: `Comment: ${commentOrInstruction.trim()}`,
      });
    }

    // Advance to next step or complete workflow
    const totalSteps = doc.workflowSteps.length;
    const shouldArchiveNow =
      payload.action === 'ARCHIVE' ||
      doc.currentStepOrder >= totalSteps;

    if (shouldArchiveNow) {
      // Complete all steps up to the end
      for (let i = currentStepIndex; i < totalSteps; i++) {
        doc.workflowSteps[i].status = 'COMPLETED';
        doc.workflowSteps[i].completedAt = nowIso;
        doc.workflowSteps[i].completedByUserId = user.id;
        doc.workflowSteps[i].completedByUserName = user.fullName;
        doc.workflowSteps[i].completedByPosition = user.positionLao;
        doc.workflowSteps[i].actionTaken = 'ARCHIVE';
      }
      doc.currentStepOrder = totalSteps;
      doc.status = 'COMPLETED';
      doc.completedAt = nowIso;
      // Auto-archive into E-Storage
      doc.eStorageFolderId = doc.direction === 'INCOMING' ? 'folder-2026-in' : 'folder-2026-out';
      doc.eStorageArchivedAt = nowIso;

      this.addAuditLog({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        userPosition: user.positionLao,
        action: 'ARCHIVE',
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        details: `ພະນັກງານ (Staff) ບັນທຶກເອກະສານເຂົ້າຄັງ E-Storage ສຳເລັດສົມບູນ`,
        newValue: `Folder: ${doc.eStorageFolderId}`,
      });

      this.addNotification({
        userId: 'ALL',
        title: 'ເອກະສານສຳເລັດສົມບູນ (E-Storage Archived)',
        message: `ເອກະສານເລກທີ ${doc.documentNumber} ສຳເລັດທຸກຂັ້ນຕອນແລ້ວ ແລະ ບັນທຶກໄວ້ຄັງເອກະສານ E-Storage`,
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        type: 'COMPLETED',
      });

      // Send automated email alert for completed/archived document
      const lastStep = doc.workflowSteps[totalSteps - 1];
      if (lastStep) {
        this.sendAutomatedEmailAlert(doc, lastStep, user, 'ARCHIVE');
      }
    } else {
      doc.currentStepOrder += 1;
      const nextStepIndex = doc.workflowSteps.findIndex(s => s.stepOrder === doc.currentStepOrder);
      if (nextStepIndex !== -1) {
        doc.workflowSteps[nextStepIndex].status = 'CURRENT';
        const nextStep = doc.workflowSteps[nextStepIndex];

        // Determine action required for next step
        const nextActionType: 'SIGN' | 'STAFF_VERIFY' | 'REVIEW' =
          nextStep.stepNameLao.includes('E-Signature') || nextStep.stepNameLao.includes('ເຊັນ')
            ? 'SIGN'
            : nextStep.stepNameLao.includes('ໃບຢັ້ງຢືນ')
            ? 'STAFF_VERIFY'
            : 'REVIEW';

        // Trigger Automated Email Alert to the next user in workflow
        const emailAlert = this.sendAutomatedEmailAlert(
          doc,
          nextStep,
          user,
          nextActionType,
          payload.comment || payload.instruction
        );

        // Notify next recipient
        this.addNotification({
          userId: 'ALL',
          title: `ເອກະສານຖືກສົ່ງຕໍ່: ${nextStep.stepNameLao}`,
          message: `ເອກະສານເລກທີ ${doc.documentNumber} ລໍຖ້າການດຳເນີນການ: ${nextStep.stepNameLao} ໂດຍ ${nextStep.requiredRole} [📧 ສົ່ງອີເມວແຈ້ງເຕືອນຫາ ${emailAlert.recipientEmail} ແລ້ວ]`,
          documentId: doc.id,
          documentNumber: doc.documentNumber,
          type: 'ACTION_REQUIRED',
          emailAlertSent: true,
          recipientEmail: emailAlert.recipientEmail,
          emailAlertId: emailAlert.id,
        });
      }

      this.addAuditLog({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        userPosition: user.positionLao,
        action: isStaffVerificationStep ? 'FORWARD' : payload.action === 'SIGN' ? 'SIGN' : 'FORWARD',
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        details: isStaffVerificationStep
          ? `ພະນັກງານ (Staff) ອອກໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ ແລະ ສົ່ງຕໍ່ໄປຍັງຂັ້ນຕອນ E-Storage Archive [📧 ສົ່ງອີເມວແຈ້ງເຕືອນອັດຕະໂນມັດສຳເລັດ]`
          : `ສົ່ງຕໍ່ເອກະສານໄປຍັງຂັ້ນຕອນທີ ${doc.currentStepOrder}: ${doc.workflowSteps[doc.currentStepOrder - 1]?.stepNameLao || ''} [📧 ສົ່ງອີເມວແຈ້ງເຕືອນອັດຕະໂນມັດສຳເລັດ]`,
        oldValue: `Step ${doc.currentStepOrder - 1}`,
        newValue: `Step ${doc.currentStepOrder}`,
      });
    }

    doc.updatedAt = nowIso;
    this.saveState();
    return { success: true, document: doc };
  }

  /**
   * Adds a persistent comment to a document, updating its visual state and creating an audit log entry.
   */
  addDocumentComment(
    documentId: string,
    user: User,
    commentText: string
  ): { success: boolean; document?: DocumentRecord; error?: string } {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) {
      return { success: false, error: 'ບໍ່ພົບເອກະສານ' };
    }
    const cleanComment = commentText.trim();
    if (!cleanComment) {
      return { success: false, error: 'ກະລຸນາປ້ອນຄຳເຫັນ' };
    }

    const nowIso = new Date().toISOString();
    if (!doc.commentsList) {
      doc.commentsList = [];
    }

    const newCommentItem = {
      id: `cmt-${Date.now()}`,
      documentId: doc.id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      userPosition: user.positionLao,
      comment: cleanComment,
      createdAt: nowIso,
    };

    doc.commentsList.push(newCommentItem);
    doc.comments = cleanComment;
    doc.updatedAt = nowIso;

    // Attach to current workflow step if present
    const curStep = doc.workflowSteps.find(s => s.stepOrder === doc.currentStepOrder);
    if (curStep) {
      curStep.comment = curStep.comment ? `${curStep.comment} | ${cleanComment}` : cleanComment;
    }

    // Create corresponding entry in the Audit Log
    this.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      userPosition: user.positionLao,
      action: 'COMMENT',
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      details: `ໃຫ້ຄຳເຫັນປະກອບຕໍ່ເອກະສານ: "${cleanComment}" ໂດຍ ${user.fullName} (${user.positionLao})`,
      newValue: `Comment: ${cleanComment}`,
    });

    this.saveState();
    return { success: true, document: doc };
  }

  /**
   * Return / Reject document workflow step with mandatory reason
   */
  returnWorkflowStep(
    documentId: string,
    user: User,
    reason: string
  ): { success: boolean; error?: AuthorizationCheckResult; document?: DocumentRecord } {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) {
      return {
        success: false,
        error: {
          allowed: false,
          code: 'STEP_NOT_CURRENT',
          messageLao: 'ບໍ່ພົບເອກະສານໃນລະບົບ',
          messageEn: 'Document not found',
        },
      };
    }

    const authCheck = checkWorkflowStepAuthorization(user, doc, 'RETURN');
    if (!authCheck.allowed) {
      this.addAuditLog({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        userPosition: user.positionLao,
        action: 'UNAUTHORIZED_ATTEMPT',
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        details: `ພະຍາຍາມສົ່ງຄືນ/ຕີກັບເອກະສານໂດຍບໍ່ມີສິດ`,
      });
      return { success: false, error: authCheck };
    }

    const currentStepIndex = doc.workflowSteps.findIndex(s => s.stepOrder === doc.currentStepOrder);
    if (currentStepIndex === -1 || doc.currentStepOrder <= 1) {
      return {
        success: false,
        error: {
          allowed: false,
          code: 'STEP_NOT_CURRENT',
          messageLao: 'ບໍ່ສາມາດສົ່ງຄືນໄດ້ ເນື່ອງຈາກຢູ່ຂັ້ນຕອນທຳອິດແລ້ວ',
          messageEn: 'Cannot return from first step',
        },
      };
    }

    const currentStep = doc.workflowSteps[currentStepIndex];
    currentStep.status = 'RETURNED';
    currentStep.comment = `[ຕີກັບ/ສົ່ງຄືນ]: ${reason}`;

    doc.rejectionReason = reason;
    doc.status = 'RETURNED';
    // Revert to previous step
    doc.currentStepOrder -= 1;
    const prevStepIndex = doc.workflowSteps.findIndex(s => s.stepOrder === doc.currentStepOrder);
    if (prevStepIndex !== -1) {
      doc.workflowSteps[prevStepIndex].status = 'CURRENT';
    }

    const nowIso = new Date().toISOString();
    doc.updatedAt = nowIso;

    // Audit log
    this.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      userPosition: user.positionLao,
      action: 'RETURN',
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      details: `ຕີກັບ/ສົ່ງຄືນເອກະສານໄປຫາຂັ້ນຕອນທີ ${doc.currentStepOrder} ດ້ວຍເຫດຜົນ: ${reason}`,
      oldValue: `Step ${doc.currentStepOrder + 1}`,
      newValue: `Returned to Step ${doc.currentStepOrder}`,
    });

    // Automated Email Alert on rejection / return
    const prevStep = doc.workflowSteps[prevStepIndex];
    let returnedEmailAlert: EmailAlertRecord | undefined;
    if (prevStep) {
      returnedEmailAlert = this.sendAutomatedEmailAlert(doc, prevStep, user, 'RETURNED', reason);
    }

    // Notification
    this.addNotification({
      userId: 'ALL',
      title: '⚠️ ເອກະສານຖືກສົ່ງຄືນ/ຕີກັບ',
      message: `ເອກະສານເລກທີ ${doc.documentNumber} ຖືກສົ່ງຄືນ. ເຫດຜົນ: ${reason}${returnedEmailAlert ? ` [📧 ສົ່ງອີເມວແຈ້ງເຕືອນຫາ ${returnedEmailAlert.recipientEmail} ແລ້ວ]` : ''}`,
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      type: 'RETURNED',
      emailAlertSent: Boolean(returnedEmailAlert),
      recipientEmail: returnedEmailAlert?.recipientEmail,
      emailAlertId: returnedEmailAlert?.id,
    });

    this.saveState();
    return { success: true, document: doc };
  }

  rejectDocument(documentId: string, user: User, reason: string) {
    return this.returnWorkflowStep(documentId, user, reason);
  }

  /**
   * Bulk Approve / Advance multiple documents simultaneously
   */
  bulkApproveDocuments(
    documentIds: string[],
    user: User,
    comment?: string
  ): { successCount: number; failedCount: number; errors: string[] } {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    documentIds.forEach(id => {
      const doc = this.documents.find(d => d.id === id);
      if (!doc) {
        failedCount++;
        errors.push(`Document ${id} not found`);
        return;
      }
      if (doc.status === 'COMPLETED' || doc.status === 'ARCHIVED') {
        failedCount++;
        errors.push(`${doc.documentNumber} is already completed`);
        return;
      }
      const res = this.advanceWorkflowStep(id, user, {
        action: 'FORWARD',
        comment: comment || 'ອະນຸມັດເປັນກຸ່ມ (Bulk Approved & Forwarded)',
      });
      if (res.success) {
        successCount++;
      } else {
        failedCount++;
        errors.push(`${doc.documentNumber}: ${res.error?.messageLao || 'Cannot approve'}`);
      }
    });

    if (successCount > 0) {
      this.addNotification({
        userId: user.id,
        title: 'ອະນຸມັດເອກະສານເປັນກຸ່ມສຳເລັດ',
        message: `ໄດ້ອະນຸມັດ ແລະ ສົ່ງຕໍ່ເອກະສານຈຳນວນ ${successCount} ສະບັບສຳເລັດແລ້ວ [📧 ລະບົບສົ່ງອີເມວແຈ້ງເຕືອນອັດຕະໂນມັດທຸກສະບັບ]`,
        type: 'APPROVED',
      });
    }

    return { successCount, failedCount, errors };
  }

  /**
   * Bulk Reject / Return multiple documents simultaneously
   */
  bulkRejectDocuments(
    documentIds: string[],
    user: User,
    reason: string
  ): { successCount: number; failedCount: number; errors: string[] } {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    documentIds.forEach(id => {
      const doc = this.documents.find(d => d.id === id);
      if (!doc) {
        failedCount++;
        return;
      }
      const res = this.rejectDocument(id, user, reason || 'ປະຕິເສດ / ສົ່ງຄືນເປັນກຸ່ມ (Bulk Returned)');
      if (res.success) {
        successCount++;
      } else {
        failedCount++;
        errors.push(`${doc.documentNumber}: ${res.error?.messageLao || 'Cannot reject'}`);
      }
    });

    if (successCount > 0) {
      this.addNotification({
        userId: user.id,
        title: 'ສົ່ງຄືນເອກະສານເປັນກຸ່ມ',
        message: `ໄດ້ສົ່ງຄືນ/ຕີກັບເອກະສານຈຳນວນ ${successCount} ສະບັບ. ເຫດຜົນ: ${reason}`,
        type: 'RETURNED',
      });
    }

    return { successCount, failedCount, errors };
  }

  /**
   * Bulk Move multiple documents to an E-Storage Folder
   */
  bulkMoveToFolder(
    documentIds: string[],
    targetFolderId: string,
    user: User
  ): { successCount: number; folderName?: string } {
    const folder = this.folders.find(f => f.id === targetFolderId);
    let successCount = 0;
    const nowIso = new Date().toISOString();

    documentIds.forEach(id => {
      const doc = this.documents.find(d => d.id === id);
      if (doc) {
        doc.eStorageFolderId = targetFolderId;
        doc.eStorageArchivedAt = nowIso;
        doc.updatedAt = nowIso;
        successCount++;

        this.addAuditLog({
          userId: user.id,
          userName: user.fullName,
          userRole: user.role,
          userPosition: user.positionLao,
          action: 'ARCHIVE',
          documentId: doc.id,
          documentNumber: doc.documentNumber,
          details: `ຍ້າຍເອກະສານເຂົ້າໂຟນເດີ E-Storage: ${folder ? folder.nameLao : targetFolderId} (Bulk Move)`,
          newValue: `Folder: ${targetFolderId}`,
        });
      }
    });

    // Update folder document counts
    this.folders.forEach(f => {
      f.documentCount = this.documents.filter(d => d.eStorageFolderId === f.id).length;
    });

    if (folder && successCount > 0) {
      this.addNotification({
        userId: user.id,
        title: 'ຍ້າຍເອກະສານສຳເລັດ',
        message: `ໄດ້ຍ້າຍເອກະສານ ${successCount} ສະບັບ ເຂົ້າສູ່ໂຟນເດີ "${folder.nameLao}" ສຳເລັດແລ້ວ`,
        type: 'INFO',
      });
    }

    this.saveState();
    return { successCount, folderName: folder?.nameLao };
  }

  getDocumentVersions(documentId: string): DocumentVersion[] {
    const doc = this.documents.find(d => d.id === documentId);
    return doc?.versions || [];
  }

  updateDocumentContent(
    documentId: string,
    updates: {
      subject?: string;
      category?: string;
      documentType?: string;
      priority?: DocumentPriority;
      purpose?: DocumentPurpose;
      purposeNote?: string;
      instructions?: string;
      comments?: string;
      sender?: string;
      recipient?: string;
      referenceNumber?: string;
      referenceDate?: string;
    },
    user: User,
    changeSummary?: string
  ): { success: boolean; versionTag?: string; error?: string } {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) return { success: false, error: 'Document not found' };

    // Apply updates
    if (updates.subject !== undefined) doc.subject = updates.subject;
    if (updates.category !== undefined) doc.category = updates.category;
    if (updates.documentType !== undefined) doc.documentType = updates.documentType;
    if (updates.priority !== undefined) doc.priority = updates.priority;
    if (updates.purpose !== undefined) doc.purpose = updates.purpose;
    if (updates.purposeNote !== undefined) doc.purposeNote = updates.purposeNote;
    if (updates.instructions !== undefined) doc.instructions = updates.instructions;
    if (updates.comments !== undefined) doc.comments = updates.comments;
    if (updates.sender !== undefined) doc.sender = updates.sender;
    if (updates.recipient !== undefined) doc.recipient = updates.recipient;
    if (updates.referenceNumber !== undefined) doc.referenceNumber = updates.referenceNumber;
    if (updates.referenceDate !== undefined) doc.referenceDate = updates.referenceDate;

    doc.updatedAt = new Date().toISOString();

    // Increment version
    if (!doc.versions) doc.versions = [];
    const nextVerNum = (doc.currentVersion || doc.versions.length || 1) + 1;
    doc.currentVersion = nextVerNum;
    const versionTag = `v${nextVerNum}.0`;

    const summary = changeSummary || 'ປັບປຸງເນື້ອໃນເອກະສານ (Updated document content)';

    const newVersion: DocumentVersion = {
      id: `ver-${doc.id}-${nextVerNum}-${Date.now()}`,
      versionNumber: nextVerNum,
      versionTag,
      timestamp: new Date().toISOString(),
      authorId: user.id,
      authorName: user.fullName,
      authorRole: user.role,
      changeSummary: summary,
      changeType: 'CONTENT_EDIT',
      snapshot: {
        subject: doc.subject,
        category: doc.category,
        documentType: doc.documentType,
        priority: doc.priority,
        purpose: doc.purpose,
        purposeNote: doc.purposeNote,
        instructions: doc.instructions,
        comments: doc.comments,
        sender: doc.sender,
        recipient: doc.recipient,
        referenceNumber: doc.referenceNumber,
        referenceDate: doc.referenceDate,
        attachments: [...doc.attachments],
      },
    };

    doc.versions.push(newVersion);

    // Audit log
    this.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      userPosition: user.positionLao,
      action: 'UPDATE',
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      details: `ດັດແກ້ເນື້ອໃນເອກະສານ (ສ້າງເວີຊັນໃໝ່ ${versionTag}): ${summary}`,
      newValue: `Version ${versionTag} | Subject: ${doc.subject}`,
    });

    // In-app notification
    this.addNotification({
      userId: 'ALL',
      title: `📝 ປັບປຸງເນື້ອໃນເອກະສານ (${versionTag})`,
      message: `ເອກະສານເລກທີ ${doc.documentNumber} ໄດ້ຮັບການປັບປຸງໂດຍ ${user.fullName} (${summary})`,
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      type: 'INFO',
    });

    this.saveState();
    return { success: true, versionTag };
  }

  addDocumentAttachment(
    documentId: string,
    attachment: { fileName: string; fileSize: number; fileType: string; url: string },
    user: User,
    note?: string
  ): { success: boolean; versionTag?: string; error?: string } {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) return { success: false, error: 'Document not found' };

    const newAtt = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      uploadDate: new Date().toISOString(),
      uploadedBy: user.fullName,
      url: attachment.url || '#',
    };

    doc.attachments.push(newAtt);
    doc.updatedAt = new Date().toISOString();

    // Increment version
    if (!doc.versions) doc.versions = [];
    const nextVerNum = (doc.currentVersion || doc.versions.length || 1) + 1;
    doc.currentVersion = nextVerNum;
    const versionTag = `v${nextVerNum}.0`;

    const summary = note ? `ເພີ່ມເອກະສານຄັດຕິດ: ${attachment.fileName} (${note})` : `ເພີ່ມເອກະສານຄັດຕິດ: ${attachment.fileName}`;

    const newVersion: DocumentVersion = {
      id: `ver-${doc.id}-${nextVerNum}-${Date.now()}`,
      versionNumber: nextVerNum,
      versionTag,
      timestamp: new Date().toISOString(),
      authorId: user.id,
      authorName: user.fullName,
      authorRole: user.role,
      changeSummary: summary,
      changeType: 'ATTACHMENT_ADD',
      snapshot: {
        subject: doc.subject,
        category: doc.category,
        documentType: doc.documentType,
        priority: doc.priority,
        purpose: doc.purpose,
        purposeNote: doc.purposeNote,
        instructions: doc.instructions,
        comments: doc.comments,
        sender: doc.sender,
        recipient: doc.recipient,
        referenceNumber: doc.referenceNumber,
        referenceDate: doc.referenceDate,
        attachments: [...doc.attachments],
      },
    };

    doc.versions.push(newVersion);

    this.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      userPosition: user.positionLao,
      action: 'UPDATE',
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      details: `ເພີ່ມໄຟລ໌ຄັດຕິດໃໝ່ (ເວີຊັນ ${versionTag}): ${attachment.fileName}`,
    });

    this.addNotification({
      userId: 'ALL',
      title: `📎 ເພີ່ມໄຟລ໌ຄັດຕິດໃໝ່ (${versionTag})`,
      message: `ເອກະສານເລກທີ ${doc.documentNumber} ໄດ້ເພີ່ມໄຟລ໌ ${attachment.fileName} ໂດຍ ${user.fullName}`,
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      type: 'INFO',
    });

    this.saveState();
    return { success: true, versionTag };
  }

  removeDocumentAttachment(
    documentId: string,
    attachmentId: string,
    user: User,
    reason?: string
  ): { success: boolean; versionTag?: string; error?: string } {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) return { success: false, error: 'Document not found' };

    const attIndex = doc.attachments.findIndex(a => a.id === attachmentId);
    if (attIndex === -1) return { success: false, error: 'Attachment not found' };

    const removedAtt = doc.attachments[attIndex];
    doc.attachments.splice(attIndex, 1);
    doc.updatedAt = new Date().toISOString();

    // Increment version
    if (!doc.versions) doc.versions = [];
    const nextVerNum = (doc.currentVersion || doc.versions.length || 1) + 1;
    doc.currentVersion = nextVerNum;
    const versionTag = `v${nextVerNum}.0`;

    const summary = reason ? `ລຶບໄຟລ໌ຄັດຕິດ: ${removedAtt.fileName} (ເຫດຜົນ: ${reason})` : `ລຶບໄຟລ໌ຄັດຕິດ: ${removedAtt.fileName}`;

    const newVersion: DocumentVersion = {
      id: `ver-${doc.id}-${nextVerNum}-${Date.now()}`,
      versionNumber: nextVerNum,
      versionTag,
      timestamp: new Date().toISOString(),
      authorId: user.id,
      authorName: user.fullName,
      authorRole: user.role,
      changeSummary: summary,
      changeType: 'ATTACHMENT_REMOVE',
      snapshot: {
        subject: doc.subject,
        category: doc.category,
        documentType: doc.documentType,
        priority: doc.priority,
        purpose: doc.purpose,
        purposeNote: doc.purposeNote,
        instructions: doc.instructions,
        comments: doc.comments,
        sender: doc.sender,
        recipient: doc.recipient,
        referenceNumber: doc.referenceNumber,
        referenceDate: doc.referenceDate,
        attachments: [...doc.attachments],
      },
    };

    doc.versions.push(newVersion);

    this.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      userPosition: user.positionLao,
      action: 'UPDATE',
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      details: `ລຶບໄຟລ໌ຄັດຕິດ (ເວີຊັນ ${versionTag}): ${removedAtt.fileName}`,
    });

    this.saveState();
    return { success: true, versionTag };
  }

  revertToVersion(
    documentId: string,
    targetVersionNumber: number,
    user: User,
    revertReason?: string
  ): { success: boolean; newVersionTag?: string; targetVersionTag?: string; error?: string } {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) return { success: false, error: 'Document not found' };

    if (!doc.versions || doc.versions.length === 0) {
      return { success: false, error: 'No version history available' };
    }

    const targetVer = doc.versions.find(v => v.versionNumber === targetVersionNumber);
    if (!targetVer) {
      return { success: false, error: `Version ${targetVersionNumber} not found` };
    }

    // Restore fields from snapshot
    doc.subject = targetVer.snapshot.subject;
    doc.category = targetVer.snapshot.category;
    doc.documentType = targetVer.snapshot.documentType;
    doc.priority = targetVer.snapshot.priority;
    doc.purpose = targetVer.snapshot.purpose;
    doc.purposeNote = targetVer.snapshot.purposeNote;
    doc.instructions = targetVer.snapshot.instructions;
    doc.comments = targetVer.snapshot.comments;
    doc.sender = targetVer.snapshot.sender;
    doc.recipient = targetVer.snapshot.recipient;
    if (targetVer.snapshot.referenceNumber !== undefined) doc.referenceNumber = targetVer.snapshot.referenceNumber;
    if (targetVer.snapshot.referenceDate !== undefined) doc.referenceDate = targetVer.snapshot.referenceDate;
    doc.attachments = [...targetVer.snapshot.attachments];
    doc.updatedAt = new Date().toISOString();

    // Increment and create new version representing the revert action
    const nextVerNum = (doc.currentVersion || doc.versions.length) + 1;
    doc.currentVersion = nextVerNum;
    const newVersionTag = `v${nextVerNum}.0`;

    const summary = revertReason
      ? `ຟື້ນຟູກັບຄືນສູ່ເວີຊັນ ${targetVer.versionTag} (${revertReason})`
      : `ຟື້ນຟູກັບຄືນສູ່ເວີຊັນ ${targetVer.versionTag} (Reverted to version ${targetVer.versionTag})`;

    const revertVersionRecord: DocumentVersion = {
      id: `ver-${doc.id}-${nextVerNum}-${Date.now()}`,
      versionNumber: nextVerNum,
      versionTag: newVersionTag,
      timestamp: new Date().toISOString(),
      authorId: user.id,
      authorName: user.fullName,
      authorRole: user.role,
      changeSummary: summary,
      changeType: 'REVERT',
      snapshot: {
        subject: doc.subject,
        category: doc.category,
        documentType: doc.documentType,
        priority: doc.priority,
        purpose: doc.purpose,
        purposeNote: doc.purposeNote,
        instructions: doc.instructions,
        comments: doc.comments,
        sender: doc.sender,
        recipient: doc.recipient,
        referenceNumber: doc.referenceNumber,
        referenceDate: doc.referenceDate,
        attachments: [...doc.attachments],
      },
    };

    doc.versions.push(revertVersionRecord);

    // Audit log
    this.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      userPosition: user.positionLao,
      action: 'UPDATE',
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      details: `ຟື້ນຟູເອກະສານກັບຄືນສູ່ເວີຊັນ ${targetVer.versionTag} (ເວີຊັນໃໝ່ ${newVersionTag}) ໂດຍ ${user.fullName}`,
      newValue: summary,
    });

    // In-app notification
    this.addNotification({
      userId: 'ALL',
      title: `🔄 ຟື້ນຟູເອກະສານສູ່ເວີຊັນ ${targetVer.versionTag}`,
      message: `ເອກະສານເລກທີ ${doc.documentNumber} ໄດ້ຮັບການຟື້ນຟູກັບຄືນສູ່ເວີຊັນ ${targetVer.versionTag} (ເວີຊັນປະຈຸບັນ: ${newVersionTag})`,
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      type: 'WARNING',
    });

    this.saveState();
    return { success: true, newVersionTag, targetVersionTag: targetVer.versionTag };
  }

  /**
   * Helper to trigger a real-time status change notification alert for testing
   */
  simulateRealtimeStatusChange(): NotificationItem {
    const doc = this.documents[0] || INITIAL_DOCUMENTS[0];
    const statuses = ['PENDING_SIGNATURE', 'COMPLETED', 'APPROVED', 'IN_PROGRESS'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const statusLao = getDocStatusLao(randomStatus);

    const notif = this.addNotification({
      title: `⚡ [Real-Time] ປ່ຽນສະຖານະ: ${doc.documentNumber}`,
      message: `ເອກະສານ "${doc.subject}" ປ່ຽນສະຖານະເປັນ: ${statusLao} (ອັບເດດຈາກ Firestore Cloud)`,
      type: randomStatus === 'COMPLETED' ? 'COMPLETED' : 'INFO',
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      userId: 'ALL',
    });
    this.dispatchRealtimeAlert(notif);
    return notif;
  }

  /**
   * Helper to trigger a real-time new assignment notification alert for testing
   */
  simulateRealtimeAssignment(user: User): NotificationItem {
    const doc = this.documents[1] || this.documents[0] || INITIAL_DOCUMENTS[0];
    const nextStepName = user.role === 'DIRECTOR'
      ? 'ຂັ້ນຕອນທີ 4: ລົງລາຍເຊັນ E-Signature ອະນຸມັດ'
      : user.role === 'DEPARTMENT_HEAD'
      ? 'ຂັ້ນຕອນທີ 3: ພິຈາລະນາ ແລະ ໃສ່ທິດຊີ້ນຳ'
      : 'ຂັ້ນຕອນທີ 2: ກວດກາ ແລະ ສົ່ງຕໍ່ເອກະສານ';

    const notif = this.addNotification({
      title: `🔔 [Real-Time] ມອບໝາຍວຽກໃໝ່ເຖິງທ່ານ!`,
      message: `ເອກະສານເລກທີ ${doc.documentNumber} (${doc.subject}) ຕ້ອງການໃຫ້ທ່ານດຳເນີນການ: ${nextStepName}`,
      type: 'ACTION_REQUIRED',
      documentId: doc.id,
      documentNumber: doc.documentNumber,
      userId: user.id,
    });
    this.dispatchRealtimeAlert(notif);
    return notif;
  }

  resetToDefault() {
    this.documents = INITIAL_DOCUMENTS;
    this.folders = INITIAL_FOLDERS;
    this.notifications = INITIAL_NOTIFICATIONS;
    this.auditLogs = INITIAL_AUDIT_LOGS;
    this.emailAlerts = [];
    this.saveState();
  }
}

export const documentStore = new DocumentStore();
