import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Calendar,
  Building,
  User as UserIcon,
  Download,
  Printer,
  FileDown,
  Mail,
  Target,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Upload,
  AlertCircle,
  Paperclip,
  Eye,
  Lock,
  PenTool,
  Image as ImageIcon,
  MessageSquare,
  FolderArchive,
  ExternalLink,
  History,
  GitBranch,
  Edit3,
  Plus,
  Trash2,
  Undo2,
  Check,
} from 'lucide-react';
import { DocumentRecord, User, UserRole, EmailAlertRecord, DocumentVersion, DocumentPriority, DocumentPurpose } from '../types';
import { documentStore } from '../services/store';
import { AuthService, INITIAL_USERS } from '../services/auth';
import { ROLE_HIERARCHY, useAuthorization, WorkflowActionGuard } from '../services/workflowAuthMiddleware';
import { useAlert } from './SweetAlertModal';
import { ESignaturePad } from './ESignaturePad';
import { QRCodeGenerator } from './QRCodeGenerator';
import { VerifySignatureModal } from './VerifySignatureModal';
import { LHSELogo } from './LHSELogo';

interface DocumentDetailModalProps {
  documentId: string;
  currentUser: User;
  onUserChange?: (user: User) => void;
  onClose: () => void;
  onRefresh?: () => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  documentId,
  currentUser,
  onUserChange,
  onClose,
  onRefresh,
}) => {
  const alert = useAlert();
  const [doc, setDoc] = useState<DocumentRecord | undefined>(() => documentStore.getDocumentById(documentId));
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'VERSIONS' | 'ATTACHMENTS'>('PREVIEW');
  const [showSignPad, setShowSignPad] = useState(false);
  const [signPadMode, setSignPadMode] = useState<'DRAW' | 'UPLOAD'>('DRAW');
  const [instructionInput, setInstructionInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [persistentCommentInput, setPersistentCommentInput] = useState('');
  const [selectedFinalFileName, setSelectedFinalFileName] = useState('');
  const [staffVerificationNote, setStaffVerificationNote] = useState('ກວດສອບລາຍເຊັນທັງໝົດຄົບຖ້ວນ, ຖືກຕ້ອງຕາມລະບຽບການ 100%');

  // Version Control system states
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedCompareVersion, setSelectedCompareVersion] = useState<DocumentVersion | null>(null);

  // Edit Content Modal state
  const [showEditContentModal, setShowEditContentModal] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDocumentType, setEditDocumentType] = useState('');
  const [editPriority, setEditPriority] = useState<DocumentPriority>('MEDIUM');
  const [editPurpose, setEditPurpose] = useState<DocumentPurpose>('RESEARCH');
  const [editPurposeNote, setEditPurposeNote] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editComments, setEditComments] = useState('');
  const [editSender, setEditSender] = useState('');
  const [editRecipient, setEditRecipient] = useState('');
  const [editChangeSummary, setEditChangeSummary] = useState('');

  // Add Attachment Modal state
  const [showAddAttachmentModal, setShowAddAttachmentModal] = useState(false);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentNote, setNewAttachmentNote] = useState('');
  const [newAttachmentSize, setNewAttachmentSize] = useState(1024 * 650);

  // Signature verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyModalSig, setVerifyModalSig] = useState<any>(null);

  // Document Unique ID verification route link
  const docVerificationUrl = useMemo(() => {
    if (!doc) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}?verify=${doc.id}`;
    }
    return `https://edoc.state-enterprise.gov.la/verify/${doc.id}`;
  }, [doc]);

  const handleCopyVerificationUrl = async () => {
    if (!docVerificationUrl) return;
    try {
      await navigator.clipboard.writeText(docVerificationUrl);
      await alert.fire({
        type: 'success',
        title: 'ສຳເນົາລິ້ງສຳເລັດ',
        text: `ລິ້ງກວດສອບຄວາມຖືກຕ້ອງຂອງເອກະສານ ID: ${doc?.id} ໄດ້ຖືກສຳເນົາແລ້ວ`,
      });
    } catch {
      // fallback
    }
  };

  const refreshDoc = () => {
    const updated = documentStore.getDocumentById(documentId);
    setDoc(updated);
    if (onRefresh) onRefresh();
  };

  const auth = useAuthorization(currentUser, doc || null);

  const currentStep = doc?.workflowSteps.find(s => s.stepOrder === doc.currentStepOrder);
  const isIncoming = doc?.direction === 'INCOMING';

  // Designated officers per step
  const deptHeadUser = INITIAL_USERS.find(u => u.role === 'DEPARTMENT_HEAD') || INITIAL_USERS[0];
  const deputyEngUser = INITIAL_USERS.find(u => u.id === 'usr-deputy-dept-head-eng') || INITIAL_USERS[1];
  const deputyRndUser = INITIAL_USERS.find(u => u.id === 'usr-deputy-dept-head-rnd') || INITIAL_USERS[2];
  const unitEngUser = INITIAL_USERS.find(u => u.id === 'usr-unit-eng') || INITIAL_USERS[3];
  const unitCoordUser = INITIAL_USERS.find(u => u.id === 'usr-unit-coord') || INITIAL_USERS[4];
  const unitRndUser = INITIAL_USERS.find(u => u.id === 'usr-unit-rnd') || INITIAL_USERS[5];
  const staffUser = INITIAL_USERS.find(u => u.role === 'STAFF') || INITIAL_USERS[INITIAL_USERS.length - 1];

  // Consolidated list of all comments and directives stamped on the document
  const allDocumentComments = useMemo(() => {
    if (!doc) return [];
    const list: {
      id: string;
      authorName: string;
      authorRole?: string;
      authorPosition?: string;
      text: string;
      type: 'INSTRUCTION' | 'COMMENT';
      timestamp?: string;
    }[] = [];

    // 1. Comments from doc.commentsList
    if (doc.commentsList && doc.commentsList.length > 0) {
      doc.commentsList.forEach(c => {
        list.push({
          id: c.id,
          authorName: c.userName,
          authorRole: c.userRole,
          authorPosition: c.userPosition,
          text: c.comment,
          type: 'COMMENT',
          timestamp: c.createdAt,
        });
      });
    }

    // 2. Directives & comments from workflowSteps
    doc.workflowSteps.forEach((s, idx) => {
      if (s.instruction && !list.some(l => l.text === s.instruction)) {
        list.push({
          id: `step-inst-${idx}`,
          authorName: s.completedByUserName || s.stepNameLao,
          authorRole: s.requiredRole,
          authorPosition: s.completedByPosition,
          text: s.instruction,
          type: 'INSTRUCTION',
          timestamp: s.completedAt,
        });
      }
      if (s.comment && !list.some(l => l.text === s.comment)) {
        list.push({
          id: `step-cmt-${idx}`,
          authorName: s.completedByUserName || s.stepNameLao,
          authorRole: s.requiredRole,
          authorPosition: s.completedByPosition,
          text: s.comment,
          type: 'COMMENT',
          timestamp: s.completedAt,
        });
      }
    });

    return list;
  }, [doc]);

  // Active signer tracking: default based on current step
  const [activeSignerUser, setActiveSignerUser] = useState<User>(() => {
    if (currentStep?.stepOrder === 2 || currentStep?.requiredRole === 'DEPARTMENT_HEAD') {
      return deptHeadUser;
    }
    if (currentStep?.stepOrder === 3 || currentStep?.requiredRole === 'DEPUTY_DEPARTMENT_HEAD') {
      return currentUser.role === 'DEPUTY_DEPARTMENT_HEAD' ? currentUser : deputyEngUser;
    }
    if (currentStep?.stepOrder === 4 || currentStep?.requiredRole === 'UNIT_HEAD') {
      return currentUser.role === 'UNIT_HEAD' ? currentUser : unitEngUser;
    }
    return currentUser;
  });

  if (!doc) {
    return null;
  }

  const isCurrentStepSignature = currentStep && (
    currentStep.stepNameLao.includes('E-Signature') ||
    currentStep.stepNameLao.includes('ເຊັນ') ||
    ['DIRECTOR', 'DEPUTY_DIRECTOR', 'DEPARTMENT_HEAD', 'DEPUTY_DEPARTMENT_HEAD', 'UNIT_HEAD'].includes(currentStep.requiredRole)
  );

  const isStaffFinalStep = currentStep && (
    currentStep.stepOrder >= (isIncoming ? 5 : 7) ||
    currentStep.stepNameLao.includes('Upload') ||
    currentStep.stepNameLao.includes('ແນບ') ||
    currentStep.stepNameLao.includes('E-Storage') ||
    currentStep.stepNameLao.includes('ຄັງເອກະສານ') ||
    currentStep.requiredRole === 'STAFF'
  );

  const openSignaturePad = (mode: 'DRAW' | 'UPLOAD' = 'DRAW', signerOverride?: User) => {
    let target = signerOverride;
    if (!target) {
      if (currentStep?.stepOrder === 2 || currentStep?.requiredRole === 'DEPARTMENT_HEAD') {
        target = deptHeadUser;
      } else if (currentStep?.stepOrder === 3 || currentStep?.requiredRole === 'DEPUTY_DEPARTMENT_HEAD') {
        target = currentUser.role === 'DEPUTY_DEPARTMENT_HEAD' ? currentUser : deputyEngUser;
      } else if (currentStep?.stepOrder === 4 || currentStep?.requiredRole === 'UNIT_HEAD') {
        target = currentUser.role === 'UNIT_HEAD' ? currentUser : unitEngUser;
      } else if (currentUser.role === 'ADMIN') {
        target = INITIAL_USERS.find(u => u.role === currentStep?.requiredRole) || currentUser;
      } else {
        target = currentUser;
      }
    }
    setActiveSignerUser(target);
    setSignPadMode(mode);
    setShowSignPad(true);
  };

  const handleQuickSwitchAndSign = (role: UserRole, mode: 'DRAW' | 'UPLOAD' = 'DRAW') => {
    const switchedUser = AuthService.switchUserByRole(role);
    if (onUserChange) {
      onUserChange(switchedUser);
    }
    openSignaturePad(mode, switchedUser);
  };

  const handleQuickSwitchUserAndSign = (userId: string, mode: 'DRAW' | 'UPLOAD' = 'DRAW') => {
    const switchedUser = AuthService.switchUserById(userId);
    if (onUserChange) {
      onUserChange(switchedUser);
    }
    openSignaturePad(mode, switchedUser);
  };

  // Handle Save Comment Only (Persistent input field adjacent to signature area)
  const handleSaveCommentOnly = async () => {
    if (!doc) return;
    const textToSave = persistentCommentInput.trim() || instructionInput.trim() || commentInput.trim();
    if (!textToSave) {
      await alert.fire({
        type: 'warning',
        title: 'ກະລຸນາປ້ອນຄຳເຫັນ',
        text: 'ກະລຸນາພິມຄຳເຫັນ ຫຼື ທິດຊີ້ນຳຂອງທ່ານກ່ອນກົດບັນທຶກ',
      });
      return;
    }

    const res = documentStore.addDocumentComment(doc.id, currentUser, textToSave);
    if (res.success) {
      await alert.fire({
        type: 'success',
        title: 'ບັນທຶກຄຳເຫັນສຳເລັດ',
        text: 'ຄຳເຫັນໄດ້ຖືກບັນທຶກລົງໃນເອກະສານ ແລະ ບັນທຶກເຂົ້າ Audit Log ແລ້ວ',
      });
      refreshDoc();
      setPersistentCommentInput('');
      setInstructionInput('');
      setCommentInput('');
    } else {
      await alert.fire({
        type: 'error',
        title: 'ບັນທຶກບໍ່ສຳເລັດ',
        text: res.error || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຄຳເຫັນ',
      });
    }
  };

  // Handle Forward / Approve
  const handleForwardOrApprove = async () => {
    if (!doc) return;
    const confirm = await alert.fire({
      type: 'approval',
      title: 'ຢືນຢັນການສົ່ງຕໍ່ / ອະນຸມັດ?',
      text: `ທ່ານກຳລັງຈະດຳເນີນການໃນຂັ້ນຕອນ: "${currentStep?.stepNameLao}" ແລະ ສົ່ງຕໍ່ໄປຍັງຂັ້ນຕອນຖັດໄປ.`,
      confirmButtonText: 'ຢືນຢັນສົ່ງຕໍ່',
      cancelButtonText: 'ຍົກເລີກ',
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    const commentToSave = persistentCommentInput.trim() || commentInput.trim() || instructionInput.trim() || undefined;

    const res = documentStore.advanceWorkflowStep(doc.id, currentUser, {
      action: 'FORWARD',
      comment: commentToSave,
      instruction: commentToSave,
    });

    if (res.success) {
      await alert.fire({
        type: 'success',
        title: 'ດຳເນີນການສຳເລັດ',
        text: 'ເອກະສານໄດ້ຮັບການສົ່ງຕໍ່ໄປຍັງຂັ້ນຕອນຖັດໄປຮຽບຮ້ອຍແລ້ວ',
      });
      refreshDoc();
      setPersistentCommentInput('');
      setCommentInput('');
      setInstructionInput('');
    } else {
      await alert.fire({
        type: 'error',
        title: 'ບໍ່ມີສິດດຳເນີນການ',
        text: res.error?.messageLao || 'ການດຳເນີນການບໍ່ໄດ້ຮັບອະນຸຍາດ',
      });
    }
  };

  // Handle E-Signature Save (Incorporating persistent comment)
  const handleSignatureSave = async (signatureDataUrl: string) => {
    if (!doc) return;
    setShowSignPad(false);

    // Resolve official signer so System Administrator is NEVER recorded on business signatures:
    let effectiveSigner = activeSignerUser || currentUser;
    if (currentStep?.stepOrder === 2 || currentStep?.requiredRole === 'DEPARTMENT_HEAD') {
      effectiveSigner = deptHeadUser;
    } else if (currentStep?.stepOrder === 3 || currentStep?.requiredRole === 'DEPUTY_DEPARTMENT_HEAD') {
      if (currentUser.role === 'DEPUTY_DEPARTMENT_HEAD') {
        effectiveSigner = currentUser;
      } else if (!activeSignerUser || activeSignerUser.role !== 'DEPUTY_DEPARTMENT_HEAD') {
        effectiveSigner = deputyEngUser;
      }
    } else if (currentStep?.stepOrder === 4 || currentStep?.requiredRole === 'UNIT_HEAD') {
      if (currentUser.role === 'UNIT_HEAD') {
        effectiveSigner = currentUser;
      } else if (!activeSignerUser || activeSignerUser.role !== 'UNIT_HEAD') {
        effectiveSigner = unitEngUser;
      }
    }

    const commentToSave = persistentCommentInput.trim() || instructionInput.trim() || commentInput.trim() || undefined;

    const res = documentStore.advanceWorkflowStep(doc.id, effectiveSigner, {
      action: 'SIGN',
      signatureImage: signatureDataUrl,
      instruction: commentToSave,
      comment: commentToSave,
    });

    if (res.success) {
      await alert.fire({
        type: 'success',
        title: 'ລົງລາຍເຊັນສຳເລັດ',
        text: 'ເອກະສານໄດ້ຮັບການລົງລາຍເຊັນດິຈິທັລ (E-Signature), ບັນທຶກຄຳເຫັນ ແລະ ສົ່ງຕໍ່ຕາມ Workflow ແລ້ວ (ບັນທຶກເຂົ້າ Audit Log ຮຽບຮ້ອຍ)',
      });
      refreshDoc();
      setPersistentCommentInput('');
      setCommentInput('');
      setInstructionInput('');
    } else {
      await alert.fire({
        type: 'error',
        title: 'ລົງລາຍເຊັນບໍ່ສຳເລັດ',
        text: res.error?.messageLao || 'ການດຳເນີນການຖືກປະຕິເສດ',
      });
    }
  };

  // Handle Reject / Return
  const handleReturn = async () => {
    if (!doc) return;
    const confirm = await alert.fire({
      type: 'reject',
      title: 'ຢືນຢັນການຕີກັບ / ສົ່ງຄືນເອກະສານ?',
      text: 'ເອກະສານຈະຖືກສົ່ງຄືນໄປຫາຂັ້ນຕອນກ່ອນໜ້າ ເພື່ອໃຫ້ຜູ້ຮັບຜິດຊອບແກ້ໄຂຄືນ.',
      confirmButtonText: 'ຢືນຢັນຕີກັບ',
      cancelButtonText: 'ຍົກເລີກ',
      showCancelButton: true,
      requireReason: true,
      reasonPlaceholder: 'ກະລຸນາລະບຸເຫດຜົນໃນການຕີກັບ ຕົວຢ່າງ: ຂໍ້ມູນຍັງບໍ່ຄົບຖ້ວນ...',
    });

    if (!confirm.isConfirmed || !confirm.value) return;

    const res = documentStore.returnWorkflowStep(doc.id, currentUser, confirm.value);

    if (res.success) {
      await alert.fire({
        type: 'success',
        title: 'ຕີກັບເອກະສານແລ້ວ',
        text: `ເອກະສານໄດ້ຖືກສົ່ງຄືນພ້ອມເຫດຜົນ: "${confirm.value}"`,
      });
      refreshDoc();
    } else {
      await alert.fire({
        type: 'error',
        title: 'ບໍ່ສາມາດຕີກັບໄດ້',
        text: res.error?.messageLao || 'ເກີດຂໍ້ຜິດພາດໃນການສົ່ງຄືນ',
      });
    }
  };

  // Handle Staff Verification Certificate ("ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ")
  const handleStaffVerification = async (customNote?: string, customFileName?: string) => {
    if (!doc) return;

    let effectiveUser = currentUser;
    if (currentUser.role !== 'STAFF' && currentUser.role !== 'ADMIN') {
      const switched = AuthService.switchUserById(staffUser.id);
      if (onUserChange) onUserChange(switched);
      effectiveUser = switched;
    }

    const certNote = customNote || staffVerificationNote.trim() || persistentCommentInput.trim() || 'ພະນັກງານ (Staff) ໄດ້ກວດກາຄວາມຖືກຕ້ອງຂອງລາຍເຊັນ ແລະ ເອກະສານຄົບຖ້ວນຖືກຕ້ອງ 100%';
    const finalName = customFileName || selectedFinalFileName || `ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງ_${doc.documentNumber.replace(/\//g, '_')}.pdf`;

    const res = documentStore.advanceWorkflowStep(doc.id, effectiveUser, {
      action: 'STAFF_VERIFY',
      comment: certNote,
      instruction: certNote,
      finalAttachment: {
        fileName: finalName,
        fileSize: 1850000,
        fileType: 'application/pdf',
      },
    });

    if (res.success) {
      await alert.fire({
        type: 'success',
        title: 'ອອກໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງສຳເລັດ',
        text: `ພະນັກງານ (Staff) ໄດ້ອອກ "ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ" ພ້ອມບັນທຶກໄວ້ຄັງເອກະສານ ແລະ ສົ່ງຕໍ່ໄປຍັງຂັ້ນຕອນ E-Storage Archive ສຳເລັດແລ້ວ`,
      });
      refreshDoc();
      setSelectedFinalFileName('');
      setPersistentCommentInput('');
    } else {
      await alert.fire({
        type: 'error',
        title: 'ບໍ່ມີສິດດຳເນີນການ',
        text: res.error?.messageLao || 'ເກີດຂໍ້ຜິດພາດໃນການອອກໃບຢັ້ງຢືນ',
      });
    }
  };

  // Handle Archive to E-Storage & Complete (Final Step: E-Storage Archive & ສຳເລັດ)
  const handleArchiveComplete = async () => {
    if (!doc) return;

    let effectiveUser = currentUser;
    if (currentUser.role !== 'STAFF' && currentUser.role !== 'ADMIN') {
      const switched = AuthService.switchUserById(staffUser.id);
      if (onUserChange) onUserChange(switched);
      effectiveUser = switched;
    }

    const res = documentStore.advanceWorkflowStep(doc.id, effectiveUser, {
      action: 'ARCHIVE',
      comment: persistentCommentInput.trim() || 'ພະນັກງານ (Staff) ບັນທຶກເອກະສານເຂົ້າຄັງ E-Storage ສຳເລັດສົມບູນ',
    });

    if (res.success) {
      await alert.fire({
        type: 'success',
        title: 'ບັນທຶກເຂົ້າຄັງ E-Storage ສຳເລັດສົມບູນ',
        text: `ເອກະສານເລກທີ ${doc.documentNumber} ສຳເລັດທຸກຂັ້ນຕອນ ແລະ ບັນທຶກໄວ້ຄັງເອກະສານ E-Storage ແລ້ວ`,
      });
      refreshDoc();
      setPersistentCommentInput('');
    } else {
      await alert.fire({
        type: 'error',
        title: 'ບໍ່ມີສິດດຳເນີນການ',
        text: res.error?.messageLao || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກເຂົ້າຄັງ E-Storage',
      });
    }
  };

  // Automated email alerts state
  const [showEmailAlertsModal, setShowEmailAlertsModal] = useState(false);
  const [selectedEmailAlert, setSelectedEmailAlert] = useState<EmailAlertRecord | null>(null);
  const docEmailAlerts = useMemo(() => {
    if (!doc) return [];
    return documentStore.getEmailAlertsByDocumentId(doc.id);
  }, [doc]);

  // Version Control Handlers
  const handleRevert = async (targetVer: DocumentVersion) => {
    if (!doc) return;
    const confirmed = await alert.fire({
      type: 'warning',
      title: 'ຢືນຢັນການຟື້ນຟູເວີຊັນ (Revert Version)',
      text: `ທ່ານຕ້ອງການຟື້ນຟູເອກະສານກັບຄືນສູ່ເວີຊັນ ${targetVer.versionTag} (${new Date(targetVer.timestamp).toLocaleDateString('lo-LA')}) ແທ້ຫຼືບໍ່? ລະບົບຈະສ້າງເວີຊັນໃໝ່ເພື່ອບັນທຶກປະຫວັດການຟື້ນຟູນີ້.`,
      confirmButtonText: `ຢືນຢັນຟື້ນຟູສູ່ ${targetVer.versionTag}`,
      cancelButtonText: 'ຍົກເລີກ',
    });

    if (confirmed) {
      const res = documentStore.revertToVersion(doc.id, targetVer.versionNumber, currentUser);
      if (res.success) {
        refreshDoc();
        setSelectedCompareVersion(null);
        await alert.fire({
          type: 'success',
          title: 'ຟື້ນຟູເວີຊັນສຳເລັດ',
          text: `ໄດ້ຟື້ນຟູເອກະສານກັບຄືນສູ່ເວີຊັນ ${targetVer.versionTag} ຮຽບຮ້ອຍແລ້ວ (ເວີຊັນປະຈຸບັນ: ${res.newVersionTag})`,
        });
      } else {
        await alert.fire({
          type: 'error',
          title: 'ບໍ່ສາມາດຟື້ນຟູໄດ້',
          text: res.error || 'ເກີດຂໍ້ຜິດພາດ',
        });
      }
    }
  };

  const handleSaveEditContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) return;
    const res = documentStore.updateDocumentContent(
      doc.id,
      {
        subject: editSubject,
        category: editCategory,
        documentType: editDocumentType,
        priority: editPriority,
        purpose: editPurpose,
        purposeNote: editPurposeNote,
        instructions: editInstructions,
        comments: editComments,
        sender: editSender,
        recipient: editRecipient,
      },
      currentUser,
      editChangeSummary || 'ປັບປຸງເນື້ອໃນເອກະສານ'
    );

    if (res.success) {
      setShowEditContentModal(false);
      refreshDoc();
      await alert.fire({
        type: 'success',
        title: 'ບັນທຶກການດັດແກ້ສຳເລັດ',
        text: `ໄດ້ບັນທຶກ ແລະ ສ້າງເວີຊັນໃໝ່ (${res.versionTag}) ຮຽບຮ້ອຍແລ້ວ`,
      });
    }
  };

  const handleSaveAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc || !newAttachmentName.trim()) return;
    const res = documentStore.addDocumentAttachment(
      doc.id,
      {
        fileName: newAttachmentName.trim(),
        fileSize: newAttachmentSize,
        fileType: 'application/pdf',
        url: '#',
      },
      currentUser,
      newAttachmentNote.trim()
    );

    if (res.success) {
      setShowAddAttachmentModal(false);
      setNewAttachmentName('');
      setNewAttachmentNote('');
      refreshDoc();
      await alert.fire({
        type: 'success',
        title: 'ເພີ່ມໄຟລ໌ຄັດຕິດສຳເລັດ',
        text: `ໄດ້ເພີ່ມໄຟລ໌ ແລະ ສ້າງເວີຊັນໃໝ່ (${res.versionTag}) ຮຽບຮ້ອຍແລ້ວ`,
      });
    }
  };

  const handleRemoveAttachment = async (attachmentId: string, fileName: string) => {
    if (!doc) return;
    const confirmed = await alert.fire({
      type: 'reject',
      title: 'ຢືນຢັນການລຶບໄຟລ໌ຄັດຕິດ',
      text: `ທ່ານຕ້ອງການລຶບໄຟລ໌ "${fileName}" ອອກຈາກເອກະສານແທ້ຫຼືບໍ່? (ລະບົບຈະບັນທຶກເວີຊັນໃໝ່)`,
      requireReason: true,
      reasonPlaceholder: 'ລະບຸເຫດຜົນໃນການລຶບ...',
      confirmButtonText: 'ຢືນຢັນລຶບໄຟລ໌',
      cancelButtonText: 'ຍົກເລີກ',
    });

    if (confirmed) {
      const reason = typeof confirmed === 'string' ? confirmed : 'ລຶບໄຟລ໌ຄັດຕິດ';
      const res = documentStore.removeDocumentAttachment(doc.id, attachmentId, currentUser, reason);
      if (res.success) {
        refreshDoc();
        await alert.fire({
          type: 'success',
          title: 'ລຶບໄຟລ໌ສຳເລັດ',
          text: `ໄດ້ລຶບໄຟລ໌ ແລະ ສ້າງເວີຊັນໃໝ່ (${res.versionTag}) ຮຽບຮ້ອຍແລ້ວ`,
        });
      }
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="shrink-0 hover:scale-105 transition-transform">
              <LHSELogo size={36} />
            </div>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
              isIncoming ? 'bg-blue-900/60 text-blue-200 border-blue-700' : 'bg-emerald-900/60 text-emerald-200 border-emerald-700'
            }`}>
              {isIncoming ? '📥 ເອກະສານຂາເຂົ້າ' : '📤 ເອກະສານຂາອອກ'}
            </span>
            <span className="font-mono font-bold text-lg text-white">
              {doc.documentNumber}
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
              doc.priority === 'URGENT'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : doc.priority === 'HIGH'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : doc.priority === 'LOW'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {doc.priority === 'URGENT'
                ? '🚨 ດ່ວນທີ່ສຸດ (Urgent)'
                : doc.priority === 'HIGH'
                ? '🟠 ສູງ (High)'
                : doc.priority === 'LOW'
                ? '🟢 ຕ່ຳ (Low)'
                : '🔵 ປານກາງ (Medium)'}
            </span>

            {/* Version control badge button */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('VERSIONS');
                setShowVersionModal(true);
              }}
              className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
              title="ຄລິກເພື່ອເບິ່ງປະຫວັດການປ່ຽນແປງ & ຟື້ນຟູເວີຊັນ (Version History & Revert)"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>{doc.currentVersion ? `v${doc.currentVersion}.0` : 'v1.0'} ({doc.versions?.length || 1} ver)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {docEmailAlerts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowEmailAlertsModal(true)}
                className="px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="ເບິ່ງປະຫວັດການສົ່ງ Email Alert ອັດຕະໂນມັດສຳລັບເອກະສານນີ້"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Email Alerts ({docEmailAlerts.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportPdf}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="ດາວໂຫຼດ ຫຼື ສົ່ງອອກເປັນໄຟລ໌ PDF (Print to PDF)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export as PDF (ສົ່ງອອກ PDF)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ພິມ (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3-COLUMN CONTENT WORKSPACE */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* COLUMN 1: LEFT (Document Information) - col-span-3 */}
          <div className="col-span-12 lg:col-span-3 bg-slate-50/70 p-5 overflow-y-auto space-y-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                ຂໍ້ມູນເອກະສານ (DOCUMENT INFO)
              </div>
              <h2 className="text-sm font-bold text-slate-800 leading-snug mb-3">
                {doc.subject}
              </h2>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">ເລກທີຂາເຂົ້າ / ຂາອອກ:</span>
                <span className="font-mono font-bold text-slate-800">{doc.documentNumber}</span>
              </div>
              {doc.referenceNumber && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">ເລກທີອ້າງອີງ:</span>
                  <span className="font-mono text-slate-700">{doc.referenceNumber} (ວັນທີ {doc.referenceDate || '-'})</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">ວັນທີເອກະສານ:</span>
                  <span className="text-slate-700 font-medium">{doc.documentDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">ວັນທີຮັບ:</span>
                  <span className="text-slate-700 font-medium">{doc.receivedDate || doc.documentDate}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">ປະເພດເອກະສານ:</span>
                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold text-[11px] mt-0.5">
                  {doc.documentType} ({doc.category})
                </span>
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-semibold">
                  <Target className="w-3 h-3 text-indigo-500" />
                  <span>ຈຸດປະສົງ:</span>
                </span>
                <span className="text-slate-700 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[11px] font-semibold border border-indigo-200/80">
                    {doc.purpose === 'RESEARCH' ? '🔍 ເພື່ອຄົ້ນຄວ້າ (Research)' : doc.purpose === 'INFORM' ? '📢 ເພື່ອຮັບຊາບ (Inform)' : '📌 ອື່ນໆ'}
                  </span>
                </span>
                {doc.purposeNote && <p className="text-[11px] text-slate-500 mt-1 pl-1 border-l-2 border-indigo-300">{doc.purposeNote}</p>}
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-semibold">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  <span>ລະດັບຄວາມດ່ວນ (Priority):</span>
                </span>
                <span className="text-slate-700 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                    doc.priority === 'URGENT'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : doc.priority === 'HIGH'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : doc.priority === 'LOW'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {doc.priority === 'URGENT'
                      ? '🚨 ດ່ວນທີ່ສຸດ (Urgent)'
                      : doc.priority === 'HIGH'
                      ? '🟠 ສູງ (High)'
                      : doc.priority === 'LOW'
                      ? '🟢 ຕ່ຳ (Low)'
                      : '🔵 ປານກາງ (Medium)'}
                  </span>
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {isIncoming ? 'ໜ່ວຍງານສົ່ງມາ:' : 'ໜ່ວຍງານປາຍທາງ (ຜູ້ຮັບ):'}
                </span>
                <span className="font-semibold text-slate-800">
                  {isIncoming ? doc.sender : doc.recipient}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">ພະແນກຮັບຜິດຊອບ:</span>
                <span className="text-slate-700">{doc.departmentName}</span>
              </div>
              {doc.tags && doc.tags.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                    ປ້າຍກຳກັບໝວດໝູ່ AI (AI Category Tags):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-bold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* OCR Extracted Text Card in Column 1 */}
            {doc.ocrText && (
              <div className="bg-white rounded-xl p-3.5 border border-indigo-200/90 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/20 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ຂໍ້ຄວາມສະກັດ OCR (Scanned Text)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Searchable
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto font-sans">
                  {doc.ocrText}
                </div>
              </div>
            )}

            {/* Version Control Card in Column 1 */}
            <div className="bg-white rounded-xl p-3.5 border border-amber-200/90 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-600" />
                  <span>ການຄວບຄຸມເວີຊັນ (Version Control)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {doc.currentVersion ? `v${doc.currentVersion}.0` : 'v1.0'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                ບັນທຶກປະຫວັດການດັດແກ້ທັງໝົດ {doc.versions?.length || 1} ສະບັບ. ທ່ານສາມາດດັດແກ້ເນື້ອໃນ ຫຼື ຟື້ນຟູກັບຄືນສະບັບກ່ອນໜ້າໄດ້.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditSubject(doc.subject);
                    setEditCategory(doc.category);
                    setEditDocumentType(doc.documentType);
                    setEditPriority(doc.priority);
                    setEditPurpose(doc.purpose);
                    setEditPurposeNote(doc.purposeNote || '');
                    setEditInstructions(doc.instructions || '');
                    setEditComments(doc.comments || '');
                    setEditSender(doc.sender);
                    setEditRecipient(doc.recipient);
                    setEditChangeSummary('');
                    setShowEditContentModal(true);
                  }}
                  className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  title="ດັດແກ້ເນື້ອໃນ ແລະ ສ້າງເວີຊັນໃໝ່"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>ດັດແກ້ເນື້ອໃນ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAttachmentModal(true)}
                  className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  title="ເພີ່ມໄຟລ໌ຄັດຕິດ ແລະ ສ້າງເວີຊັນໃໝ່"
                >
                  <Plus className="w-3 h-3" />
                  <span>ເພີ່ມໄຟລ໌ຄັດຕິດ</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('VERSIONS');
                  setShowVersionModal(true);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>ເບິ່ງປະຫວັດ & ຟື້ນຟູເວີຊັນ ({doc.versions?.length || 1})</span>
              </button>
            </div>

            {/* Attachments list */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span>ໄຟລ໌ຄັດຕິດ ({doc.attachments.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddAttachmentModal(true)}
                  className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>ເພີ່ມໄຟລ໌</span>
                </button>
              </div>
              <div className="space-y-1.5">
                {doc.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition flex items-center justify-between text-xs group"
                  >
                    <div className="truncate flex-1 pr-2">
                      <div className="font-medium text-slate-800 truncate">{att.fileName}</div>
                      <div className="text-[10px] text-slate-400">
                        {(att.fileSize / 1024 / 1024).toFixed(2)} MB • {att.uploadedBy}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => alert.fire({ type: 'info', title: 'ດາວໂຫຼດໄຟລ໌', text: `ກຳລັງດາວໂຫຼດ: ${att.fileName}` })}
                        className="p-1 text-slate-500 hover:text-indigo-600 rounded transition cursor-pointer"
                        title="ດາວໂຫຼດ"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id, att.fileName)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="ລຶບໄຟລ໌ (ສ້າງເວີຊັນໃໝ່)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current status summary badge */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
              <div className="text-indigo-900 font-bold flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>ຂັ້ນຕອນປັດຈຸບັນ: ຂັ້ນຕອນທີ {doc.currentStepOrder}</span>
              </div>
              <p className="text-indigo-700 text-[11px] leading-relaxed">
                {currentStep?.stepNameLao}
              </p>
              <div className="mt-2 text-[10px] font-semibold text-indigo-900 bg-white/80 px-2 py-1 rounded inline-block">
                ຜູ້ມີສິດດຳເນີນການ: {ROLE_HIERARCHY[currentStep?.requiredRole || 'STAFF']?.labelLao}
              </div>
            </div>
          </div>

          {/* COLUMN 2: CENTER (Live Document Preview & Paper Sheet) - col-span-5 */}
          <div className="col-span-12 lg:col-span-5 bg-slate-200/50 p-4 lg:p-6 overflow-y-auto flex flex-col items-center">
            {/* Column 2 Navigation Tabs */}
            <div className="w-full max-w-xl flex items-center gap-1.5 p-1 bg-slate-300/80 rounded-2xl mb-4 shrink-0 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'PREVIEW'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>ໃບເອກະສານທາງການ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('VERSIONS')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'VERSIONS'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-600" />
                <span>ປະຫວັດເວີຊັນ ({doc.versions?.length || 1})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ATTACHMENTS')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'ATTACHMENTS'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                <span>ໄຟລ໌ຄັດຕິດ ({doc.attachments.length})</span>
              </button>
            </div>

            {/* TAB 1: OFFICIAL PAPER SHEET PREVIEW */}
            {activeTab === 'PREVIEW' && (
            <div className="bg-white shadow-lg rounded-xl border border-slate-300 w-full max-w-xl p-8 min-h-[600px] text-slate-800 text-xs font-sans relative">
              {/* Official Lao State Emblem / Header */}
              <div className="text-center mb-6 border-b border-slate-200 pb-4">
                <div className="font-bold text-sm tracking-wide text-slate-900">
                  ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
                </div>
                <div className="text-[11px] font-semibold text-slate-700">
                  ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
                </div>
                <div className="text-xs text-slate-400 mt-0.5">--------------- 000 ---------------</div>

                <div className="flex items-center justify-between mt-4 text-[11px]">
                  <div className="text-left flex items-center gap-2.5">
                    <LHSELogo size={46} />
                    <div>
                      <div className="font-bold text-slate-800">ລັດວິສາຫະກິດຖືຮຸ້ນລາວ</div>
                      <div className="text-[10px] text-slate-500 font-semibold tracking-tight">LAO HOLDING STATE ENTERPRISE</div>
                      <div className="text-slate-600 text-[10px]">{doc.departmentName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div>ເລກທີ: <span className="font-bold font-mono">{doc.documentNumber}</span></div>
                    <div>ນະຄອນຫຼວງວຽງຈັນ, ວັນທີ: {doc.documentDate}</div>
                  </div>
                </div>
              </div>

              {/* Document Subject Header */}
              <div className="mb-6 text-center">
                <h1 className="text-base font-bold text-slate-900 underline decoration-1 underline-offset-4 mb-2">
                  {doc.documentType}: {doc.subject}
                </h1>
              </div>

              {/* Recipient */}
              <div className="mb-4 space-y-1">
                <div>
                  <span className="font-bold">ຮຽນ: </span>
                  <span>{isIncoming ? doc.recipient : doc.recipient}</span>
                </div>
                {doc.referenceNumber && (
                  <div className="text-slate-600 text-[11px]">
                    <span className="font-bold">ອີງຕາມ: </span>
                    <span>ໜັງສືເລກທີ {doc.referenceNumber}, ລົງວັນທີ {doc.referenceDate || '-'}</span>
                  </div>
                )}
              </div>

              {/* Body Content Simulation */}
              <div className="space-y-3 leading-relaxed text-slate-700 indent-6 text-justify">
                <p>
                  {isIncoming
                    ? `ຫ້ອງການຂໍແຈ້ງມາຍັງທ່ານຊາບກ່ຽວກັບ ${doc.subject} ຕາມທີ່ໄດ້ລະບຸໄວ້ໃນເອກະສານທາງການສະບັບນີ້ ເພື່ອໃຫ້ພາກສ່ວນກ່ຽວຂ້ອງໄດ້ຄົ້ນຄວ້າ, ປະກອບຄຳເຫັນ ແລະ ຈັດຕັ້ງປະຕິບັດຕາມແຜນການລັດວິສາຫະກິດ.`
                    : `ອີງຕາມແຜນຍຸດທະສາດການພັດທະນາດິຈິທັລ ແລະ ຄວາມຕ້ອງການຕົວຈິງຂອງວຽກງານ, ພະແນກ ຂໍຮຽນສະເໜີມາຍັງ ຄະນະຜູ້ອຳນວຍການໃຫຍ່ ເພື່ອພິຈາລະນາອະນຸມັດ ແລະ ໃຫ້ທິດຊີ້ນຳຕາມລະບຽບການ.`}
                </p>
                <p>
                  ດັ່ງນັ້ນ, ຈຶ່ງຮຽນສະເໜີມາຍັງທ່ານ ເພື່ອຊາບ ແລະ ພິຈາລະນາໃຫ້ທິດຊີ້ນຳຕາມຄວາມເໝາະສົມດ້ວຍ.
                </p>
              </div>

              {/* Consolidated Official Recorded Directives & Comments Stamped on Document */}
              {allDocumentComments.length > 0 && (
                <div className="mt-6 p-3.5 bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white border border-amber-300 rounded-xl shadow-xs">
                  <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                      <span>ທິດຊີ້ນຳ ແລະ ຄຳເຫັນທີ່ບັນທຶກໄວ້ (Recorded Directives & Comments):</span>
                    </span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      {allDocumentComments.length} ລາຍການ
                    </span>
                  </div>
                  <div className="space-y-2">
                    {allDocumentComments.map((cmt) => (
                      <div key={cmt.id} className="p-2.5 rounded-lg bg-white/95 border border-amber-200/90 text-xs shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5 flex-wrap">
                            <span>• {cmt.authorName}</span>
                            {cmt.authorPosition && (
                              <span className="text-slate-500 font-normal text-[10px]">({cmt.authorPosition})</span>
                            )}
                          </span>
                          {cmt.timestamp && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(cmt.timestamp).toLocaleDateString('lo-LA', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 text-[11px] italic pl-2 border-l-2 border-amber-400 leading-relaxed">
                          "{cmt.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Persistent Input Field for Comments / Directives Adjacent to Signature Area */}
              {doc.status !== 'COMPLETED' && doc.status !== 'ARCHIVED' && (
                <div className="mt-6 p-4 bg-gradient-to-br from-amber-50/90 via-slate-50 to-blue-50/70 border border-amber-300/80 rounded-2xl shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                      <span>ຊ່ອງໃສ່ຄຳເຫັນ / ທິດຊີ້ນຳ (Comments & Instructions):</span>
                    </label>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      ບັນທຶກລົງເອກະສານ & Audit Log ທັນທີ
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                    <textarea
                      rows={2}
                      value={persistentCommentInput}
                      onChange={(e) => {
                        setPersistentCommentInput(e.target.value);
                        setInstructionInput(e.target.value);
                        setCommentInput(e.target.value);
                      }}
                      placeholder="ປ້ອນຄຳເຫັນ ຫຼື ທິດຊີ້ນຳຂອງທ່ານຢູ່ບ່ອນນີ້ (ຕົວຢ່າງ: ເຫັນດີຕາມສະເໜີ, ມອບໃຫ້ຮອງພະແນກຊີ້ນຳຕໍ່...)"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition leading-relaxed font-sans text-slate-800 placeholder:text-slate-400 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCommentOnly}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer self-stretch sm:self-auto shrink-0"
                      title="ບັນທຶກຄຳເຫັນລົງໃນເອກະສານ ແລະ Audit Log"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>ບັນທຶກຄຳເຫັນ</span>
                    </button>
                  </div>

                  {/* Fast Preset Quick-Pick Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-bold text-slate-500">ຂໍ້ຄວາມດ່ວນ:</span>
                    {[
                      'ເຫັນດີຕາມສະເໜີ',
                      'ມອບໃຫ້ຮອງຫົວໜ້າພະແນກຊີ້ນຳຕໍ່',
                      'ມອບໃຫ້ໜ່ວຍງານຄົ້ນຄວ້າ ແລະ ຈັດຕັ້ງປະຕິບັດ',
                      'ເຫັນດີອະນຸມັດ ແລະ ມອບໃຫ້ສາລະບັນສົ່ງອອກ',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const updated = persistentCommentInput ? `${persistentCommentInput} ${preset}` : preset;
                          setPersistentCommentInput(updated);
                          setInstructionInput(updated);
                          setCommentInput(updated);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100/80 border border-slate-200 hover:border-amber-300 rounded-lg text-[10px] text-slate-700 transition cursor-pointer font-medium shadow-2xs"
                      >
                        + {preset}
                      </button>
                    ))}
                    {persistentCommentInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setPersistentCommentInput('');
                          setInstructionInput('');
                          setCommentInput('');
                        }}
                        className="px-2 py-0.5 text-[10px] text-rose-500 hover:text-rose-700 ml-auto cursor-pointer"
                      >
                        ລຶບຂໍ້ຄວາມ
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Digital Signatures Grid on Document */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ລາຍເຊັນດິຈິທັລທີ່ໄດ້ຮັບຮອງ (VERIFIED DIGITAL SIGNATURES):
                  </div>
                  {doc.signatures.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyModalSig(doc.signatures[doc.signatures.length - 1]);
                        setShowVerifyModal(true);
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ກວດສອບໃບຢັ້ງຢືນ (Verify Signatures)</span>
                    </button>
                  )}
                </div>

                {/* Document Unique ID Quick Authenticity Verification QR Code Small Block */}
                <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-indigo-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
                      <QRCodeGenerator
                        text={docVerificationUrl}
                        size={64}
                        showCenterLogo={true}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>QR CODE ກວດສອບຄວາມແທ້ຈິງ</span>
                        </span>
                        <span className="text-[11px] font-mono font-bold text-indigo-200 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-400/30">
                          DOC ID: {doc.id}
                        </span>
                      </div>
                      <div className="font-bold text-xs text-white mt-1 flex items-center gap-1.5">
                        <span>ກວດສອບຄວາມຖືກຕ້ອງຂອງເອກະສານ (Document Authenticity Verification)</span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                        Scan QR Code ເພື່ອເຂົ້າສູ່ Verification Route ກວດສອບປະຫວັດລາຍເຊັນ ແລະ ຄວາມຖືກຕ້ອງແທ້ຈິງ 100%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVerifyModal(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-sm cursor-pointer"
                      title="ກວດສອບໃບຢັ້ງຢືນເອກະສານ"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ກວດສອບທັນທີ</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyVerificationUrl}
                      className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition cursor-pointer"
                      title="ສຳເນົາລິ້ງກວດສອບ"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Empty digital signature banner with direct signing actions */}
                {doc.signatures.length === 0 && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 via-orange-50/50 to-indigo-50/50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                        <PenTool className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5 flex-wrap">
                          <span>ຍັງບໍ່ທັນມີລາຍເຊັນດິຈິທັລໃນເອກະສານສະບັບນີ້</span>
                          <span className="text-[10px] font-bold bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-full">
                            ລໍຖ້າລົງລາຍເຊັນ
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-900/90 mt-0.5 leading-relaxed">
                          {currentStep?.stepOrder === 2
                            ? 'ເຊັນຄັ້ງທີ 1: ກວດສອບ & ໃຫ້ທິດຊີ້ນຳ ຫົວໜ້າພະແນກ (Department Head - ທ່ານ ປັນຍາສິດ ວົງສຸລີ) + E-Signature'
                            : currentStep?.stepOrder === 3
                            ? 'ເຊັນຄັ້ງທີ 2: ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ ໃຫ້ທິດຊີ້ນຳ + E-Signature'
                            : currentStep?.stepOrder === 4
                            ? 'ເຊັນຄັ້ງທີ 3: ຫົວໜ້າໜ່ວຍງານ ໃຫ້ຄຳເຫັນ + E-Signature'
                            : 'ທ່ານສາມາດເລືອກ ເຊັນອອນລາຍ (Draw) ຫຼື ໃສ່ຮູບລາຍເຊັນ (Upload Image) ໄດ້ທັນທີ'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => openSignaturePad('DRAW', deptHeadUser)}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>✍️ ເຊັນອອນລາຍ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openSignaturePad('UPLOAD', deptHeadUser)}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>🖼️ ໃສ່ຮູບລາຍເຊັນ</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Verified existing signatures */}
                  {doc.signatures.map((sig, sIdx) => (
                    <div
                      key={sig.id}
                      className="p-3 border border-indigo-200 rounded-xl bg-gradient-to-b from-indigo-50/50 to-white text-center shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                            ເຊັນຄັ້ງທີ {sIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setVerifyModalSig(sig);
                              setShowVerifyModal(true);
                            }}
                            className="text-[9px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                            title="ກວດສອບໃບຢັ້ງຢືນລາຍເຊັນ"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>ກວດສອບ</span>
                          </button>
                        </div>

                        <div className="text-[10px] text-slate-500 font-semibold">{sig.positionLao}</div>
                        <div className="my-2 h-14 flex items-center justify-center">
                          {sig.signatureImage.startsWith('data:image') ? (
                            <img
                              src={sig.signatureImage}
                              alt="Signature"
                              className="max-h-12 max-w-full object-contain"
                            />
                          ) : (
                            <div className="font-serif italic text-base text-indigo-900">
                              {sig.signerName}
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-slate-800 text-[11px]">{sig.signerName}</div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[9px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{sig.verificationCode}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setVerifyModalSig(sig);
                            setShowVerifyModal(true);
                          }}
                          className="p-1 rounded bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 transition cursor-pointer"
                          title="ເບິ່ງ QR Code ກວດສອບລາຍເຊັນ"
                        >
                          <QRCodeGenerator
                            text={typeof window !== 'undefined' ? `${window.location.origin}?verify=${sig.verificationCode}` : `https://edoc.state-enterprise.gov.la/verify/${sig.verificationCode}`}
                            size={22}
                          />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Interactive Pending Signature Slot on the Official Document */}
                  {isCurrentStepSignature && doc.status !== 'COMPLETED' && doc.status !== 'ARCHIVED' && (
                    <div className="col-span-2 p-4 border-2 border-dashed border-indigo-300 rounded-2xl bg-gradient-to-b from-indigo-50/80 to-white text-center shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <PenTool className="w-4 h-4 text-indigo-600" />
                          <span>
                            {currentStep?.stepOrder === 2
                              ? 'ຊ່ອງລົງລາຍເຊັນ: ເຊັນຄັ້ງທີ 1: ກວດສອບ & ໃຫ້ທິດຊີ້ນຳ ຫົວໜ້າພະແນກ (Department Head) + E-Signature'
                              : currentStep?.stepOrder === 3
                              ? 'ຊ່ອງລົງລາຍເຊັນ: ເຊັນຄັ້ງທີ 2: ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ ໃຫ້ທິດຊີ້ນຳ + E-Signature'
                              : currentStep?.stepOrder === 4
                              ? 'ຊ່ອງລົງລາຍເຊັນ: ເຊັນຄັ້ງທີ 3: ຫົວໜ້າໜ່ວຍງານ ໃຫ້ຄຳເຫັນ + E-Signature'
                              : `ຊ່ອງລົງລາຍເຊັນດິຈິທັລ: ${currentStep?.stepNameLao}`}
                          </span>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${ROLE_HIERARCHY[currentStep?.requiredRole || 'DEPARTMENT_HEAD']?.color}`}>
                          {ROLE_HIERARCHY[currentStep?.requiredRole || 'DEPARTMENT_HEAD']?.labelLao.split(' ')[0]}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mb-3 text-left leading-relaxed">
                        {currentStep?.stepOrder === 2 ? (
                          <span>
                            ຂັ້ນຕອນນີ້ແມ່ນ <strong>ເຊັນຄັ້ງທີ 1: ກວດສອບ & ໃຫ້ທິດຊີ້ນຳ ຫົວໜ້າພະແນກ (Department Head - ທ່ານ ປັນຍາສິດ ວົງສຸລີ)</strong> ໃຫ້ທິດຊີ້ນຳ ແລະ ລົງລາຍເຊັນດິຈິທັລ (E-Signature) ຮັບຮອງເອກະສານສະບັບນີ້.
                          </span>
                        ) : currentStep?.stepOrder === 3 ? (
                          <span>
                            ຂັ້ນຕອນນີ້ແມ່ນ <strong>ເຊັນຄັ້ງທີ 2: ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ</strong> (ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ ຫຼື ທ່ານ ສອນປະສິດ) ໃຫ້ທິດຊີ້ນຳ ແລະ ລົງລາຍເຊັນດິຈິທັລ (E-Signature) ຮັບຮອງເອກະສານສະບັບນີ້.
                          </span>
                        ) : currentStep?.stepOrder === 4 ? (
                          <span>
                            ຂັ້ນຕອນນີ້ແມ່ນ <strong>ເຊັນຄັ້ງທີ 3: ຫົວໜ້າໜ່ວຍງານ</strong> (ທ່ານ ວຽງຄຳມະໂນຈິດ, ທ່ານ ຄຳແກ້ວ ພິມວົງສາ, ຫຼື ທ່ານ ມະໂນລົບ) ໃຫ້ຄຳເຫັນ ແລະ ລົງລາຍເຊັນດິຈິທັລ (E-Signature) ຮັບຮອງເອກະສານສະບັບນີ້.
                          </span>
                        ) : (
                          <span>
                            ຂັ້ນຕອນນີ້ກຳນົດໃຫ້ <strong>{ROLE_HIERARCHY[currentStep?.requiredRole || 'DEPARTMENT_HEAD']?.labelLao}</strong> ໃຫ້ທິດຊີ້ນຳ ແລະ ລົງລາຍເຊັນດິຈິທັລ (E-Signature) ຮັບຮອງເອກະສານສະບັບນີ້.
                          </span>
                        )}
                      </p>

                      {/* Step 2: 1st Signature - ຫົວໜ້າພະແນກ */}
                      {currentStep?.stepOrder === 2 && (
                        <div className="space-y-2">
                          {/* ຊ່ອງໃສ່ຄຳເຫັນ / ທິດຊີ້ນຳ ເທິງ ເຊັນຄັ້ງທີ 1 (ກວດສອບ - ຫົວໜ້າພະແນກ) */}
                          <div className="mb-3 p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-left shadow-2xs">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                                <span>ຊ່ອງໃສ່ຄຳເຫັນ / ທິດຊີ້ນຳ (ກວດສອບ - ເຊັນຄັ້ງທີ 1 ຫົວໜ້າພະແນກ):</span>
                              </label>
                              <button
                                type="button"
                                onClick={handleSaveCommentOnly}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                title="ບັນທຶກຄຳເຫັນລົງເອກະສານ & Audit Log ທັນທີ"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>ບັນທຶກຄຳເຫັນ</span>
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={persistentCommentInput}
                              onChange={(e) => {
                                setPersistentCommentInput(e.target.value);
                                setInstructionInput(e.target.value);
                                setCommentInput(e.target.value);
                              }}
                              placeholder="ປ້ອນຄຳເຫັນ ຫຼື ທິດຊີ້ນຳຂອງຫົວໜ້າພະແນກ (ເຊັ່ນ: ເຫັນດີຕາມສະເໜີ, ມອບໃຫ້ຮອງພະແນກຊີ້ນຳຕໍ່...)"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 placeholder:text-slate-400"
                            />
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] font-bold text-slate-500">ຂໍ້ຄວາມດ່ວນ:</span>
                              {[
                                'ເຫັນດີຕາມສະເໜີ',
                                'ມອບໃຫ້ຮອງພະແນກຊີ້ນຳຕໍ່',
                                'ມອບໃຫ້ໜ່ວຍງານຄົ້ນຄວ້າ ແລະ ຈັດຕັ້ງປະຕິບັດ',
                                'ເຫັນດີອະນຸມັດ ແລະ ມອບໃຫ້ສາລະບັນສົ່ງອອກ',
                              ].map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const updated = persistentCommentInput ? `${persistentCommentInput} ${preset}` : preset;
                                    setPersistentCommentInput(updated);
                                    setInstructionInput(updated);
                                    setCommentInput(updated);
                                  }}
                                  className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[10px] text-slate-700 cursor-pointer font-medium"
                                >
                                  + {preset}
                                </button>
                              ))}
                              {persistentCommentInput && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPersistentCommentInput('');
                                    setInstructionInput('');
                                    setCommentInput('');
                                  }}
                                  className="px-2 py-0.5 text-[10px] text-rose-500 hover:text-rose-700 ml-auto cursor-pointer"
                                >
                                  ລຶບ
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => openSignaturePad('DRAW', deptHeadUser)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              <span>✍️ ເຊັນອອນລາຍ (ທ່ານ ປັນຍາສິດ ວົງສຸລີ - ຫົວໜ້າພະແນກ)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openSignaturePad('UPLOAD', deptHeadUser)}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>🖼️ ໃສ່ຮູບລາຍເຊັນ (ຫົວໜ້າພະແນກ)</span>
                            </button>
                          </div>
                          {currentUser.role !== 'DEPARTMENT_HEAD' && (
                            <div className="p-2 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 text-left flex items-center justify-between">
                              <span>💡 ຜູ້ຮັບຜິດຊອບເຊັນຄັ້ງທີ 1: <strong>{deptHeadUser.fullName} ({deptHeadUser.positionLao})</strong></span>
                              <button
                                type="button"
                                onClick={() => handleQuickSwitchUserAndSign(deptHeadUser.id, 'DRAW')}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition shrink-0 ml-2"
                              >
                                ສະຫຼັບ ແລະ ເຊັນ
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step 3: 2nd Signature - ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ */}
                      {currentStep?.stepOrder === 3 && (
                        <div className="space-y-2">
                          {/* ຊ່ອງໃສ່ຄຳເຫັນ / ທິດຊີ້ນຳ ເທິງ ເຊັນຄັ້ງທີ 2 (ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ) */}
                          <div className="mb-3 p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-left shadow-2xs">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                                <span>ຊ່ອງໃສ່ຄຳເຫັນ / ທິດຊີ້ນຳ (ເຊັນຄັ້ງທີ 2: ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ):</span>
                              </label>
                              <button
                                type="button"
                                onClick={handleSaveCommentOnly}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                title="ບັນທຶກຄຳເຫັນລົງເອກະສານ & Audit Log ທັນທີ"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>ບັນທຶກຄຳເຫັນ</span>
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={persistentCommentInput}
                              onChange={(e) => {
                                setPersistentCommentInput(e.target.value);
                                setInstructionInput(e.target.value);
                                setCommentInput(e.target.value);
                              }}
                              placeholder="ປ້ອນຄຳເຫັນ ຫຼື ທິດຊີ້ນຳຂອງຮອງຫົວໜ້າພະແນກ (ເຊັ່ນ: ເຫັນດີຕາມຄຳເຫັນຫົວໜ້າພະແນກ, ມອບໃຫ້ໜ່ວຍງານ...)"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 placeholder:text-slate-400"
                            />
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] font-bold text-slate-500">ຂໍ້ຄວາມດ່ວນ:</span>
                              {[
                                'ເຫັນດີຕາມຄຳເຫັນຫົວໜ້າພະແນກ',
                                'ມອບໃຫ້ໜ່ວຍງານຈັດຕັ້ງປະຕິບັດ',
                                'ໃຫ້ກວດກາຄວາມຖືກຕ້ອງເພີ່ມເຕີມ',
                              ].map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const updated = persistentCommentInput ? `${persistentCommentInput} ${preset}` : preset;
                                    setPersistentCommentInput(updated);
                                    setInstructionInput(updated);
                                    setCommentInput(updated);
                                  }}
                                  className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[10px] text-slate-700 cursor-pointer font-medium"
                                >
                                  + {preset}
                                </button>
                              ))}
                              {persistentCommentInput && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPersistentCommentInput('');
                                    setInstructionInput('');
                                    setCommentInput('');
                                  }}
                                  className="px-2 py-0.5 text-[10px] text-rose-500 hover:text-rose-700 ml-auto cursor-pointer"
                                >
                                  ລຶບ
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                            {/* Deputy 1: ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ */}
                            <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-400 transition">
                              <div className="font-bold text-xs text-slate-800">{deputyEngUser.fullName}</div>
                              <div className="text-[10px] text-slate-500 mb-2 leading-tight">{deputyEngUser.positionLao}</div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openSignaturePad('DRAW', deputyEngUser)}
                                  className="flex-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <PenTool className="w-3 h-3" />
                                  <span>✍️ ເຊັນອອນລາຍ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openSignaturePad('UPLOAD', deputyEngUser)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>🖼️ ໃສ່ຮູບ</span>
                                </button>
                              </div>
                            </div>

                            {/* Deputy 2: ທ່ານ ສອນປະສິດ */}
                            <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-400 transition">
                              <div className="font-bold text-xs text-slate-800">{deputyRndUser.fullName}</div>
                              <div className="text-[10px] text-slate-500 mb-2 leading-tight">{deputyRndUser.positionLao}</div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openSignaturePad('DRAW', deputyRndUser)}
                                  className="flex-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <PenTool className="w-3 h-3" />
                                  <span>✍️ ເຊັນອອນລາຍ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openSignaturePad('UPLOAD', deputyRndUser)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>🖼️ ໃສ່ຮູບ</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: 3rd Signature - ຫົວໜ້າໜ່ວຍງານ */}
                      {currentStep?.stepOrder === 4 && (
                        <div className="space-y-2">
                          {/* ຊ່ອງໃສ່ຄຳເຫັນ / ຂໍ້ສະເໜີ ເທິງ ເຊັນຄັ້ງທີ 3 (ຫົວໜ້າໜ່ວຍງານ) */}
                          <div className="mb-3 p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-left shadow-2xs">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                                <span>ຊ່ອງໃສ່ຄຳເຫັນ / ຂໍ້ສະເໜີ (ເຊັນຄັ້ງທີ 3: ຫົວໜ້າໜ່ວຍງານ):</span>
                              </label>
                              <button
                                type="button"
                                onClick={handleSaveCommentOnly}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                title="ບັນທຶກຄຳເຫັນລົງເອກະສານ & Audit Log ທັນທີ"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>ບັນທຶກຄຳເຫັນ</span>
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={persistentCommentInput}
                              onChange={(e) => {
                                setPersistentCommentInput(e.target.value);
                                setInstructionInput(e.target.value);
                                setCommentInput(e.target.value);
                              }}
                              placeholder="ປ້ອນຄຳເຫັນ ຫຼື ຂໍ້ສະເໜີຂອງຫົວໜ້າໜ່ວຍງານ (ເຊັ່ນ: ໜ່ວຍງານຄົ້ນຄວ້າແລ້ວເຫັນວ່າຖືກຕ້ອງ...)"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 placeholder:text-slate-400"
                            />
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] font-bold text-slate-500">ຂໍ້ຄວາມດ່ວນ:</span>
                              {[
                                'ໜ່ວຍງານຮັບຊາບ ແລະ ພວມດຳເນີນການ',
                                'ຄົ້ນຄວ້າແລ້ວເຫັນວ່າຖືກຕ້ອງ',
                                'ສະເໜີພະນັກງານອອກໃບຢັ້ງຢືນ',
                              ].map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    const updated = persistentCommentInput ? `${persistentCommentInput} ${preset}` : preset;
                                    setPersistentCommentInput(updated);
                                    setInstructionInput(updated);
                                    setCommentInput(updated);
                                  }}
                                  className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[10px] text-slate-700 cursor-pointer font-medium"
                                >
                                  + {preset}
                                </button>
                              ))}
                              {persistentCommentInput && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPersistentCommentInput('');
                                    setInstructionInput('');
                                    setCommentInput('');
                                  }}
                                  className="px-2 py-0.5 text-[10px] text-rose-500 hover:text-rose-700 ml-auto cursor-pointer"
                                >
                                  ລຶບ
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                            {/* Unit 1: ທ່ານ ວຽງຄຳມະໂນຈິດ */}
                            <div className="p-2.5 bg-white rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-400 transition">
                              <div className="font-bold text-xs text-slate-800">{unitEngUser.fullName}</div>
                              <div className="text-[10px] text-slate-500 mb-2 leading-tight">{unitEngUser.positionLao}</div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openSignaturePad('DRAW', unitEngUser)}
                                  className="flex-1 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <PenTool className="w-3 h-3" />
                                  <span>✍️ ເຊັນ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openSignaturePad('UPLOAD', unitEngUser)}
                                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>🖼️</span>
                                </button>
                              </div>
                            </div>

                            {/* Unit 2: ທ່ານ ຄຳແກ້ວ ພິມວົງສາ */}
                            <div className="p-2.5 bg-white rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-400 transition">
                              <div className="font-bold text-xs text-slate-800">{unitCoordUser.fullName}</div>
                              <div className="text-[10px] text-slate-500 mb-2 leading-tight">{unitCoordUser.positionLao}</div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openSignaturePad('DRAW', unitCoordUser)}
                                  className="flex-1 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <PenTool className="w-3 h-3" />
                                  <span>✍️ ເຊັນ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openSignaturePad('UPLOAD', unitCoordUser)}
                                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>🖼️</span>
                                </button>
                              </div>
                            </div>

                            {/* Unit 3: ທ່ານ ມະໂນລົບ */}
                            <div className="p-2.5 bg-white rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-400 transition">
                              <div className="font-bold text-xs text-slate-800">{unitRndUser.fullName}</div>
                              <div className="text-[10px] text-slate-500 mb-2 leading-tight">{unitRndUser.positionLao}</div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openSignaturePad('DRAW', unitRndUser)}
                                  className="flex-1 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <PenTool className="w-3 h-3" />
                                  <span>✍️ ເຊັນ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openSignaturePad('UPLOAD', unitRndUser)}
                                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>🖼️</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Any other signature step */}
                      {currentStep?.stepOrder !== 2 && currentStep?.stepOrder !== 3 && currentStep?.stepOrder !== 4 && (
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => openSignaturePad('DRAW')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>✍️ ເຊັນອອນລາຍ (Draw Signature)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openSignaturePad('UPLOAD')}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>🖼️ ໃສ່ຮູບລາຍເຊັນ (Upload Image)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {doc.signatures.length === 0 && !isCurrentStepSignature && (
                    <div className="col-span-2 p-4 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 italic text-[11px]">
                      ຍັງບໍ່ທັນມີລາຍເຊັນດິຈິທັລໃນເອກະສານສະບັບນີ້
                    </div>
                  )}
                </div>

                {/* QR Code Verification Stamp Banner on signed documents */}
                {doc.signatures.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-indigo-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-white rounded-lg border border-emerald-300 shadow-2xs">
                        <QRCodeGenerator
                          text={typeof window !== 'undefined' ? `${window.location.origin}?verify=${doc.signatures[doc.signatures.length - 1].verificationCode}` : `https://edoc.state-enterprise.gov.la/verify/${doc.documentNumber}`}
                          size={46}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>ເອກະສານຜ່ານການຢັ້ງຢືນ E-Signature ແລ້ວ ({doc.signatures.length} ລາຍເຊັນ)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Scan QR Code ເພື່ອກວດສອບຄວາມຖືກຕ້ອງ ແລະ ປະຫວັດການລົງລາຍເຊັນດິຈິທັລ
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setVerifyModalSig(doc.signatures[doc.signatures.length - 1]);
                        setShowVerifyModal(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                    >
                      <span>ໃບຢັ້ງຢືນ QR Code</span>
                    </button>
                  </div>
                )}

                {/* Staff Verification Certificate Official Seal ("ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ") */}
                {doc.staffVerification && (
                  <div className="mt-4 p-4 rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5 flex-wrap">
                            <span>ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ (Staff Verification Certificate)</span>
                            <span className="text-[9px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                              VERIFIED 100%
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ເລກທີຢັ້ງຢືນ: {doc.staffVerification.certificateNumber} • ວັນທີ: {new Date(doc.staffVerification.verifiedAt).toLocaleString('lo-LA')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 bg-white/95 rounded-xl border border-emerald-200 text-[11px] text-slate-700 leading-relaxed space-y-1">
                      <div>
                        <span className="font-semibold text-emerald-900">ຜູ້ກວດກາ ແລະ ອອກໃບຢັ້ງຢືນ: </span>
                        <strong>{doc.staffVerification.verifiedByUserName}</strong> ({doc.staffVerification.verifiedByPosition})
                      </div>
                      <div className="text-slate-600 italic pl-2 border-l-2 border-emerald-400">
                        "{doc.staffVerification.verificationNote}"
                      </div>
                      {doc.staffVerification.attachedFileName && (
                        <div className="text-[10px] text-indigo-700 flex items-center gap-1 pt-0.5 font-medium">
                          <Paperclip className="w-3 h-3 text-indigo-500" />
                          <span>ໄຟລ໌ຄັດຕິດ: {doc.staffVerification.attachedFileName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Interactive Staff Verification Card when at Step 5 */}
                {currentStep?.stepOrder === (isIncoming ? 5 : 7) && doc.status !== 'COMPLETED' && (
                  <div className="mt-4 p-4 rounded-2xl border-2 border-dashed border-emerald-400 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5 flex-wrap">
                            <span>ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-md animate-pulse">
                              ກຳລັງດຳເນີນການ
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-800 font-medium">
                            ບົດບາດ: ພະນັກງານ (Staff) ບັນທຶກໄວ້ຄັງເອກະສານ
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      ຂັ້ນຕອນນີ້ແມ່ນ <strong>ພະນັກງານ (Staff)</strong> ກວດກາຄວາມຖືກຕ້ອງຂອງລາຍເຊັນທັງໝົດ, ອອກໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງ ແລະ ບັນທຶກໄວ້ຄັງເອກະສານ ເພື່ອສົ່ງຕໍ່ໄປຍັງຂັ້ນຕອນ E-Storage Archive.
                    </p>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          ຂໍ້ຄວາມຢັ້ງຢືນຄວາມຖືກຕ້ອງ:
                        </label>
                        <input
                          type="text"
                          value={staffVerificationNote}
                          onChange={(e) => setStaffVerificationNote(e.target.value)}
                          placeholder="ກວດສອບລາຍເຊັນທັງໝົດຄົບຖ້ວນ, ຖືກຕ້ອງຕາມລະບຽບການ 100%"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleStaffVerification()}
                          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>📜 ອອກໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ & ສົ່ງຕໍ່ E-Storage</span>
                        </button>
                        {currentUser.role !== 'STAFF' && (
                          <button
                            type="button"
                            onClick={() => {
                              const switched = AuthService.switchUserById(staffUser.id);
                              if (onUserChange) onUserChange(switched);
                            }}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-medium transition cursor-pointer shrink-0"
                          >
                            ສະຫຼັບເປັນ ພະນັກງານ (Staff)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive E-Storage Archive Card when at Step 6 */}
                {currentStep?.stepOrder === (isIncoming ? 6 : 8) && doc.status !== 'COMPLETED' && (
                  <div className="mt-4 p-4 rounded-2xl border-2 border-indigo-300 bg-gradient-to-r from-indigo-50/90 via-blue-50/50 to-white shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          <FolderArchive className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-indigo-950 flex items-center gap-1.5 flex-wrap">
                            <span>E-Storage Archive & ສຳເລັດ</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-md animate-pulse">
                              ກຳລັງດຳເນີນການ
                            </span>
                          </div>
                          <div className="text-[10px] text-indigo-800 font-medium">
                            ບົດບາດ: ພະນັກງານ (Staff)
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      ຂັ້ນຕອນສຸດທ້າຍ: <strong>ພະນັກງານ (Staff)</strong> ບັນທຶກເອກະສານເຂົ້າຄັງ E-Storage ({isIncoming ? 'ໂຟນເດີ 2026/ຂາເຂົ້າ' : 'ໂຟນເດີ 2026/ຂາອອກ'}) ແລະ ສຳເລັດຂະບວນການ Workflow ສົມບູນ.
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleArchiveComplete}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <FolderArchive className="w-4 h-4" />
                        <span>📦 ບັນທຶກເຂົ້າຄັງ E-Storage & ສຳເລັດ (COMPLETED)</span>
                      </button>
                      {currentUser.role !== 'STAFF' && (
                        <button
                          type="button"
                          onClick={() => {
                            const switched = AuthService.switchUserById(staffUser.id);
                            if (onUserChange) onUserChange(switched);
                          }}
                          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-medium transition cursor-pointer shrink-0"
                        >
                          ສະຫຼັບເປັນ ພະນັກງານ (Staff)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Document footer watermark */}
              <div className="mt-8 pt-2 text-center text-[10px] text-slate-400 font-mono">
                [ລະບົບ E-DOCUMENT ລັດວິສາຫະກິດ • DOC ID: {doc.id}]
              </div>
            </div>
            )}

            {/* TAB 2: VERSION CONTROL TIMELINE & REVERT VIEW */}
            {activeTab === 'VERSIONS' && (
              <div className="w-full max-w-xl space-y-4">
                {/* Header card for version history */}
                <div className="bg-white rounded-2xl p-5 border border-amber-200/90 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>ປະຫວັດເວີຊັນ (Version Control)</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            {doc.currentVersion ? `v${doc.currentVersion}.0` : 'v1.0'}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          ບັນທຶກປະຫວັດການດັດແກ້ທຸກຄັ້ງ • ສາມາດກວດສອບ ແລະ ຟື້ນຟູກັບຄືນສະບັບເກົ່າໄດ້
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditSubject(doc.subject);
                        setEditCategory(doc.category);
                        setEditDocumentType(doc.documentType);
                        setEditPriority(doc.priority);
                        setEditPurpose(doc.purpose);
                        setEditPurposeNote(doc.purposeNote || '');
                        setEditInstructions(doc.instructions || '');
                        setEditComments(doc.comments || '');
                        setEditSender(doc.sender);
                        setEditRecipient(doc.recipient);
                        setEditChangeSummary('');
                        setShowEditContentModal(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ດັດແກ້ເນື້ອໃນ</span>
                    </button>
                  </div>
                </div>

                {/* Timeline of versions */}
                <div className="space-y-3">
                  {(doc.versions || []).slice().reverse().map((ver) => {
                    const isCurrent = ver.versionNumber === (doc.currentVersion || doc.versions?.length || 1);
                    return (
                      <div
                        key={ver.id}
                        className={`bg-white rounded-2xl p-4.5 border transition shadow-xs ${
                          isCurrent
                            ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white">
                              {ver.versionTag}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>ເວີຊັນປະຈຸບັນ (Active)</span>
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ver.changeType === 'INITIAL'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : ver.changeType === 'CONTENT_EDIT'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : ver.changeType === 'ATTACHMENT_ADD'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ver.changeType === 'ATTACHMENT_REMOVE'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {ver.changeType === 'INITIAL' && '🚀 ສ້າງໃໝ່ (Initial)'}
                              {ver.changeType === 'CONTENT_EDIT' && '✏️ ດັດແກ້ເນື້ອໃນ (Edit)'}
                              {ver.changeType === 'ATTACHMENT_ADD' && '📎 ເພີ່ມໄຟລ໌ (Add File)'}
                              {ver.changeType === 'ATTACHMENT_REMOVE' && '🗑️ ລຶບໄຟລ໌ (Remove File)'}
                              {ver.changeType === 'REVERT' && '🔄 ຟື້ນຟູເວີຊັນ (Revert)'}
                            </span>
                          </div>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleRevert(ver)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                              title="ຟື້ນຟູເອກະສານກັບຄືນສູ່ເວີຊັນນີ້"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              <span>ຟື້ນຟູສະບັບນີ້ (Revert)</span>
                            </button>
                          )}
                        </div>

                        {/* Summary */}
                        <div className="mt-2.5">
                          <p className="text-xs font-semibold text-slate-800">
                            {ver.changeSummary}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                            <span>ໂດຍ: <strong className="text-slate-700">{ver.authorName}</strong> ({ver.authorRole})</span>
                            <span>•</span>
                            <span>{new Date(ver.timestamp).toLocaleString('lo-LA')}</span>
                            <span>•</span>
                            <span>ໄຟລ໌ຄັດຕິດ: {ver.snapshot.attachments.length} ໄຟລ໌</span>
                          </div>
                        </div>

                        {/* Snapshot details preview */}
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                            <span>ຂໍ້ມູນສະບັບນີ້ (SNAPSHOT PREVIEW):</span>
                            <span className="font-mono text-slate-400">{ver.versionTag}</span>
                          </div>
                          <div className="text-slate-800 font-medium">
                            <span className="text-slate-500 font-normal">ເລື່ອງ: </span>
                            {ver.snapshot.subject}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[11px]">
                            <span className="text-slate-500">ຄວາມດ່ວນ:</span>
                            <span className="font-semibold text-slate-700">{ver.snapshot.priority}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">ຈຸດປະສົງ:</span>
                            <span className="font-semibold text-slate-700">
                              {ver.snapshot.purpose === 'RESEARCH' ? '🔍 ເພື່ອຄົ້ນຄວ້າ' : ver.snapshot.purpose === 'INFORM' ? '📢 ເພື່ອຮັບຊາບ' : '📌 ອື່ນໆ'}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500">ຜູ້ສົ່ງ:</span>
                            <span className="font-semibold text-slate-700">{ver.snapshot.sender}</span>
                          </div>
                          {ver.snapshot.attachments.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-200/70 text-[11px] text-slate-600">
                              <span className="font-medium text-slate-700">ໄຟລ໌ຄັດຕິດ ({ver.snapshot.attachments.length}): </span>
                              {ver.snapshot.attachments.map(a => a.fileName).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: ATTACHMENTS MANAGER VIEW */}
            {activeTab === 'ATTACHMENTS' && (
              <div className="w-full max-w-xl space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        ຈັດການໄຟລ໌ຄັດຕິດ (Manage Attachments)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        ມີໄຟລ໌ທັງໝົດ {doc.attachments.length} ໄຟລ໌ • ທຸກການເພີ່ມ/ລຶບຈະຖືກບັນທຶກເຂົ້າໃນ Version Control ອັດຕະໂນມັດ
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddAttachmentModal(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ເພີ່ມໄຟລ໌ໃໝ່</span>
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
                  {doc.attachments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      ບໍ່ມີໄຟລ໌ຄັດຕິດໃນເອກະສານນີ້
                    </div>
                  ) : (
                    doc.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3 truncate pr-3">
                          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-slate-800 truncate">{att.fileName}</div>
                            <div className="text-[10px] text-slate-400">
                              {(att.fileSize / 1024 / 1024).toFixed(2)} MB • ອັບໂຫຼດໂດຍ: {att.uploadedBy} • {new Date(att.uploadDate).toLocaleDateString('lo-LA')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => alert.fire({ type: 'info', title: 'ດາວໂຫຼດໄຟລ໌', text: `ກຳລັງດາວໂຫຼດ: ${att.fileName}` })}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>ດາວໂຫຼດ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id, att.fileName)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="ລຶບໄຟລ໌ (ລະບົບຈະສ້າງເວີຊັນໃໝ່)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ລຶບ</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 3: RIGHT (Workflow Timeline & Interactive Action Controls) - col-span-4 */}
          <div className="col-span-12 lg:col-span-4 bg-white p-5 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ຂະບວນການດຳເນີນງານ (WORKFLOW TIMELINE)
                </div>
                <span className="text-xs font-bold text-slate-700">
                  ຂັ້ນຕອນ {doc.currentStepOrder} / {doc.workflowSteps.length}
                </span>
              </div>

              {/* Rejection / Returned Alert Banner */}
              {doc.status === 'RETURNED' && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">ເອກະສານຖືກສົ່ງຄືນ (Returned)</span>
                    <p className="text-[11px] text-rose-700 mt-0.5">{doc.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Workflow Stepper Timeline List */}
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {doc.workflowSteps.map((step) => {
                  const isDone = step.status === 'COMPLETED';
                  const isCurrent = step.status === 'CURRENT';
                  const isReturned = step.status === 'RETURNED';

                  return (
                    <div key={step.stepOrder} className="relative">
                      {/* Step Circle Indicator */}
                      <div
                        className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition ${
                          isDone
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                            : isCurrent
                            ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100 shadow-xs'
                            : isReturned
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-white text-slate-400 border-slate-300'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          step.stepOrder
                        )}
                      </div>

                      {/* Step Card Content */}
                      <div className={`p-3 rounded-xl border transition ${
                        isCurrent
                          ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                          : isDone
                          ? 'bg-slate-50/60 border-slate-200'
                          : 'bg-transparent border-transparent opacity-60'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="text-xs font-bold text-slate-800">
                            {step.stepNameLao}
                          </div>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-md animate-pulse">
                              ກຳລັງດຳເນີນການ
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          <span>
                            {step.stepNameLao.includes('ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງ')
                              ? 'ບົດບາດ: ພະນັກງານ (Staff) ບັນທຶກໄວ້ຄັງເອກະສານ'
                              : step.stepNameLao.includes('E-Storage')
                              ? 'ບົດບາດ: ພະນັກງານ (Staff)'
                              : `ບົດບາດ: ${ROLE_HIERARCHY[step.requiredRole]?.labelLao}`}
                          </span>
                        </div>

                        {step.completedAt && (
                          <div className="mt-1 text-[10px] text-emerald-700 font-medium">
                            ✓ ສຳເລັດເມື່ອ: {new Date(step.completedAt).toLocaleString('lo-LA')} ໂດຍ {step.completedByUserName}
                          </div>
                        )}

                        {step.comment && (
                          <div className="mt-1.5 p-2 bg-white rounded-lg text-[11px] text-slate-600 border border-slate-100">
                            <span className="font-semibold text-slate-700">ຄຳເຫັນ: </span>
                            {step.comment}
                          </div>
                        )}

                        {step.instruction && (
                          <div className="mt-1.5 p-2 bg-amber-50 rounded-lg text-[11px] text-amber-900 border border-amber-200 font-medium">
                            <span className="font-bold">ທິດຊີ້ນຳ: </span>
                            {step.instruction}
                          </div>
                        )}

                        {step.signature && (
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            <span>ເຊັນແລ້ວ: {step.signature.verificationCode}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTION SECTION (Protected by Central Authorization Guards) */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>ການດຳເນີນການໃນຂັ້ນຕອນປັດຈຸບັນ</span>
                {auth.isRoleMatching ? (
                  <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ທ່ານມີສິດດຳເນີນການ</span>
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold text-[11px] flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>ບໍ່ມີສິດດຳເນີນການ</span>
                  </span>
                )}
              </div>

              {doc.status === 'COMPLETED' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-semibold">
                  ✓ ເອກະສານນີ້ສຳເລັດທຸກຂັ້ນຕອນ ແລະ ເກັບເຂົ້າຄັງ E-Storage ແລ້ວ
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Inputs for instructions or comments if user is authorized */}
                  {auth.isRoleMatching && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          ທິດຊີ້ນຳ (Directives / Instructions) ຖ້າມີ:
                        </label>
                        <input
                          type="text"
                          value={instructionInput}
                          onChange={(e) => setInstructionInput(e.target.value)}
                          placeholder="ໃສ່ທິດຊີ້ນຳ ເຊັ່ນ: ເຫັນດີຕາມສະເໜີ, ມອບໃຫ້ວິຊາການ..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          ຄຳເຫັນເພີ່ມເຕີມ:
                        </label>
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="ຄຳເຫັນປະກອບ..."
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Unauthorized lock alert message when user role does not match */}
                  {!auth.isRoleMatching && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          ສະເພາະ: {ROLE_HIERARCHY[currentStep?.requiredRole || 'STAFF']?.labelLao}
                        </span>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          ບົດບາດປັດຈຸບັນຂອງທ່ານແມ່ນ "{currentUser.positionLao || currentUser.role}".
                          (ທ່ານສາມາດໃຊ້ Role Switcher ດ້ານເທິງເພື່ອທົດສອບສະຫຼັບບົດບາດໄດ້)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Buttons with WorkflowActionGuard wrappers */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* E-Signature Buttons (Wrapped with WorkflowActionGuard) */}
                    <WorkflowActionGuard
                      user={currentUser}
                      document={doc}
                      action="SIGN"
                      showDisabledLock={true}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => openSignaturePad('DRAW')}
                          className="flex-1 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>✍️ ເຊັນອອນລາຍ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openSignaturePad('UPLOAD')}
                          className="flex-1 px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>🖼️ ໃສ່ຮູບລາຍເຊັນ</span>
                        </button>
                      </div>
                    </WorkflowActionGuard>

                    {/* Forward / Approve Button */}
                    <WorkflowActionGuard
                      user={currentUser}
                      document={doc}
                      action="FORWARD"
                      showDisabledLock={true}
                    >
                      <button
                        onClick={handleForwardOrApprove}
                        className="flex-1 min-w-[130px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>ອະນຸມັດ / ສົ່ງຕໍ່</span>
                      </button>
                    </WorkflowActionGuard>

                    {/* Step 5 (or 7): ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ */}
                    {(currentStep?.stepOrder === (isIncoming ? 5 : 7)) && (
                      <div className="w-full space-y-2">
                        <WorkflowActionGuard
                          user={currentUser}
                          document={doc}
                          action="STAFF_VERIFY"
                          showDisabledLock={true}
                        >
                          <button
                            onClick={() => handleStaffVerification()}
                            className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>📜 ອອກໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ</span>
                          </button>
                        </WorkflowActionGuard>
                        {currentUser.role !== 'STAFF' && (
                          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[10px] text-emerald-900 flex items-center justify-between">
                            <span>ບົດບາດ: ພະນັກງານ (Staff) ບັນທຶກໄວ້ຄັງເອກະສານ</span>
                            <button
                              type="button"
                              onClick={() => {
                                const switched = AuthService.switchUserById(staffUser.id);
                                if (onUserChange) onUserChange(switched);
                              }}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              ສະຫຼັບເປັນ Staff
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 6 (or 8): E-Storage Archive & ສຳເລັດ */}
                    {(currentStep?.stepOrder === (isIncoming ? 6 : 8)) && (
                      <div className="w-full space-y-2">
                        <WorkflowActionGuard
                          user={currentUser}
                          document={doc}
                          action="ARCHIVE"
                          showDisabledLock={true}
                        >
                          <button
                            onClick={handleArchiveComplete}
                            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            <FolderArchive className="w-4 h-4" />
                            <span>📦 ບັນທຶກເຂົ້າຄັງ E-Storage & ສຳເລັດ</span>
                          </button>
                        </WorkflowActionGuard>
                        {currentUser.role !== 'STAFF' && (
                          <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-200 text-[10px] text-indigo-900 flex items-center justify-between">
                            <span>ບົດບາດ: ພະນັກງານ (Staff)</span>
                            <button
                              type="button"
                              onClick={() => {
                                const switched = AuthService.switchUserById(staffUser.id);
                                if (onUserChange) onUserChange(switched);
                              }}
                              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              ສະຫຼັບເປັນ Staff
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Return / Reject Button (Enabled only if step > 1) */}
                    {doc.currentStepOrder > 1 && (
                      <WorkflowActionGuard
                        user={currentUser}
                        document={doc}
                        action="RETURN"
                        showDisabledLock={true}
                      >
                        <button
                          onClick={handleReturn}
                          className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                          title="ຕີກັບເອກະສານໄປຫາຂັ້ນຕອນກ່ອນໜ້າ"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>ຕີກັບ / ສົ່ງຄືນ</span>
                        </button>
                      </WorkflowActionGuard>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {showSignPad && (
        <ESignaturePad
          signerName={activeSignerUser.fullName}
          signerPosition={activeSignerUser.positionLao}
          initialMode={signPadMode}
          onSave={handleSignatureSave}
          onCancel={() => setShowSignPad(false)}
        />
      )}

      {/* Verify Signature Certificate Modal */}
      {showVerifyModal && (
        <VerifySignatureModal
          document={doc}
          targetSignature={verifyModalSig || undefined}
          onClose={() => setShowVerifyModal(false)}
        />
      )}

      {/* Automated Email Alerts History Modal */}
      {showEmailAlertsModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                  <Mail className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    ປະຫວັດການສົ່ງອີເມວແຈ້ງເຕືອນອັດຕະໂນມັດ (Email Alerts Log)
                  </h3>
                  <p className="text-xs text-indigo-200 font-mono">
                    ເອກະສານ: {doc.documentNumber} • ທັງໝົດ {docEmailAlerts.length} ລາຍການ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEmailAlertsModal(false);
                  setSelectedEmailAlert(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {docEmailAlerts.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs">
                  ຍັງບໍ່ທັນມີປະຫວັດການສົ່ງອີເມວແຈ້ງເຕືອນສຳລັບເອກະສານນີ້
                </div>
              ) : selectedEmailAlert ? (
                /* Single Email Alert HTML Preview */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSelectedEmailAlert(null)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      ← ກັບຄືນລາຍການອີເມວທັງໝົດ
                    </button>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(selectedEmailAlert.sentAt).toLocaleString('lo-LA')}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div>
                      <span className="text-slate-400 font-semibold">ຫົວຂໍ້ອີເມວ: </span>
                      <span className="font-bold text-slate-800">{selectedEmailAlert.subject}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">ຜູ້ຮັບ (To): </span>
                      <span className="font-semibold text-indigo-700">{selectedEmailAlert.recipientName}</span>{' '}
                      <span className="text-slate-500 font-mono">&lt;{selectedEmailAlert.recipientEmail}&gt;</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">ສະຖານະ: </span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ {selectedEmailAlert.status} (ສົ່ງຮອດກ່ອງຈົດໝາຍແລ້ວ)
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div
                      className="p-4 bg-white text-xs"
                      dangerouslySetInnerHTML={{ __html: selectedEmailAlert.emailBodyHtml }}
                    />
                  </div>
                </div>
              ) : (
                /* List of Sent Email Alerts */
                <div className="divide-y divide-slate-100">
                  {docEmailAlerts.map((eml) => (
                    <div
                      key={eml.id}
                      onClick={() => setSelectedEmailAlert(eml)}
                      className="p-3.5 hover:bg-slate-50 rounded-xl transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-transparent hover:border-slate-200"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold">
                            {eml.actionRequired}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {eml.recipientName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            &lt;{eml.recipientEmail}&gt;
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium">
                          {eml.subject}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ຂັ້ນຕອນ: {eml.stepNameLao} • ຜູ້ສົ່ງຕໍ່: {eml.senderName}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                          ✓ ສົ່ງແລ້ວ
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(eml.sentAt).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowEmailAlertsModal(false);
                  setSelectedEmailAlert(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ປິດ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Content Modal (Bumps Version) */}
      {showEditContentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
                  <Edit3 className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    ດັດແກ້ເນື້ອໃນເອກະສານ (Edit Content & Bump Version)
                  </h3>
                  <p className="text-xs text-blue-200">
                    ການດັດແກ້ຈະສ້າງເວີຊັນໃໝ່ອັດຕະໂນມັດ (v{(doc.currentVersion || 1) + 1}.0)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditContentModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditContent} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ຫົວຂໍ້ / ເລື່ອງ (Subject) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>ລະດັບຄວາມດ່ວນ (Priority):</span>
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as DocumentPriority)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="LOW">🟢 ຕ່ຳ (Low)</option>
                    <option value="MEDIUM">🔵 ປານກາງ (Medium)</option>
                    <option value="HIGH">🟠 ສູງ (High)</option>
                    <option value="URGENT">🚨 ດ່ວນທີ່ສຸດ (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ຈຸດປະສົງ (Purpose):</span>
                  </label>
                  <select
                    value={editPurpose}
                    onChange={(e) => setEditPurpose(e.target.value as DocumentPurpose)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="RESEARCH">🔍 ເພື່ອຄົ້ນຄວ້າ (Research)</option>
                    <option value="INFORM">📢 ເພື່ອຮັບຊາບ (Inform)</option>
                    <option value="OTHER">📌 ອື່ນໆ (Other)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຄຳອະທິບາຍຈຸດປະສົງເພີ່ມເຕີມ:
                </label>
                <input
                  type="text"
                  value={editPurposeNote}
                  onChange={(e) => setEditPurposeNote(e.target.value)}
                  placeholder="ລະບຸລາຍລະອຽດເພີ່ມເຕີມ (ຖ້າມີ)..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isIncoming ? 'ໜ່ວຍງານສົ່ງມາ' : 'ພະແນກຕົ້ນກຳເນີດ'}
                  </label>
                  <input
                    type="text"
                    value={editSender}
                    onChange={(e) => setEditSender(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isIncoming ? 'ຜູ້ຮັບພາຍໃນ' : 'ຜູ້ຮັບປາຍທາງ'}
                  </label>
                  <input
                    type="text"
                    value={editRecipient}
                    onChange={(e) => setEditRecipient(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  ບັນທຶກການປ່ຽນແປງ (Change Summary Note) *
                </label>
                <input
                  type="text"
                  required
                  value={editChangeSummary}
                  onChange={(e) => setEditChangeSummary(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ປັບປຸງເນື້ອໃນວັກ 2, ແກ້ໄຂຫົວຂໍ້ ແລະ ຈຸດປະສົງ..."
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-amber-700 mt-1 block">
                  ຂໍ້ຄວາມນີ້ຈະຖືກບັນທຶກລົງໃນປະຫວັດ Version Control ເພື່ອໃຫ້ຜູ້ອື່ນກວດສອບໄດ້
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditContentModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  ບັນທຶກ & ສ້າງເວີຊັນໃໝ່ (Save & Bump Version)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Attachment Modal (Bumps Version) */}
      {showAddAttachmentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                  <Paperclip className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    ເພີ່ມເອກະສານຄັດຕິດ (Add Attachment)
                  </h3>
                  <p className="text-xs text-emerald-200">
                    ການເພີ່ມໄຟລ໌ຈະສ້າງເວີຊັນໃໝ່ອັດຕະໂນມັດ (v{(doc.currentVersion || 1) + 1}.0)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAttachmentModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddAttachment} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ຊື່ໄຟລ໌ເອກະສານຄັດຕິດ *
                </label>
                <input
                  type="text"
                  required
                  value={newAttachmentName}
                  onChange={(e) => setNewAttachmentName(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ບົດບັນທຶກການປະຊຸມ_ສະບັບປັບປຸງ.pdf"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ໝາຍເຫດ / ລາຍລະອຽດໄຟລ໌
                </label>
                <input
                  type="text"
                  value={newAttachmentNote}
                  onChange={(e) => setNewAttachmentNote(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ແນບເພີ່ມຕາມການຊີ້ນຳຂອງຫົວໜ້າພະແນກ..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-slate-700 block">
                  ເລືອກໄຟລ໌ຈາກເຄື່ອງ ຫຼື ລາກວາງທີ່ນີ້
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ຮອງຮັບ PDF, DOCX, XLSX, PNG, JPG (ຂະໜາດບໍ່ເກີນ 25MB)
                </span>
                <input
                  type="file"
                  className="hidden"
                  id="file-upload-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setNewAttachmentName(f.name);
                      setNewAttachmentSize(f.size);
                    }
                  }}
                />
                <label
                  htmlFor="file-upload-input"
                  className="mt-2.5 inline-block px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Browse Files
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddAttachmentModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  ເພີ່ມໄຟລ໌ & ສ້າງເວີຊັນໃໝ່ (Upload & Bump Version)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Version History Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-slate-900 to-amber-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-400/30">
                  <History className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span>ປະຫວັດເວີຊັນທັງໝົດ (Document Version History)</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                      {doc.currentVersion ? `v${doc.currentVersion}.0` : 'v1.0'}
                    </span>
                  </h3>
                  <p className="text-xs text-amber-200 font-mono">
                    ເອກະສານ: {doc.documentNumber} • ທັງໝົດ {doc.versions?.length || 1} ສະບັບ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVersionModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {(doc.versions || []).slice().reverse().map((ver) => {
                const isCurrent = ver.versionNumber === (doc.currentVersion || doc.versions?.length || 1);
                return (
                  <div
                    key={ver.id}
                    className={`bg-white rounded-2xl p-4 border transition ${
                      isCurrent
                        ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white">
                          {ver.versionTag}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>ເວີຊັນປະຈຸບັນ (Active)</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ver.changeType === 'INITIAL'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : ver.changeType === 'CONTENT_EDIT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : ver.changeType === 'ATTACHMENT_ADD'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ver.changeType === 'ATTACHMENT_REMOVE'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {ver.changeType === 'INITIAL' && '🚀 ສ້າງໃໝ່ (Initial)'}
                          {ver.changeType === 'CONTENT_EDIT' && '✏️ ດັດແກ້ເນື້ອໃນ (Edit)'}
                          {ver.changeType === 'ATTACHMENT_ADD' && '📎 ເພີ່ມໄຟລ໌ (Add File)'}
                          {ver.changeType === 'ATTACHMENT_REMOVE' && '🗑️ ລຶບໄຟລ໌ (Remove File)'}
                          {ver.changeType === 'REVERT' && '🔄 ຟື້ນຟູເວີຊັນ (Revert)'}
                        </span>
                      </div>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowVersionModal(false);
                            handleRevert(ver);
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                          title="ຟື້ນຟູເອກະສານກັບຄືນສູ່ເວີຊັນນີ້"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>ຟື້ນຟູສະບັບນີ້ (Revert)</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-2 text-xs">
                      <p className="font-semibold text-slate-800">{ver.changeSummary}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span>ໂດຍ: <strong>{ver.authorName}</strong> ({ver.authorRole})</span>
                        <span>•</span>
                        <span>{new Date(ver.timestamp).toLocaleString('lo-LA')}</span>
                        <span>•</span>
                        <span>ໄຟລ໌ຄັດຕິດ: {ver.snapshot.attachments.length} ໄຟລ໌</span>
                      </div>
                    </div>

                    {/* Snapshot box */}
                    <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <div>
                        <strong className="text-slate-500">ເລື່ອງ: </strong>
                        {ver.snapshot.subject}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ຄວາມດ່ວນ: <strong>{ver.snapshot.priority}</strong> • ຈຸດປະສົງ: <strong>{ver.snapshot.purpose}</strong> • ຜູ້ສົ່ງ: <strong>{ver.snapshot.sender}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowVersionModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ປິດ (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* PRINT-ONLY OFFICIAL VIEW (Used for Export as PDF and physical printing) */}
    <div className="print-only p-8 bg-white text-slate-900 font-sans max-w-4xl mx-auto leading-relaxed">
      {/* Official Lao Letterhead */}
      <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
        <div className="font-bold text-base tracking-wide uppercase">
          ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
        </div>
        <div className="text-xs font-semibold text-slate-800">
          ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
        </div>
        <div className="text-xs text-slate-500 my-1">--------------- 000 ---------------</div>

        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="text-left flex items-center gap-3">
            <LHSELogo size={56} />
            <div>
              <div className="font-bold text-sm">ລັດວິສາຫະກິດຖືຮຸ້ນລາວ</div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-tight">LAO HOLDING STATE ENTERPRISE</div>
              <div className="text-slate-700">{doc.departmentName}</div>
            </div>
          </div>
          <div className="text-right">
            <div>ເລກທີ: <span className="font-bold font-mono text-sm">{doc.documentNumber}</span></div>
            <div>ນະຄອນຫຼວງວຽງຈັນ, ວັນທີ: {doc.documentDate}</div>
          </div>
        </div>
      </div>

      {/* Document Subject Header */}
      <div className="mb-6 text-center">
        <h1 className="text-lg font-bold underline decoration-1 underline-offset-4 mb-2">
          {doc.documentType}: {doc.subject}
        </h1>
      </div>

      {/* Document Metadata Table */}
      <div className="mb-6 border border-slate-300 rounded-lg p-3 text-xs grid grid-cols-2 gap-3 bg-slate-50/50">
        <div>
          <span className="font-bold">ຮຽນ: </span>
          <span>{doc.recipient}</span>
        </div>
        <div>
          <span className="font-bold">ຜູ້ສົ່ງ/ຕົ້ນທາງ: </span>
          <span>{doc.sender}</span>
        </div>
        <div>
          <span className="font-bold">🎯 ຈຸດປະສົງ: </span>
          <span>
            {doc.purpose === 'RESEARCH' ? '🔍 ເພື່ອຄົ້ນຄວ້າ (Research)' : doc.purpose === 'INFORM' ? '📢 ເພື່ອຮັບຊາບ (Inform)' : '📌 ອື່ນໆ'}
            {doc.purposeNote ? ` - ${doc.purposeNote}` : ''}
          </span>
        </div>
        <div>
          <span className="font-bold">ລະດັບຄວາມດ່ວນ: </span>
          <span>
            {doc.priority === 'URGENT'
              ? '🚨 ດ່ວນທີ່ສຸດ (URGENT)'
              : doc.priority === 'HIGH'
              ? '🟠 ສູງ (HIGH)'
              : doc.priority === 'LOW'
              ? '🟢 ຕ່ຳ (LOW)'
              : '🔵 ປານກາງ (MEDIUM)'}
          </span>
        </div>
        {doc.referenceNumber && (
          <div className="col-span-2">
            <span className="font-bold">ອີງຕາມ: </span>
            <span>ໜັງສືເລກທີ {doc.referenceNumber}, ລົງວັນທີ {doc.referenceDate || '-'}</span>
          </div>
        )}
      </div>

      {/* Official Body Content */}
      <div className="mb-6 space-y-3 text-xs leading-relaxed text-justify indent-6">
        <p>
          {isIncoming
            ? `ຫ້ອງການຂໍແຈ້ງມາຍັງທ່ານຊາບກ່ຽວກັບ ${doc.subject} ຕາມທີ່ໄດ້ລະບຸໄວ້ໃນເອກະສານທາງການສະບັບນີ້ ເພື່ອໃຫ້ພາກສ່ວນກ່ຽວຂ້ອງໄດ້ຄົ້ນຄວ້າ, ປະກອບຄຳເຫັນ ແລະ ຈັດຕັ້ງປະຕິບັດຕາມແຜນການຂອງລັດວິສາຫະກິດ.`
            : `ອີງຕາມແຜນຍຸດທະສາດການພັດທະນາດິຈິທັລ ແລະ ຄວາມຕ້ອງການຕົວຈິງຂອງວຽກງານ, ພະແນກ ຂໍຮຽນສະເໜີມາຍັງ ຄະນະຜູ້ອຳນວຍການໃຫຍ່ ເພື່ອພິຈາລະນາອະນຸມັດ ແລະ ໃຫ້ທິດຊີ້ນຳຕາມລະບຽບການ.`}
        </p>
        <p>
          ດັ່ງນັ້ນ, ຈຶ່ງຮຽນສະເໜີມາຍັງທ່ານ ເພື່ອຊາບ ແລະ ພິຈາລະນາໃຫ້ທິດຊີ້ນຳຕາມຄວາມເໝາະສົມດ້ວຍ.
        </p>
      </div>

      {/* Official Recorded Sign-off Comments and Directives */}
      {allDocumentComments.length > 0 && (
        <div className="mb-6 border border-slate-400 rounded-lg p-3 bg-amber-50/20">
          <div className="text-xs font-bold text-slate-900 uppercase mb-2 border-b border-slate-300 pb-1">
            ທິດຊີ້ນຳ ແລະ ຄຳເຫັນທີ່ບັນທຶກໄວ້ (RECORDED DIRECTIVES & SIGN-OFF COMMENTS):
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600">
                <th className="py-1 px-2 w-10">ລ/ດ</th>
                <th className="py-1 px-2 w-48">ຜູ້ໃຫ້ຄຳເຫັນ</th>
                <th className="py-1 px-2 w-32">ວັນທີ-ເວລາ</th>
                <th className="py-1 px-2">ເນື້ອໃນທິດຊີ້ນຳ / ຄຳເຫັນ</th>
              </tr>
            </thead>
            <tbody>
              {allDocumentComments.map((cmt, idx) => (
                <tr key={cmt.id} className="border-b border-slate-200">
                  <td className="py-1.5 px-2 font-mono">{idx + 1}</td>
                  <td className="py-1.5 px-2 font-bold">
                    {cmt.authorName}
                    <div className="text-[10px] text-slate-500 font-normal">{cmt.authorPosition}</div>
                  </td>
                  <td className="py-1.5 px-2 text-[10px] text-slate-600 font-mono">
                    {cmt.timestamp ? new Date(cmt.timestamp).toLocaleString('lo-LA') : '-'}
                  </td>
                  <td className="py-1.5 px-2 italic text-slate-800">
                    "{cmt.text}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Verified Digital Signatures & Stamps */}
      <div className="mb-6 pt-3 border-t border-slate-300">
        <div className="text-xs font-bold text-slate-900 uppercase mb-3 text-center">
          ລາຍເຊັນດິຈິທັລທີ່ໄດ້ຮັບຮອງ (VERIFIED DIGITAL SIGNATURES & STAMPS)
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {doc.signatures.length > 0 ? (
            doc.signatures.map((sig, idx) => (
              <div key={sig.id} className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/40">
                <div className="text-[10px] font-bold text-indigo-900 uppercase mb-1">
                  ເຊັນຄັ້ງທີ {idx + 1}
                </div>
                <div className="h-16 flex items-center justify-center my-1 bg-white border border-slate-200 rounded p-1">
                  {sig.signatureImage ? (
                    <img src={sig.signatureImage} alt={sig.signerName} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="font-serif italic font-bold text-blue-900 text-sm">{sig.signerName}</span>
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900">{sig.signerName}</div>
                <div className="text-[10px] text-slate-600 leading-tight mt-0.5">{sig.positionLao}</div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">
                  ລະຫັດ: {sig.verificationCode}
                </div>
                <div className="text-[9px] text-slate-400">
                  {new Date(sig.signedAt).toLocaleDateString('lo-LA')}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-slate-400 text-xs italic">
              ຍັງບໍ່ມີລາຍເຊັນດິຈິທັລ (ກຳລັງລໍຖ້າການລົງລາຍເຊັນ)
            </div>
          )}
        </div>
      </div>

      {/* Document Verification QR Code & Official Seal Block */}
      <div className="mt-8 pt-4 border-t-2 border-slate-900 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-1.5 bg-white border-2 border-slate-900 rounded-lg shrink-0">
            <QRCodeGenerator
              text={docVerificationUrl}
              size={100}
              showCenterLogo={true}
            />
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
              QR CODE ກວດສອບຄວາມແທ້ຈິງ (DOCUMENT AUTHENTICITY VERIFICATION)
            </div>
            <div className="font-mono text-xs font-bold text-slate-700 mt-0.5">
              DOC ID: {doc.id}
            </div>
            <div className="text-[10px] text-slate-600 mt-1 leading-relaxed max-w-md">
              Scan QR Code ເພື່ອກວດສອບຄວາມຖືກຕ້ອງແທ້ຈິງ 100% ຜ່ານລິ້ງກວດສອບສາທາລະນະ (Public Verification Route):<br />
              <span className="font-mono text-[9px] text-slate-500 break-all">{docVerificationUrl}</span>
            </div>
          </div>
        </div>

        <div className="text-right border-l border-slate-300 pl-4 shrink-0 text-xs">
          <div className="font-bold text-slate-900">ລະບົບສາລະບັນດິຈິທັລ</div>
          <div className="text-[10px] text-slate-600">ລັດວິສາຫະກິດຖືຮຸ້ນລາວ</div>
          <div className="text-[9px] text-slate-400 mt-1">
            ວັນທີພິມ/ສົ່ງອອກ: {new Date().toLocaleDateString('lo-LA')} {new Date().toLocaleTimeString('lo-LA')}
          </div>
          <div className="text-[9px] font-mono text-slate-400">
            HASH: SHA256-{doc.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
