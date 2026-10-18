export type UserRole =
  | 'ADMIN'
  | 'DIRECTOR'
  | 'DEPUTY_DIRECTOR'
  | 'DEPARTMENT_HEAD'
  | 'DEPUTY_DEPARTMENT_HEAD'
  | 'UNIT_HEAD'
  | 'STAFF';

export interface RoleInfo {
  role: UserRole;
  nameLao: string;
  nameEn: string;
  description: string;
  badgeColor: string;
  level: number;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  positionLao: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  signatureUrl?: string;
  active: boolean;
  createdAt: string;
}

export type DocumentTypeDirection = 'INCOMING' | 'OUTGOING';

export type DocumentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'NORMAL';

export type DocumentPurpose = 'RESEARCH' | 'INFORM' | 'OTHER';

export type DocumentStatus =
  | 'DRAFT'
  | 'REGISTERED'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'PENDING_APPROVAL'
  | 'PENDING_SIGNATURE'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED'
  | 'ARCHIVED'
  | 'SENT'
  | 'COMPLETED';

export interface DocumentAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  uploadedBy: string;
  url: string;
}

export interface ESignatureData {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  positionLao: string;
  signedAt: string;
  signatureImage: string;
  verificationCode: string;
  ipAddress: string;
}

export interface StaffVerificationRecord {
  id: string;
  documentId: string;
  verifiedByUserId: string;
  verifiedByUserName: string;
  verifiedByPosition: string;
  verifiedAt: string;
  certificateNumber: string;
  verificationNote?: string;
  attachedFileName?: string;
  status: 'VERIFIED';
}

export interface WorkflowStepDef {
  stepOrder: number;
  stepNameLao: string;
  stepNameEn: string;
  requiredRole: UserRole;
  requiresSignature: boolean;
  requiresInstruction: boolean;
  canReject: boolean;
  canAttachFinal: boolean;
}

export interface WorkflowStepInstance {
  stepOrder: number;
  stepNameLao: string;
  stepNameEn: string;
  requiredRole: UserRole;
  status: 'PENDING' | 'CURRENT' | 'COMPLETED' | 'RETURNED' | 'SKIPPED';
  assignedUserId?: string;
  assignedUserName?: string;
  completedAt?: string;
  completedByUserId?: string;
  completedByUserName?: string;
  completedByPosition?: string;
  actionTaken?: 'APPROVE' | 'SIGN' | 'FORWARD' | 'COMMENT' | 'RETURN' | 'ARCHIVE' | 'SEND_OUT' | 'STAFF_VERIFY' | 'ATTACH_FINAL';
  comment?: string;
  instruction?: string;
  signatureId?: string;
  signature?: ESignatureData;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userPosition: string;
  comment: string;
  createdAt: string;
}

export type VersionChangeType =
  | 'INITIAL'
  | 'CONTENT_EDIT'
  | 'ATTACHMENT_ADD'
  | 'ATTACHMENT_REMOVE'
  | 'REVERT';

export interface DocumentVersionSnapshot {
  subject: string;
  category: string;
  documentType: string;
  priority: DocumentPriority;
  purpose: DocumentPurpose;
  purposeNote?: string;
  instructions?: string;
  comments?: string;
  sender: string;
  recipient: string;
  referenceNumber?: string;
  referenceDate?: string;
  ocrText?: string;
  tags?: string[];
  attachments: DocumentAttachment[];
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  versionTag: string; // e.g. "v1.0", "v1.1", "v2.0"
  timestamp: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  changeSummary: string;
  changeType: VersionChangeType;
  snapshot: DocumentVersionSnapshot;
}

export interface DocumentRecord {
  id: string;
  direction: DocumentTypeDirection;
  documentNumber: string; // e.g. ລຮລ/0245 or ລຮລ.ຄກ/089
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
  sender: string; // for incoming
  recipient: string; // for outgoing
  instructions?: string;
  comments?: string;
  ocrText?: string;
  tags?: string[];
  commentsList?: DocumentComment[];
  status: DocumentStatus;
  currentStepOrder: number;
  workflowSteps: WorkflowStepInstance[];
  attachments: DocumentAttachment[];
  signatures: ESignatureData[];
  staffVerification?: StaffVerificationRecord;
  currentVersion?: number;
  versions?: DocumentVersion[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  eStorageFolderId?: string;
  eStorageArchivedAt?: string;
  rejectionReason?: string;
}

export interface EStorageFolder {
  id: string;
  nameLao: string;
  year: number;
  departmentId: string;
  departmentName: string;
  direction: 'ALL' | DocumentTypeDirection;
  documentCount: number;
  createdAt: string;
}

export interface EmailAlertRecord {
  id: string;
  documentId: string;
  documentNumber: string;
  documentSubject: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: string;
  stepOrder: number;
  stepNameLao: string;
  actionRequired: 'REVIEW' | 'SIGN' | 'STAFF_VERIFY' | 'ARCHIVE' | 'RETURNED';
  subject: string;
  emailBodyHtml: string;
  sentAt: string;
  status: 'SENT' | 'DELIVERED';
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  documentId?: string;
  documentNumber?: string;
  type: 'INFO' | 'ACTION_REQUIRED' | 'APPROVED' | 'RETURNED' | 'COMPLETED' | 'WARNING';
  read: boolean;
  createdAt: string;
  emailAlertSent?: boolean;
  recipientEmail?: string;
  emailAlertId?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userPosition: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE'
    | 'EDIT'
    | 'UPDATE'
    | 'FORWARD'
    | 'REVIEW'
    | 'APPROVE'
    | 'REJECT'
    | 'RETURN'
    | 'SIGN'
    | 'COMMENT'
    | 'ARCHIVE'
    | 'SEND_OUT'
    | 'DOWNLOAD'
    | 'PRINT'
    | 'UNAUTHORIZED_ATTEMPT';
  documentId?: string;
  documentNumber?: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  device: string;
}

export interface SweetAlertOptions {
  type: 'success' | 'error' | 'warning' | 'info' | 'question' | 'approval' | 'reject';
  title: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm?: (reason?: string) => void;
  onCancel?: () => void;
}

export interface SavedSearchCriteria {
  direction: 'ALL' | DocumentTypeDirection;
  query: string;
  category: string; // 'ALL' or specific category name
  priority: 'ALL' | DocumentPriority;
  status: 'ALL' | 'PENDING' | 'RETURNED' | 'COMPLETED';
}

export interface SavedSearchItem {
  id: string;
  name: string;
  userId: string;
  userName: string;
  criteria: SavedSearchCriteria;
  notifyOnMatch: boolean;
  lastMatchedAt?: string;
  lastMatchedDocNumber?: string;
  lastMatchedDocId?: string;
  createdAt: string;
}

