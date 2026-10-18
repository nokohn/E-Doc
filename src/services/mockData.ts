import { DocumentRecord, WorkflowStepInstance, EStorageFolder, NotificationItem, AuditLogItem } from '../types';

export const INITIAL_FOLDERS: EStorageFolder[] = [
  {
    id: 'folder-2026-in',
    nameLao: 'ເອກະສານຂາເຂົ້າ ປະຈຳປີ 2026',
    year: 2026,
    departmentId: 'dept-admin',
    departmentName: 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ',
    direction: 'INCOMING',
    documentCount: 142,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'folder-2026-out',
    nameLao: 'ເອກະສານຂາອອກ ປະຈຳປີ 2026',
    year: 2026,
    departmentId: 'dept-admin',
    departmentName: 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ',
    direction: 'OUTGOING',
    documentCount: 98,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'folder-2026-legal',
    nameLao: 'ເອກະສານນິຕິກຳ ແລະ ສັນຍາ 2026',
    year: 2026,
    departmentId: 'dept-legal',
    departmentName: 'ພະແນກ ກົດໝາຍ ແລະ ນິຕິກຳ',
    direction: 'ALL',
    documentCount: 45,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'folder-2025-archive',
    nameLao: 'ຄັງເກັບມ້ຽນເອກະສານເກົ່າ ປີ 2025',
    year: 2025,
    departmentId: 'dept-admin',
    departmentName: 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ',
    direction: 'ALL',
    documentCount: 512,
    createdAt: '2025-01-01T08:00:00Z',
  },
];

export function createIncomingWorkflowSteps(): WorkflowStepInstance[] {
  return [
    {
      stepOrder: 1,
      stepNameLao: 'ຮັບ ແລະ ລົງທະບຽນເອກະສານ',
      stepNameEn: 'Receive & Register Document',
      requiredRole: 'STAFF',
      status: 'COMPLETED',
      assignedUserName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ (Staff)',
      completedAt: '2026-10-06T08:30:00Z',
      completedByUserName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
      completedByPosition: 'ວິຊາການສາລະບັນ',
      actionTaken: 'FORWARD',
      comment: 'ກວດສອບເອກະສານຄົບຖ້ວນ, ລົງເລກທີຂາເຂົ້າ ແລະ ສະເໜີຫົວໜ້າພະແນກຊາບ',
    },
    {
      stepOrder: 2,
      stepNameLao: 'ເຊັນຄັ້ງທີ 1: ກວດສອບ & ໃຫ້ທິດຊີ້ນຳ ຫົວໜ້າພະແນກ (Department Head) + E-Signature',
      stepNameEn: '1st Signature: Dept Head Inspection & Instruction + E-Signature',
      requiredRole: 'DEPARTMENT_HEAD',
      status: 'CURRENT',
      assignedUserName: 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ (ຫົວໜ້າພະແນກ)',
    },
    {
      stepOrder: 3,
      stepNameLao: 'ເຊັນຄັ້ງທີ 2: ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ ໃຫ້ທິດຊີ້ນຳ + E-Signature',
      stepNameEn: '2nd Signature: Deputy Dept Head Instruction & E-Signature',
      requiredRole: 'DEPUTY_DEPARTMENT_HEAD',
      status: 'PENDING',
      assignedUserName: 'ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ (ຮອງພະແນກ ວິສະວະກຳ) / ທ່ານ ສອນປະສິດ (ຮອງພະແນກ R&D)',
    },
    {
      stepOrder: 4,
      stepNameLao: 'ເຊັນຄັ້ງທີ 3: ຫົວໜ້າໜ່ວຍງານ ໃຫ້ຄຳເຫັນ + E-Signature',
      stepNameEn: '3rd Signature: Unit Head Comment & E-Signature',
      requiredRole: 'UNIT_HEAD',
      status: 'PENDING',
      assignedUserName: 'ທ່ານ ວຽງຄຳມະໂນຈິດ (ວິສະວະກຳ) / ທ່ານ ຄຳແກ້ວ ພິມວົງສາ (ປະສານງານ) / ທ່ານ ມະໂນລົບ (R&D)',
    },
    {
      stepOrder: 5,
      stepNameLao: 'ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ',
      stepNameEn: 'Staff Verification Certificate',
      requiredRole: 'STAFF',
      status: 'PENDING',
      assignedUserName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ (Staff)',
    },
    {
      stepOrder: 6,
      stepNameLao: 'E-Storage Archive & ສຳເລັດ',
      stepNameEn: 'Archive to E-Storage & Completed',
      requiredRole: 'STAFF',
      status: 'PENDING',
      assignedUserName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ (Staff)',
    },
  ];
}

