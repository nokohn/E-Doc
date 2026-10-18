import React, { ReactNode } from 'react';
import { User, UserRole, DocumentRecord, WorkflowStepInstance } from '../types';

export const ROLE_HIERARCHY: Record<UserRole, { level: number; labelLao: string; labelEn: string; color: string }> = {
  ADMIN: { level: 100, labelLao: 'ຜູ້ຄຸ້ມຄອງລະບົບ (Admin)', labelEn: 'Administrator', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  DIRECTOR: { level: 90, labelLao: 'ຜູ້ອຳນວຍການ (Director)', labelEn: 'Director', color: 'bg-red-100 text-red-800 border-red-300' },
  DEPUTY_DIRECTOR: { level: 80, labelLao: 'ຮອງຜູ້ອຳນວຍການ (Deputy Director)', labelEn: 'Deputy Director', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  DEPARTMENT_HEAD: { level: 70, labelLao: 'ຫົວໜ້າພະແນກ (Department Head)', labelEn: 'Department Head', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  DEPUTY_DEPARTMENT_HEAD: { level: 60, labelLao: 'ຮອງຫົວໜ້າພະແນກ (Deputy Dept Head)', labelEn: 'Deputy Dept Head', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  UNIT_HEAD: { level: 50, labelLao: 'ຫົວໜ້າໜ່ວຍງານ (Unit Head)', labelEn: 'Unit Head', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  STAFF: { level: 20, labelLao: 'ພະນັກງານ (Staff)', labelEn: 'Staff', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
};

export type WorkflowActionType =
  | 'SIGN'
  | 'APPROVE'
  | 'FORWARD'
  | 'RETURN'
  | 'REJECT'
  | 'COMMENT'
  | 'STAFF_VERIFY'
  | 'ATTACH_FINAL'
  | 'ARCHIVE'
  | 'SEND_OUT';

export interface AuthorizationCheckResult {
  allowed: boolean;
  code: 'AUTHORIZED' | 'ROLE_MISMATCH' | 'STEP_NOT_CURRENT' | 'DOCUMENT_COMPLETED' | 'UNAUTHENTICATED';
  messageLao: string;
  messageEn: string;
  requiredRole?: UserRole;
  requiredRoleLao?: string;
  currentStep?: WorkflowStepInstance;
}

/**
 * Core Policy Engine: Evaluates if a user can execute a specific action on a document's current workflow step
 */
export function checkWorkflowStepAuthorization(
  user: User | null,
  document: DocumentRecord | null,
  action: WorkflowActionType
): AuthorizationCheckResult {
  if (!user) {
    return {
      allowed: false,
      code: 'UNAUTHENTICATED',
      messageLao: 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນດຳເນີນການ',
      messageEn: 'Authentication required',
    };
  }

  if (!document) {
    return {
      allowed: false,
      code: 'STEP_NOT_CURRENT',
      messageLao: 'ບໍ່ພົບຂໍ້ມູນເອກະສານ',
      messageEn: 'Document not found',
    };
  }

  // Completed or Archived documents cannot have workflow state modified
  if (document.status === 'COMPLETED' || document.status === 'ARCHIVED') {
    return {
      allowed: false,
      code: 'DOCUMENT_COMPLETED',
      messageLao: 'ເອກະສານນີ້ສຳເລັດຂະບວນການແລ້ວ ບໍ່ສາມາດແກ້ໄຂ ຫຼື ດຳເນີນການເພີ່ມເຕີມ',
      messageEn: 'Document workflow has already completed',
    };
  }

  const currentStep = document.workflowSteps.find(s => s.stepOrder === document.currentStepOrder);

  if (!currentStep) {
    return {
      allowed: false,
      code: 'STEP_NOT_CURRENT',
      messageLao: 'ບໍ່ພົບຂັ້ນຕອນປັດຈຸບັນຂອງເອກະສານ',
      messageEn: 'Current step not found',
    };
  }

  const requiredRole = currentStep.requiredRole;
  const requiredRoleLao = ROLE_HIERARCHY[requiredRole]?.labelLao || requiredRole;

  // System Administrator bypass for emergency override/audit
  if (user.role === 'ADMIN') {
    return {
      allowed: true,
      code: 'AUTHORIZED',
      messageLao: 'ອະນຸຍາດ (ສິດທິຜູ້ຄຸ້ມຄອງລະບົບ ADMIN)',
      messageEn: 'Authorized (Admin override)',
      requiredRole,
      requiredRoleLao,
      currentStep,
    };
  }

  // Strict RBAC: User role must match the step's designated role
  if (user.role !== requiredRole) {
    return {
      allowed: false,
      code: 'ROLE_MISMATCH',
      messageLao: `ສະເພາະຕຳແໜ່ງ "${requiredRoleLao}" ເທົ່ານັ້ນທີ່ມີສິດດຳເນີນການໃນຂັ້ນຕອນນີ້ (ທ່ານແມ່ນ: ${user.positionLao || user.role})`,
      messageEn: `Only ${requiredRole} can perform actions at this step. Your role is ${user.role}.`,
      requiredRole,
      requiredRoleLao,
      currentStep,
    };
  }

  // Specific Action Validation rules per step:
  if (action === 'SIGN') {
    // Only steps requiring signature can be signed
    const requiresSignature = currentStep.stepNameLao.includes('E-Signature') || 
                              currentStep.stepNameLao.includes('ເຊັນ') || 
                              ['DIRECTOR', 'DEPUTY_DIRECTOR', 'DEPARTMENT_HEAD', 'DEPUTY_DEPARTMENT_HEAD', 'UNIT_HEAD'].includes(requiredRole);
    if (!requiresSignature) {
      return {
        allowed: false,
        code: 'STEP_NOT_CURRENT',
        messageLao: 'ຂັ້ນຕອນນີ້ບໍ່ໄດ້ກຳນົດໃຫ້ມີການລົງລາຍເຊັນ E-Signature',
        messageEn: 'This step does not require an E-Signature',
        requiredRole,
        requiredRoleLao,
        currentStep,
      };
    }
  }

  if (action === 'ARCHIVE' && document.direction === 'INCOMING' && currentStep.stepOrder < 5) {
    return {
      allowed: false,
      code: 'STEP_NOT_CURRENT',
      messageLao: 'ຕ້ອງຜ່ານຂັ້ນຕອນການໃຫ້ທິດຊີ້ນຳ ແລະ ມອບໝາຍໃຫ້ຄົບຖ້ວນກ່ອນ E-Storage',
      messageEn: 'Workflow must proceed sequentially before archiving',
      requiredRole,
      requiredRoleLao,
      currentStep,
    };
  }

  return {
    allowed: true,
    code: 'AUTHORIZED',
    messageLao: 'ທ່ານມີສິດດຳເນີນການໃນຂັ້ນຕອນນີ້',
    messageEn: 'Action authorized',
    requiredRole,
    requiredRoleLao,
    currentStep,
  };
}

/**
 * Interceptor for API calls / state transitions.
 * Wraps any state-mutating function and halts unauthorized execution while triggering alerts.
 */
export async function interceptWorkflowAction<T>(
  user: User | null,
  document: DocumentRecord | null,
  action: WorkflowActionType,
  executeAction: () => Promise<T> | T,
  onUnauthorized?: (result: AuthorizationCheckResult) => void
): Promise<{ success: boolean; result?: T; error?: AuthorizationCheckResult }> {
  const auth = checkWorkflowStepAuthorization(user, document, action);

  if (!auth.allowed) {
    if (onUnauthorized) {
      onUnauthorized(auth);
    }
    return { success: false, error: auth };
  }

  try {
    const res = await executeAction();
    return { success: true, result: res };
  } catch (err) {
    throw err;
  }
}

/**
 * Hook providing reactive permissions for the current user and document
 */
export function useAuthorization(user: User | null, document: DocumentRecord | null) {
  const currentStep = document?.workflowSteps.find(s => s.stepOrder === document.currentStepOrder);
  const requiredRole = currentStep?.requiredRole;
  const requiredRoleLao = requiredRole ? ROLE_HIERARCHY[requiredRole]?.labelLao : '';

  const canSignAuth = checkWorkflowStepAuthorization(user, document, 'SIGN');
  const canApproveAuth = checkWorkflowStepAuthorization(user, document, 'APPROVE');
  const canForwardAuth = checkWorkflowStepAuthorization(user, document, 'FORWARD');
  const canReturnAuth = checkWorkflowStepAuthorization(user, document, 'RETURN');
  const canAttachAuth = checkWorkflowStepAuthorization(user, document, 'ATTACH_FINAL');
  const canStaffVerifyAuth = checkWorkflowStepAuthorization(user, document, 'STAFF_VERIFY');
  const canArchiveAuth = checkWorkflowStepAuthorization(user, document, 'ARCHIVE');
  const canSendOutAuth = checkWorkflowStepAuthorization(user, document, 'SEND_OUT');

  const isRoleMatching = user && (user.role === 'ADMIN' || user.role === requiredRole);
  const isDocumentCompleted = document?.status === 'COMPLETED' || document?.status === 'ARCHIVED';

  return {
    isRoleMatching: !!isRoleMatching,
    isDocumentCompleted,
    currentStep,
    requiredRole,
    requiredRoleLao,
    canSign: canSignAuth.allowed,
    canApprove: canApproveAuth.allowed,
    canForward: canForwardAuth.allowed,
    canReturn: canReturnAuth.allowed,
    canAttach: canAttachAuth.allowed,
    canStaffVerify: canStaffVerifyAuth.allowed,
    canArchive: canArchiveAuth.allowed,
    canSendOut: canSendOutAuth.allowed,
    checkAction: (action: WorkflowActionType) => checkWorkflowStepAuthorization(user, document, action),
  };
}

/**
 * Centralized Component Wrapper:
 * Intercepts UI component rendering based on workflow step authorization.
 * If unauthorized, either renders nothing, a custom fallback, or a disabled lock state with Lao tooltip.
 */
interface WorkflowActionGuardProps {
  user: User | null;
  document: DocumentRecord | null;
  action: WorkflowActionType;
  children: ReactNode;
  fallback?: ReactNode;
  showDisabledLock?: boolean;
  disabledTooltip?: string;
  className?: string;
}

export const WorkflowActionGuard: React.FC<WorkflowActionGuardProps> = ({
  user,
  document,
  action,
  children,
  fallback = null,
  showDisabledLock = false,
  disabledTooltip,
  className = '',
}) => {
  const auth = checkWorkflowStepAuthorization(user, document, action);

  if (auth.allowed) {
    return <>{children}</>;
  }

  if (showDisabledLock) {
    const tooltipText = disabledTooltip || auth.messageLao;
    return (
      <div className={`relative inline-block group cursor-not-allowed ${className}`}>
        <div className="opacity-50 pointer-events-none select-none filter grayscale">
          {children}
        </div>
        <div className="hidden group-hover:flex absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap items-center gap-1.5 pointer-events-none border border-slate-700 animate-in fade-in duration-150">
          <span className="text-amber-400">🔒</span>
          <span>{tooltipText}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    );
  }

  return <>{fallback}</>;
};

/**
 * Role-Based Access Guard for static routes or administrative actions
 */
interface RequireRoleProps {
  user: User | null;
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  user,
  roles,
  children,
  fallback = null,
}) => {
  if (!user) return <>{fallback}</>;
  if (user.role === 'ADMIN' || roles.includes(user.role)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};