export function createOutgoingWorkflowSteps(): WorkflowStepInstance[] {
  return [
    {
      stepOrder: 1,
      stepNameLao: 'ພະນັກງານສ້າງເອກະສານ',
      stepNameEn: 'Staff Creates Document',
      requiredRole: 'STAFF',
      status: 'COMPLETED',
      assignedUserName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ (Staff)',
      completedAt: '2026-10-06T09:00:00Z',
      completedByUserName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
      completedByPosition: 'ວິຊາການສາລະບັນ',
      actionTaken: 'FORWARD',
      comment: 'ຮ່າງເອກະສານແລ້ວ ສົ່ງຕໍ່ຫົວໜ້າໜ່ວຍງານກວດກາ',
    },
    {
      stepOrder: 2,
      stepNameLao: 'ຫົວໜ້າໜ່ວຍງານ ໃຫ້ທິດຊີ້ນຳ + E-Signature',
      stepNameEn: 'Unit Head Instruction & E-Signature',
      requiredRole: 'UNIT_HEAD',
      status: 'CURRENT',
      assignedUserName: 'ທ່ານ ວຽງຄຳມະໂນຈິດ / ທ່ານ ຄຳແກ້ວ ພິມວົງສາ / ທ່ານ ມະໂນລົບ',
    },
    {
      stepOrder: 3,
      stepNameLao: 'ຮອງຫົວໜ້າພະແນກ ໃຫ້ທິດຊີ້ນຳ + E-Signature',
      stepNameEn: 'Deputy Dept Head Instruction & E-Signature',
      requiredRole: 'DEPUTY_DEPARTMENT_HEAD',
      status: 'PENDING',
      assignedUserName: 'ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ / ທ່ານ ສອນປະສິດ',
    },
    {
      stepOrder: 4,
      stepNameLao: 'ຫົວໜ້າພະແນກ ໃຫ້ທິດຊີ້ນຳ + E-Signature',
      stepNameEn: 'Department Head Instruction & E-Signature',
      requiredRole: 'DEPARTMENT_HEAD',
      status: 'PENDING',
      assignedUserName: 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ (ຫົວໜ້າພະແນກ)',
    },
    {
      stepOrder: 5,
      stepNameLao: 'ຮອງຜູ້ອຳນວຍການ ໃຫ້ທິດຊີ້ນຳ + E-Signature',
      stepNameEn: 'Deputy Director Instruction & E-Signature',
      requiredRole: 'DEPUTY_DIRECTOR',
      status: 'PENDING',
      assignedUserName: 'ທ່ານ ສຸລິຍາ ດວງມາລາ (Deputy Director)',
    },
    {
      stepOrder: 6,
      stepNameLao: 'ຜູ້ອຳນວຍການ ໃຫ້ທິດຊີ້ນຳ + E-Signature',
      stepNameEn: 'Director Instruction & E-Signature',
      requiredRole: 'DIRECTOR',
      status: 'PENDING',
      assignedUserName: 'ທ່ານ ບຸນມີ ວົງວິຈິດ (Director)',
    },
    {
      stepOrder: 7,
      stepNameLao: 'ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ',
      stepNameEn: 'Staff Verification Certificate',
      requiredRole: 'STAFF',
      status: 'PENDING',
      assignedUserName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ (Staff)',
    },
    {
      stepOrder: 8,
      stepNameLao: 'E-Storage Archive & ສຳເລັດ',
      stepNameEn: 'Archive to E-Storage & Completed',
      requiredRole: 'STAFF',
      status: 'PENDING',
      assignedUserName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ (Staff)',
    },
  ];
}

export const INITIAL_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc-in-001',
    direction: 'INCOMING',
    documentNumber: 'ລຮລ/0245',
    referenceNumber: 'ກຊ.ກງ/1052',
    referenceDate: '2026-10-04',
    documentDate: '2026-10-05',
    receivedDate: '2026-10-06',
    subject: 'ແຈ້ງການ: ການສະຫຼຸບລາຍຮັບ-ລາຍຈ່າຍ ແລະ ແຜນງົບປະມານປະຈຳໄຕມາດ 4 ປີ 2026',
    category: 'ແຈ້ງການລັດຖະການ',
    documentType: 'ແຈ້ງການ',
    priority: 'URGENT',
    purpose: 'RESEARCH',
    purposeNote: 'ເພື່ອຄົ້ນຄວ້າ ແລະ ລາຍງານຄະນະຜູ້ອຳນວຍການ',
    departmentId: 'dept-admin',
    departmentName: 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ',
    sender: 'ກະຊວງການເງິນ (ຫ້ອງການກະຊວງ)',
    recipient: 'ລັດວິສາຫະກິດຖືຮຸ້ນລາວ',
    status: 'IN_PROGRESS',
    currentStepOrder: 2,
    workflowSteps: createIncomingWorkflowSteps(),
    attachments: [
      {
        id: 'att-1',
        fileName: 'ແຈ້ງການ_ກະຊວງການເງິນ_1052.pdf',
        fileSize: 1450000,
        fileType: 'application/pdf',
        uploadDate: '2026-10-06T08:30:00Z',
        uploadedBy: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
        url: '#',
      },
      {
        id: 'att-2',
        fileName: 'ຕາຕະລາງແຜນງົບປະມານ_Q4.xlsx',
        fileSize: 520000,
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadDate: '2026-10-06T08:31:00Z',
        uploadedBy: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
        url: '#',
      },
    ],
    signatures: [],
    createdBy: 'usr-staff',
    createdByName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
    createdAt: '2026-10-06T08:30:00Z',
    updatedAt: '2026-10-06T08:35:00Z',
  },
  {
    id: 'doc-in-002',
    direction: 'INCOMING',
    documentNumber: 'ລຮລ/0246',
    referenceNumber: 'ຫນ.ຄຊ/302',
    referenceDate: '2026-10-05',
    documentDate: '2026-10-06',
    receivedDate: '2026-10-06',
    subject: 'ໜັງສືສະເໜີ: ຂໍອະນຸມັດເຂົ້າຮ່ວມກອງປະຊຸມສຳມະນາວິຊາການ ພະລັງງານສະອາດ ອາຊຽນ 2026',
    category: 'ໜັງສືສະເໜີ',
    documentType: 'ໜັງສືສະເໜີ',
    priority: 'NORMAL',
    purpose: 'INFORM',
    purposeNote: 'ເພື່ອຮັບຊາບ ແລະ ມອບໝາຍຜູ້ຕາງໜ້າ',
    departmentId: 'dept-admin',
    departmentName: 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ',
    sender: 'ສະມາຄົມວິສະວະກຳພະລັງງານແຫ່ງຊາດ',
    recipient: 'ຄະນະຜູ້ອຳນວຍການ',
    status: 'IN_PROGRESS',
    currentStepOrder: 3,
    workflowSteps: (() => {
      const steps = createIncomingWorkflowSteps();
      steps[1].status = 'COMPLETED';
      steps[1].completedAt = '2026-10-06T10:00:00Z';
      steps[1].completedByUserName = 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ';
      steps[1].completedByPosition = 'ຫົວໜ້າພະແນກ';
      steps[1].actionTaken = 'SIGN';
      steps[1].instruction = 'ເຫັນດີຕາມສະເໜີ. ມອບໃຫ້ຮອງຫົວໜ້າພະແນກ ຊີ້ນຳໜ່ວຍງານກ່ຽວຂ້ອງຄັດເລືອກບຸກຄະລາກອນເຂົ້າຮ່ວມ 2 ທ່ານ.';
      steps[2].status = 'CURRENT';
      return steps;
    })(),
    attachments: [
      {
        id: 'att-3',
        fileName: 'ໜັງສືເຊີນ_ກອງປະຊຸມພະລັງງານ_ASEAN2026.pdf',
        fileSize: 890000,
        fileType: 'application/pdf',
        uploadDate: '2026-10-06T09:15:00Z',
        uploadedBy: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
        url: '#',
      },
    ],
    signatures: [
      {
        id: 'sig-001',
        documentId: 'doc-in-002',
        signerId: 'usr-dept-head',
        signerName: 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ',
        positionLao: 'ຫົວໜ້າພະແນກ ວິສະວະກຳ ແລະ ພັດທະນາ',
        signedAt: '2026-10-06T10:00:00Z',
        signatureImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M 10 30 Q 50 5 90 35 T 150 20" fill="none" stroke="%231e3a8a" stroke-width="3"/></svg>',
        verificationCode: 'LA-SIG-784920',
        ipAddress: '192.168.1.45',
      },
    ],
    createdBy: 'usr-staff',
    createdByName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
    createdAt: '2026-10-06T09:15:00Z',
    updatedAt: '2026-10-06T10:00:00Z',
  },
  {
    id: 'doc-in-003',
    direction: 'INCOMING',
    documentNumber: 'ລຮລ/0247',
    referenceNumber: 'ຫນ.ພລ/415',
    referenceDate: '2026-10-05',
    documentDate: '2026-10-06',
    receivedDate: '2026-10-06',
    subject: 'ແຈ້ງການ: ການກວດກາມາດຕະຖານຄວາມປອດໄພລະບົບເຄືອຂ່າຍພະລັງງານໄຟຟ້າແຫ່ງຊາດ ປະຈຳປີ 2026',
    category: 'ແຈ້ງການລັດຖະການ',
    documentType: 'ແຈ້ງການ',
    priority: 'URGENT',
    purpose: 'RESEARCH',
    purposeNote: 'ເພື່ອຄົ້ນຄວ້າ ແລະ ຈັດຕັ້ງປະຕິບັດຕາມມາດຕະຖານ',
    departmentId: 'dept-admin',
    departmentName: 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ',
    sender: 'ກະຊວງພະລັງງານ ແລະ ບໍ່ແຮ່',
    recipient: 'ລັດວິສາຫະກິດຖືຮຸ້ນລາວ',
    status: 'IN_PROGRESS',
    currentStepOrder: 5,
    workflowSteps: (() => {
      const steps = createIncomingWorkflowSteps();
      // Step 2: ຫົວໜ້າພະແນກ
      steps[1].status = 'COMPLETED';
      steps[1].completedAt = '2026-10-06T10:30:00Z';
      steps[1].completedByUserId = 'usr-dept-head';
      steps[1].completedByUserName = 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ';
      steps[1].completedByPosition = 'ຫົວໜ້າພະແນກ (Department Head)';
      steps[1].actionTaken = 'SIGN';
      steps[1].instruction = 'ເຫັນດີຕາມສະເໜີ. ມອບໃຫ້ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ ແລະ ໜ່ວຍງານວິສະວະກຳກວດກາລະອຽດ.';
      // Step 3: ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ
      steps[2].status = 'COMPLETED';
      steps[2].completedAt = '2026-10-06T11:15:00Z';
      steps[2].completedByUserId = 'usr-deputy-dept-head-eng';
      steps[2].completedByUserName = 'ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ';
      steps[2].completedByPosition = 'ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານວິສະວະກຳ';
      steps[2].actionTaken = 'SIGN';
      steps[2].instruction = 'ມອບໃຫ້ໜ່ວຍງານວິສະວະກຳສົມທົບຈັດຕັ້ງປະຕິບັດຕາມແຜນການ.';
      // Step 4: ຫົວໜ້າໜ່ວຍງານ
      steps[3].status = 'COMPLETED';
      steps[3].completedAt = '2026-10-06T13:45:00Z';
      steps[3].completedByUserId = 'usr-unit-eng';
      steps[3].completedByUserName = 'ທ່ານ ວຽງຄຳມະໂນຈິດ';
      steps[3].completedByPosition = 'ຫົວໜ້າໜ່ວຍງານວິສະວະກຳ (Engineering Unit Head)';
      steps[3].actionTaken = 'SIGN';
      steps[3].comment = 'ໜ່ວຍງານໄດ້ກວດກາ ແລະ ພ້ອມຈັດຕັ້ງປະຕິບັດ, ສົ່ງຕໍ່ໃຫ້ພະນັກງານອອກໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງ.';
      // Step 5: ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ (ກຳລັງດຳເນີນການ)
      steps[4].status = 'CURRENT';
      return steps;
    })(),
    attachments: [
      {
        id: 'att-5',
        fileName: 'ແຈ້ງການ_ກະຊວງພະລັງງານ_ມາດຕະຖານຄວາມປອດໄພ.pdf',
        fileSize: 1720000,
        fileType: 'application/pdf',
        uploadDate: '2026-10-06T09:00:00Z',
        uploadedBy: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
        url: '#',
      },
    ],
    signatures: [
      {
        id: 'sig-003',
        documentId: 'doc-in-003',
        signerId: 'usr-dept-head',
        signerName: 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ',
        positionLao: 'ຫົວໜ້າພະແນກ (Department Head)',
        signedAt: '2026-10-06T10:30:00Z',
        signatureImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M 15 35 Q 55 10 95 38 T 145 22" fill="none" stroke="%231e3a8a" stroke-width="3"/></svg>',
        verificationCode: 'LA-SIG-849102',
        ipAddress: '192.168.1.45',
      },
      {
        id: 'sig-004',
        documentId: 'doc-in-003',
        signerId: 'usr-deputy-dept-head-eng',
        signerName: 'ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ',
        positionLao: 'ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານວິສະວະກຳ',
        signedAt: '2026-10-06T11:15:00Z',
        signatureImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M 12 28 Q 50 48 90 20 T 150 32" fill="none" stroke="%23312e81" stroke-width="3"/></svg>',
        verificationCode: 'LA-SIG-623819',
        ipAddress: '192.168.1.48',
      },
      {
        id: 'sig-005',
        documentId: 'doc-in-003',
        signerId: 'usr-unit-eng',
        signerName: 'ທ່ານ ວຽງຄຳມະໂນຈິດ',
        positionLao: 'ຫົວໜ້າໜ່ວຍງານວິສະວະກຳ (Engineering Unit Head)',
        signedAt: '2026-10-06T13:45:00Z',
        signatureImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M 18 32 Q 62 14 100 42 T 148 18" fill="none" stroke="%230f766e" stroke-width="3"/></svg>',
        verificationCode: 'LA-SIG-519284',
        ipAddress: '192.168.1.52',
      },
    ],
    commentsList: [
      {
        id: 'cmt-001',
        documentId: 'doc-in-003',
        userId: 'usr-dept-head',
        userName: 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ',
        userRole: 'DEPARTMENT_HEAD',
        userPosition: 'ຫົວໜ້າພະແນກ (Department Head)',
        comment: 'ເຫັນດີຕາມສະເໜີ. ມອບໃຫ້ຮອງຫົວໜ້າພະແນກຜູ້ຊີ້ນຳ ແລະ ໜ່ວຍງານວິສະວະກຳກວດກາລະອຽດ.',
        createdAt: '2026-10-06T10:30:00Z',
      },
      {
        id: 'cmt-002',
        documentId: 'doc-in-003',
        userId: 'usr-deputy-dept-head-eng',
        userName: 'ທ່ານ ໜຸໄໝ ສຸວັນນະພຸມ',
        userRole: 'DEPUTY_DEPARTMENT_HEAD',
        userPosition: 'ຮອງຫົວໜ້າພະແນກ ຜູ້ຊີ້ນຳໜ່ວຍງານວິສະວະກຳ',
        comment: 'ມອບໃຫ້ໜ່ວຍງານວິສະວະກຳສົມທົບຈັດຕັ້ງປະຕິບັດຕາມແຜນການ.',
        createdAt: '2026-10-06T11:15:00Z',
      },
      {
        id: 'cmt-003',
        documentId: 'doc-in-003',
        userId: 'usr-unit-eng',
        userName: 'ທ່ານ ວຽງຄຳມະໂນຈິດ',
        userRole: 'UNIT_HEAD',
        userPosition: 'ຫົວໜ້າໜ່ວຍງານວິສະວະກຳ (Engineering Unit Head)',
        comment: 'ໜ່ວຍງານໄດ້ກວດກາ ແລະ ພ້ອມຈັດຕັ້ງປະຕິບັດ, ສົ່ງຕໍ່ໃຫ້ພະນັກງານອອກໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງ.',
        createdAt: '2026-10-06T13:45:00Z',
      },
    ],
    createdBy: 'usr-staff',
    createdByName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
    createdAt: '2026-10-06T09:00:00Z',
    updatedAt: '2026-10-06T13:45:00Z',
  },
  {
    id: 'doc-out-001',
    direction: 'OUTGOING',
    documentNumber: 'ລຮລ.ຄກ/089',
    documentDate: '2026-10-06',
    subject: 'ບົດສະເໜີ: ຂໍອະນຸມັດຈັດຊື້ລະບົບ Server ສຳຮອງ ແລະ ອຸປະກອນຄວາມປອດໄພ Cyber Security ປີ 2026',
    category: 'ບົດສະເໜີ',
    documentType: 'ບົດສະເໜີ',
    priority: 'URGENT',
    purpose: 'RESEARCH',
    purposeNote: 'ເພື່ອຄົ້ນຄວ້າ ແລະ ຂໍອະນຸມັດຈັດຕັ້ງປະຕິບັດ',
    departmentId: 'dept-admin',
    departmentName: 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ',
    sender: 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ',
    recipient: 'ຄະນະກຳມະການຄຸ້ມຄອງລັດວິສາຫະກິດ',
    status: 'IN_PROGRESS',
    currentStepOrder: 2,
    workflowSteps: createOutgoingWorkflowSteps(),
    attachments: [
      {
        id: 'att-out-1',
        fileName: 'ບົດສະເໜີ_ຈັດຊື້_Server_CyberSecurity.docx',
        fileSize: 1820000,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadDate: '2026-10-06T09:00:00Z',
        uploadedBy: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
        url: '#',
      },
      {
        id: 'att-out-2',
        fileName: 'ຕາຕະລາງ_BOQ_ລາຄາກາງ_ອຸປະກອນ.xlsx',
        fileSize: 430000,
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadDate: '2026-10-06T09:05:00Z',
        uploadedBy: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
        url: '#',
      },
    ],
    signatures: [],
    createdBy: 'usr-staff',
    createdByName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
    createdAt: '2026-10-06T09:00:00Z',
    updatedAt: '2026-10-06T09:10:00Z',
  },
  {
    id: 'doc-out-002',
    direction: 'OUTGOING',
    documentNumber: 'ລຮລ.ຄກ/088',
    documentDate: '2026-10-05',
    subject: 'ຂໍ້ຕົກລົງ: ວ່າດ້ວຍການແຕ່ງຕັ້ງຄະນະຮັບຜິດຊອບປັບປຸງລະບົບບໍລິຫານເອກະສານແບບດິຈິທັລ',
    category: 'ຂໍ້ຕົກລົງ',
    documentType: 'ຂໍ້ຕົກລົງ',
    priority: 'NORMAL',
    purpose: 'INFORM',
    purposeNote: 'ເພື່ອຈັດຕັ້ງປະຕິບັດທົ່ວອົງກອນ',
    departmentId: 'dept-admin',
    departmentName: 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ',
    sender: 'ຄະນະຜູ້ອຳນວຍການ',
    recipient: 'ທຸກພະແນກການ ແລະ ສາຂາທົ່ວປະເທດ',
    status: 'COMPLETED',
    currentStepOrder: 8,
    workflowSteps: (() => {
      const steps = createOutgoingWorkflowSteps();
      steps.forEach((s) => {
        s.status = 'COMPLETED';
        s.completedAt = '2026-10-05T16:00:00Z';
        s.actionTaken = 'SIGN';
      });
      return steps;
    })(),
    attachments: [
      {
        id: 'att-out-3',
        fileName: 'ຂໍ້ຕົກລົງ_ແຕ່ງຕັ້ງຄະນະຮັບຜິດຊອບ_088.pdf',
        fileSize: 2450000,
        fileType: 'application/pdf',
        uploadDate: '2026-10-05T08:00:00Z',
        uploadedBy: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
        url: '#',
      },
    ],
    signatures: [
      {
        id: 'sig-002',
        documentId: 'doc-out-002',
        signerId: 'usr-dir',
        signerName: 'ທ່ານ ບຸນມີ ວົງວິຈິດ',
        positionLao: 'ຜູ້ອຳນວຍການໃຫຍ່',
        signedAt: '2026-10-05T15:30:00Z',
        signatureImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60"><path d="M 20 40 Q 60 10 100 45 T 150 15" fill="none" stroke="%23047857" stroke-width="3"/></svg>',
        verificationCode: 'LA-SIG-199421',
        ipAddress: '192.168.1.10',
      },
    ],
    createdBy: 'usr-staff',
    createdByName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T16:30:00Z',
    completedAt: '2026-10-05T16:30:00Z',
    eStorageFolderId: 'folder-2026-out',
    eStorageArchivedAt: '2026-10-05T16:30:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'usr-dept-head',
    title: 'ເອກະສານຂາເຂົ້າ ລໍຖ້າທິດຊີ້ນຳ',
    message: 'ເອກະສານເລກທີ ລຮລ/0245 ຈາກ ກະຊວງການເງິນ ລໍຖ້າທິດຊີ້ນຳ ແລະ ລົງລາຍເຊັນ E-Signature ຂອງທ່ານ',
    documentId: 'doc-in-001',
    documentNumber: 'ລຮລ/0245',
    type: 'ACTION_REQUIRED',
    read: false,
    createdAt: '2026-10-06T08:35:00Z',
  },
  {
    id: 'notif-2',
    userId: 'usr-unit-head',
    title: 'ເອກະສານຂາອອກ ລໍຖ້າກວດກາ',
    message: 'ເອກະສານເລກທີ ລຮລ.ຄກ/089 ເລື່ອງ ຂໍອະນຸມັດຈັດຊື້ລະບົບ Server ລໍຖ້າທິດຊີ້ນຳຂອງທ່ານ',
    documentId: 'doc-out-001',
    documentNumber: 'ລຮລ.ຄກ/089',
    type: 'ACTION_REQUIRED',
    read: false,
    createdAt: '2026-10-06T09:10:00Z',
  },
  {
    id: 'notif-3',
    userId: 'usr-staff',
    title: 'ເອກະສານໄດ້ຮັບການອະນຸມັດ ແລະ ສຳເລັດ',
    message: 'ເອກະສານເລກທີ ລຮລ.ຄກ/088 ໄດ້ຮັບການລົງລາຍເຊັນຈາກ ຜູ້ອຳນວຍການໃຫຍ່ ແລະ ບັນທຶກເຂົ້າ E-Storage ແລ້ວ',
    documentId: 'doc-out-002',
    documentNumber: 'ລຮລ.ຄກ/088',
    type: 'COMPLETED',
    read: true,
    createdAt: '2026-10-05T16:30:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-06T08:30:00Z',
    userId: 'usr-staff',
    userName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
    userRole: 'STAFF',
    userPosition: 'ວິຊາການສາລະບັນ',
    action: 'CREATE',
    documentId: 'doc-in-001',
    documentNumber: 'ລຮລ/0245',
    details: 'ລົງທະບຽນເອກະສານຂາເຂົ້າໃໝ່ ເລກທີ ລຮລ/0245 ຈາກ ກະຊວງການເງິນ',
    newValue: 'Status: REGISTERED, Step: 1',
    ipAddress: '192.168.1.25',
    device: 'Windows 11 / Chrome 129',
  },
  {
    id: 'log-002',
    timestamp: '2026-10-06T08:35:00Z',
    userId: 'usr-staff',
    userName: 'ທ່ານ ນາງ ມຸກດາ ແສງອາລຸນ',
    userRole: 'STAFF',
    userPosition: 'ວິຊາການສາລະບັນ',
    action: 'FORWARD',
    documentId: 'doc-in-001',
    documentNumber: 'ລຮລ/0245',
    details: 'ສົ່ງຕໍ່ເອກະສານໄປຫາ ຫົວໜ້າພະແນກ (ຂັ້ນຕອນທີ 2: ທິດຊີ້ນຳ + E-Signature)',
    oldValue: 'Step 1 (Staff)',
    newValue: 'Step 2 (Department Head)',
    ipAddress: '192.168.1.25',
    device: 'Windows 11 / Chrome 129',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-06T10:00:00Z',
    userId: 'usr-dept-head',
    userName: 'ທ່ານ ປັນຍາສິດ ວົງສຸລີ',
    userRole: 'DEPARTMENT_HEAD',
    userPosition: 'ຫົວໜ້າພະແນກ ວິສະວະກຳ ແລະ ພັດທະນາ',
    action: 'SIGN',
    documentId: 'doc-in-002',
    documentNumber: 'ລຮລ/0246',
    details: 'ລົງລາຍເຊັນ E-Signature ແລະ ໃຫ້ທິດຊີ້ນຳ ມອບໝາຍໃຫ້ຮອງຫົວໜ້າພະແນກດຳເນີນການ',
    newValue: 'Verification Code: LA-SIG-784920',
    ipAddress: '192.168.1.45',
    device: 'macOS Sonoma / Safari 18',
  },
];
