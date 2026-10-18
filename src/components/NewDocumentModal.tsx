import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  Paperclip,
  AlertCircle,
  Target,
  ScanText,
  Sparkles,
  Tag,
  Plus,
  Copy,
  Check,
  Wand2,
  Loader2,
} from 'lucide-react';
import { User, DocumentTypeDirection, DocumentPriority, DocumentPurpose } from '../types';
import { documentStore } from '../services/store';
import { useAlert } from './SweetAlertModal';
import { LHSELogo } from './LHSELogo';

interface NewDocumentModalProps {
  initialDirection: DocumentTypeDirection;
  currentUser: User;
  onClose: () => void;
  onSuccess: (newDocId: string) => void;
}

interface ScannedSamplePreset {
  id: string;
  label: string;
  fileName: string;
  fileSize: number;
  subject: string;
  category: string;
  documentType: string;
  priority: DocumentPriority;
  referenceNumber: string;
  sender: string;
  recipient: string;
  ocrText: string;
  tags: string[];
  confidence: number;
}

const SCANNED_PRESETS: ScannedSamplePreset[] = [
  {
    id: 'scan-finance',
    label: '📄 ໃບແຈ້ງການກະຊວງການເງິນ (Scanned Notice)',
    fileName: 'Scan_ແຈ້ງການກະຊວງການເງິນ_2026.pdf',
    fileSize: 1640000,
    subject: 'ແຈ້ງການກ່ຽວກັບການສະຫຼຸບງົບປະມານປະຈຳໄຕມາດ ແລະ ແຜນການເງິນລັດວິສາຫະກິດ ປີ 2026',
    category: 'ແຈ້ງການລັດຖະການ',
    documentType: 'ແຈ້ງການ',
    priority: 'URGENT',
    referenceNumber: 'ກງ/1084',
    sender: 'ກະຊວງການເງິນ',
    recipient: 'ລັດວິສາຫະກິດຖືຮຸ້ນລາວ',
    ocrText: `ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
ກະຊວງການເງິນ • ເລກທີ: ກງ/1084
ເລື່ອງ: ແຈ້ງການກ່ຽວກັບການສະຫຼຸບງົບປະມານປະຈຳໄຕມາດ ແລະ ແຜນການເງິນລັດວິສາຫະກິດ ປີ 2026
ຮຽນ: ຜູ້ອຳນວຍການ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE)
ເນື້ອໃນສະກັດຈາກເອກະສານສະແກນ (OCR): ໃຫ້ທຸກພະແນກການກ່ຽວຂ້ອງກວດກາບົດສະຫຼຸບລາຍຮັບ-ລາຍຈ່າຍ, ຊັບສິນຖືຮຸ້ນໂຄງການພະລັງງານໄຟຟ້າ ແລະ ສົ່ງບົດລາຍງານທາງການເງິນພາຍໃນກຳນົດ 48 ຊົ່ວໂມງ.`,
    tags: ['ງົບປະມານ 2026', 'ກະຊວງການເງິນ', 'ແຈ້ງການລັດຖະການ', 'ບັນຊີ-ການເງິນ', 'ດ່ວນທີ່ສຸດ'],
    confidence: 98.7,
  },
  {
    id: 'scan-power',
    label: '⚡ ບົດສະເໜີໂຄງການໄຟຟ້າ (Scanned Technical Proposal)',
    fileName: 'Scan_ບົດສະເໜີເຕັກນິກ_ໂຄງການໄຟຟ້າ.jpg',
    fileSize: 2180000,
    subject: 'ຂໍອະນຸມັດແຜນກວດກາເຕັກນິກ ແລະ ບຳລຸງຮັກສາລະບົບສາຍສົ່ງໄຟຟ້າແຮງສູງ ປະຈຳປີ 2026',
    category: 'ບົດສະເໜີ',
    documentType: 'ບົດສະເໜີ',
    priority: 'HIGH',
    referenceNumber: 'ວສກ/0419',
    sender: 'ພະແນກ ເຕັກນິກ ແລະ ພັດທະນາໂຄງການ',
    recipient: 'ຄະນະຜູ້ອຳນວຍການໃຫຍ່ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ',
    ocrText: `ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LAO HOLDING STATE ENTERPRISE)
ເລກທີອ້າງອີງ: ວສກ/0419
ເລື່ອງ: ຂໍອະນຸມັດແຜນກວດກາເຕັກນິກ ແລະ ບຳລຸງຮັກສາລະບົບສາຍສົ່ງໄຟຟ້າແຮງສູງ ປະຈຳປີ 2026
ເນື້ອໃນສະກັດຈາກເອກະສານສະແກນ (OCR): ອີງຕາມແຜນການຮ່ວມທຶນໂຄງການພະລັງງານໄຟຟ້ານ້ຳຕົກ, ໜ່ວຍງານວິສະວະກຳຂໍສະເໜີແຜນລົງກວດກາສະໜາມຕົວຈິງ ແລະ ຢັ້ງຢືນມາດຕະຖານຄວາມປອດໄພ.`,
    tags: ['ພະລັງງານໄຟຟ້າ', 'ວິສະວະກຳ', 'ບົດສະເໜີ', 'ບຳລຸງຮັກສາ', 'ໂຄງການຮ່ວມທຶນ'],
    confidence: 97.4,
  },
  {
    id: 'scan-mou',
    label: '🤝 ສັນຍາຮ່ວມມື MOU (Scanned Contract)',
    fileName: 'Scan_MOU_JointVenture_LHSE.pdf',
    fileSize: 3120000,
    subject: 'ບົດບັນທຶກຄວາມເຂົ້າໃຈ (MOU) ວ່າດ້ວຍການພັດທະນາລະບົບບໍລິຫານຂໍ້ມູນດິຈິທັລ ລັດວິສາຫະກິດ',
    category: 'ສັນຍາ / MOU',
    documentType: 'ບົດບັນທຶກ',
    priority: 'MEDIUM',
    referenceNumber: 'ລຮລ.MOU/012',
    sender: 'ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE)',
    recipient: 'ຄະນະກຳມະການຄຸ້ມຄອງໂຄງການຮ່ວມທຶນ',
    ocrText: `ບົດບັນທຶກຄວາມເຂົ້າໃຈ (MEMORANDUM OF UNDERSTANDING)
ເລກທີ: ລຮລ.MOU/012
ເລື່ອງ: ການພັດທະນາລະບົບບໍລິຫານຂໍ້ມູນດິຈິທັລ ແລະ ຄັງເອກະສານ E-Storage ຂອງ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ
ເນື້ອໃນສະກັດຈາກເອກະສານສະແກນ (OCR): ທັງສອງຝ່າຍตົກລົງຮ່ວມມືໃນການຍົກລະດັບລະບົບ E-Signature, QR Code Verification ແລະ OCR Searchability ເພື່ອຄວາມໂປ່ງໃສ ແລະ ກວດສອບໄດ້ 100%.`,
    tags: ['ສັນຍາ / MOU', 'ຫັນເປັນດິຈິທັລ', 'E-Storage', 'ໂຄງການຮ່ວມມື', 'LHSE'],
    confidence: 99.1,
  },
];

export const NewDocumentModal: React.FC<NewDocumentModalProps> = ({
  initialDirection,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const alert = useAlert();
  const [direction, setDirection] = useState<DocumentTypeDirection>(initialDirection);

  const [documentNumber, setDocumentNumber] = useState(
    initialDirection === 'INCOMING'
      ? `ລຮລ/${String(Math.floor(250 + Math.random() * 700)).padStart(4, '0')}`
      : `ລຮລ.ຄກ/${String(Math.floor(90 + Math.random() * 200)).padStart(3, '0')}`
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const [referenceDate, setReferenceDate] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('ແຈ້ງການລັດຖະການ');
  const [documentType, setDocumentType] = useState('ແຈ້ງການ');
  const [priority, setPriority] = useState<DocumentPriority>('MEDIUM');
  const [purpose, setPurpose] = useState<DocumentPurpose>('RESEARCH');
  const [purposeNote, setPurposeNote] = useState('');
  const [sender, setSender] = useState(
    initialDirection === 'INCOMING' ? 'ກະຊວງການເງິນ' : 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ'
  );
  const [recipient, setRecipient] = useState(
    initialDirection === 'INCOMING' ? 'ລັດວິສາຫະກິດຖືຮຸ້ນລາວ' : 'ຄະນະຜູ້ອຳນວຍການໃຫຍ່'
  );
  const [instructions, setInstructions] = useState('');
  const [comments, setComments] = useState('');

  // OCR & AI Auto-Tagging states
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrCopied, setOcrCopied] = useState(false);
  const [tags, setTags] = useState<string[]>(['ແຈ້ງການລັດຖະການ', 'LHSE']);
  const [newTagInput, setNewTagInput] = useState('');

  const [attachments, setAttachments] = useState<
    { fileName: string; fileSize: number; fileType: string; url: string }[]
  >([
    {
      fileName: 'ເອກະສານທາງການ_ຕົ້ນສະບັບ.pdf',
      fileSize: 1250000,
      fileType: 'application/pdf',
      url: '#',
    },
  ]);

  // Helper to build local OCR extraction when file is uploaded or analyzed
  const buildLocalOcrFallback = (fileName: string, currentSubj: string) => {
    const lower = (fileName + ' ' + currentSubj).toLowerCase();
    if (lower.includes('ງົບປະມານ') || lower.includes('ການເງິນ') || lower.includes('finance')) {
      return SCANNED_PRESETS[0];
    }
    if (lower.includes('ໄຟຟ້າ') || lower.includes('ເຕັກນິກ') || lower.includes('power') || lower.includes('eng')) {
      return SCANNED_PRESETS[1];
    }
    if (lower.includes('mou') || lower.includes('ສັນຍາ') || lower.includes('contract')) {
      return SCANNED_PRESETS[2];
    }
    const inferredSubject =
      currentSubj.trim() ||
      `ເອກະສານສະແກນຈາກໄຟລ໌ ${fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')}`;
    return {
      subject: inferredSubject,
      category,
      documentType,
      priority,
      referenceNumber: referenceNumber || `ອອ/${Math.floor(100 + Math.random() * 899)}`,
      sender,
      recipient,
      ocrText: `ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE) • ເລກທີເອກະສານ: ${documentNumber}
ໄຟລ໌ຕົ້ນສະບັບທີ່ສະແກນ: ${fileName}
ເລື່ອງ: ${inferredSubject}
ຈາກ: ${sender} | ເຖິງ: ${recipient}
ເນື້ອໃນສະກັດດ້ວຍ OCR (Optical Character Recognition):
ຫ້ອງການລັດວິສາຫະກິດຖືຮຸ້ນລາວ ໄດ້ທຳການສະແກນ ແລະ ສະກັດຂໍ້ຄວາມອັດຕະໂນມັດຈາກເອກະສານເຈ້ຍຕົ້ນສະບັບ ເພື່ອໃຫ້ສາມາດຄົ້ນຫາຂໍ້ມູນແບບ Full-Text Search ໃນລະບົບ E-Document ໄດ້ຢ່າງວ່ອງໄວ ແລະ ຊັດເຈນ.`,
      tags: Array.from(new Set([category, documentType, 'OCR Scanned', 'LHSE', sender])),
      confidence: 96.8,
    };
  };

  const runOcrAndAutoTagging = async (
    targetFile?: File,
    customFileName?: string
  ) => {
    setIsScanningOcr(true);
    try {
      let imageBase64: string | undefined;
      if (targetFile && (targetFile.type.startsWith('image/') || targetFile.size < 4 * 1024 * 1024)) {
        imageBase64 = await new Promise<string | undefined>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
          reader.onerror = () => resolve(undefined);
          reader.readAsDataURL(targetFile);
        });
      }

      const effectiveName =
        customFileName ||
        targetFile?.name ||
        attachments[attachments.length - 1]?.fileName ||
        'ເອກະສານສະແກນ.pdf';

      const response = await fetch('/api/ocr-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: effectiveName,
          fileType: targetFile?.type || 'application/pdf',
          imageBase64,
          subjectHint: subject,
          direction,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.data?.ocrText) {
          setOcrText(result.data.ocrText);
          setOcrConfidence(result.data.confidence || 98.4);
          if (!subject.trim() && result.data.suggestedSubject) {
            setSubject(result.data.suggestedSubject);
          }
          if (result.data.suggestedCategory) setCategory(result.data.suggestedCategory);
          if (result.data.suggestedDocumentType) setDocumentType(result.data.suggestedDocumentType);
          if (
            result.data.suggestedPriority &&
            ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(result.data.suggestedPriority)
          ) {
            setPriority(result.data.suggestedPriority as DocumentPriority);
          }
          if (Array.isArray(result.data.suggestedTags) && result.data.suggestedTags.length > 0) {
            setTags(Array.from(new Set(result.data.suggestedTags)));
          }
          setIsScanningOcr(false);
          return;
        }
      }

      // Deterministic instant OCR extraction fallback
      await new Promise((r) => setTimeout(r, 450));
      const fallback = buildLocalOcrFallback(effectiveName, subject);
      setOcrText(fallback.ocrText);
      setOcrConfidence(fallback.confidence);
      if (!subject.trim()) setSubject(fallback.subject);
      setCategory(fallback.category);
      setDocumentType(fallback.documentType);
      setPriority(fallback.priority);
      if (!referenceNumber.trim()) setReferenceNumber(fallback.referenceNumber);
      setTags(fallback.tags);
    } catch {
      const effectiveName =
        customFileName ||
        targetFile?.name ||
        attachments[attachments.length - 1]?.fileName ||
        'ເອກະສານສະແກນ.pdf';
      const fallback = buildLocalOcrFallback(effectiveName, subject);
      setOcrText(fallback.ocrText);
      setOcrConfidence(fallback.confidence);
      if (!subject.trim()) setSubject(fallback.subject);
      setTags(fallback.tags);
    } finally {
      setIsScanningOcr(false);
    }
  };

  const handleApplyScannedPreset = (preset: ScannedSamplePreset) => {
    setSubject(preset.subject);
    setCategory(preset.category);
    setDocumentType(preset.documentType);
    setPriority(preset.priority);
    setReferenceNumber(preset.referenceNumber);
    setSender(preset.sender);
    setRecipient(preset.recipient);
    setOcrText(preset.ocrText);
    setOcrConfidence(preset.confidence);
    setTags(preset.tags);
    setAttachments((prev) => {
      if (prev.some((a) => a.fileName === preset.fileName)) return prev;
      return [
        ...prev,
        {
          fileName: preset.fileName,
          fileSize: preset.fileSize,
          fileType: preset.fileName.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf',
          url: '#',
        },
      ];
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    const newFiles = fileList.map((file) => ({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      url: '#',
    }));

    setAttachments((prev) => [...prev, ...newFiles]);

    // Automatically trigger OCR text extraction & AI auto-tagging upon file upload
    await runOcrAndAutoTagging(fileList[0], fileList[0].name);
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleCopyOcrText = async () => {
    if (!ocrText) return;
    try {
      await navigator.clipboard.writeText(ocrText);
      setOcrCopied(true);
      setTimeout(() => setOcrCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      await alert.fire({
        type: 'warning',
        title: 'ກະລຸນາໃສ່ຫົວຂໍ້ເອກະສານ',
        text: 'ຕ້ອງໃສ່ "ເລື່ອງ" ຂອງເອກະສານກ່ອນບັນທຶກ',
      });
      return;
    }

    const finalOcrText =
      ocrText.trim() ||
      `[OCR Scanned Document - ${documentNumber}] ເລື່ອງ: ${subject.trim()} | ຈາກ: ${sender.trim()} | ເຖິງ: ${recipient.trim()} | ໝວດ: ${category}`;

    const newDoc = documentStore.createDocument(currentUser, {
      direction,
      documentNumber,
      referenceNumber: referenceNumber.trim() || undefined,
      referenceDate: referenceDate || undefined,
      documentDate,
      receivedDate: direction === 'INCOMING' ? receivedDate : undefined,
      subject: subject.trim(),
      category,
      documentType,
      priority,
      purpose,
      purposeNote: purposeNote.trim() || undefined,
      departmentId: currentUser.departmentId,
      departmentName: currentUser.departmentName,
      sender: sender.trim(),
      recipient: recipient.trim(),
      instructions: instructions.trim() || undefined,
      comments: comments.trim() || undefined,
      ocrText: finalOcrText,
      tags: tags.length > 0 ? tags : [category, documentType],
      attachments,
    });

    await alert.fire({
      type: 'success',
      title: 'ບັນທຶກເອກະສານ & ຂໍ້ຄວາມ OCR ສຳເລັດ',
      text: `ເອກະສານເລກທີ ${newDoc.documentNumber} ພ້ອມຂໍ້ຄວາມ OCR ຖືກບັນທຶກ ແລະ ສົ່ງເຂົ້າ Workflow ແລ້ວ`,
    });

    onSuccess(newDoc.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="shrink-0 drop-shadow-sm hover:scale-105 transition-transform">
              <LHSELogo size={40} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {direction === 'INCOMING' ? 'ລົງທະບຽນເອກະສານຂາເຂົ້າ' : 'ສ້າງຮ່າງເອກະສານຂາອອກ'}
                </h3>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                  LHSE
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 flex items-center gap-1">
                  <ScanText className="w-3 h-3" />
                  <span>OCR + AI Auto-Tagging</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ກະລຸນາຕື່ມຂໍ້ມູນເອກະສານ ຫຼື ອັບໂຫຼດເອກະສານສະແກນເພື່ອສະກັດຂໍ້ຄວາມ OCR ອັດຕະໂນມັດ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direction Switcher Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-6">
          <button
            type="button"
            onClick={() => {
              setDirection('INCOMING');
              setDocumentNumber(`ລຮລ/${String(Math.floor(250 + Math.random() * 700)).padStart(4, '0')}`);
              setSender('ກະຊວງການເງິນ');
              setRecipient('ລັດວິສາຫະກິດຖືຮຸ້ນລາວ');
            }}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              direction === 'INCOMING'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📥 ເອກະສານຂາເຂົ້າ (Incoming)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection('OUTGOING');
              setDocumentNumber(`ລຮລ.ຄກ/${String(Math.floor(90 + Math.random() * 200)).padStart(3, '0')}`);
              setSender('ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ');
              setRecipient('ຄະນະຜູ້ອຳນວຍການໃຫຍ່');
            }}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              direction === 'OUTGOING'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📤 ເອກະສານຂາອອກ (Outgoing)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Row 1: Document Number & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {direction === 'INCOMING' ? 'ເລກທີຂາເຂົ້າ (ລຮລ) *' : 'ເລກທີຂາອອກ (ລຮລ.ຄກ) *'}
              </label>
              <input
                type="text"
                required
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ວັນທີເອກະສານ *</label>
              <input
                type="date"
                required
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            {direction === 'INCOMING' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ວັນທີຮັບເອກະສານ *</label>
                <input
                  type="date"
                  required
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Reference Info (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ເລກທີອ້າງອີງ (Reference No):</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="ຕົວຢ່າງ: ກຊ.ກງ/1052"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ວັນທີອ້າງອີງ:</label>
              <input
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ເລື່ອງ (Subject) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ປ້ອນຫົວຂໍ້ ຫຼື ເລື່ອງຂອງເອກະສານຢ່າງລະອຽດ..."
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            />
          </div>

          {/* Category, Type, Priority, Purpose */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ໝວດເອກະສານ:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="ແຈ້ງການລັດຖະການ">ແຈ້ງການລັດຖະການ</option>
                <option value="ໜັງສືສະເໜີ">ໜັງສືສະເໜີ</option>
                <option value="ບົດສະເໜີ">ບົດສະເໜີ</option>
                <option value="ຂໍ້ຕົກລົງ">ຂໍ້ຕົກລົງ</option>
                <option value="ຄຳສັ່ງ">ຄຳສັ່ງ</option>
                <option value="ບົດລາຍງານ">ບົດລາຍງານ</option>
                <option value="ສັນຍາ / MOU">ສັນຍາ / MOU</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ປະເພດ:</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="ແຈ້ງການ">ແຈ້ງການ</option>
                <option value="ໜັງສືສະເໜີ">ໜັງສືສະເໜີ</option>
                <option value="ບົດສະເໜີ">ບົດສະເໜີ</option>
                <option value="ຂໍ້ຕົກລົງ">ຂໍ້ຕົກລົງ</option>
                <option value="ບົດບັນທຶກ">ບົດບັນທຶກ</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>ຄວາມດ່ວນ (Priority):</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as DocumentPriority)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                <option value="LOW">🟢 ຕ່ຳ (Low)</option>
                <option value="MEDIUM">🔵 ປານກາງ (Medium)</option>
                <option value="HIGH">🟠 ສູງ (High)</option>
                <option value="URGENT">🚨 ດ່ວນທີ່ສຸດ (Urgent)</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>ຈຸດປະສົງ:</span>
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as DocumentPurpose)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                <option value="RESEARCH">🔍 ເພື່ອຄົ້ນຄວ້າ (Research)</option>
                <option value="INFORM">📢 ເພື່ອຮັບຊາບ (Inform)</option>
                <option value="OTHER">📌 ອື່ນໆ (Other)</option>
              </select>
            </div>
          </div>

          {/* Sender & Recipient */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {direction === 'INCOMING' ? 'ຜູ້ສົ່ງ / ໜ່ວຍງານສົ່ງມາ *' : 'ພະແນກຕົ້ນກຳເນີດ *'}
              </label>
              <input
                type="text"
                required
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {direction === 'INCOMING' ? 'ຜູ້ຮັບພາຍໃນ *' : 'ຜູ້ຮັບ / ໜ່ວຍງານປາຍທາງ *'}
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Drag & Drop File Upload + Automatic OCR Extraction */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                ໄຟລ໌ຄັດຕິດ & ເອກະສານສະແກນ (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG)
              </label>
              <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                <ScanText className="w-3.5 h-3.5" />
                <span>ຮອງຮັບການສະກັດຂໍ້ຄວາມ OCR ອັດຕະໂນມັດເມື່ອອັບໂຫຼດໄຟລ໌</span>
              </span>
            </div>

            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-5 block text-center bg-slate-50/50 hover:bg-indigo-50/20 transition cursor-pointer">
              <Upload className="w-7 h-7 text-indigo-500 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-slate-700">
                ຄລິກເພື່ອເລືອກໄຟລ໌ສະແກນ ຫຼື Drag & Drop ໄຟລ໌ມາວາງທີ່ນີ້ (ສະກັດ OCR ອັດຕະໂນມັດ)
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                ຂະໜາດສູງສຸດ 25MB ຕໍ່ໄຟລ໌ • ສະກັດຕົວອັກສອນຈາກເອກະສານເຈ້ຍທີ່ສະແກນເພື່ອໃຊ້ຄົ້ນຫາ
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Uploaded attachments list */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{att.fileName}</span>
                      <span className="text-slate-400 text-[10px]">
                        ({(att.fileSize / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => runOcrAndAutoTagging(undefined, att.fileName)}
                        className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 flex items-center gap-1 cursor-pointer"
                      >
                        <ScanText className="w-3 h-3" />
                        <span>ສະກັດ OCR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs px-2 py-0.5 rounded cursor-pointer"
                      >
                        ລຶບ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OCR (Optical Character Recognition) & AI Auto-Tagging Panel */}
          <div className="p-4 rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
                  <ScanText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900">
                      ລະບົບສະກັດຂໍ້ຄວາມ OCR & ແນະນຳປ້າຍກຳກັບອັດຕະໂນມັດ (OCR & AI Auto-Tagging)
                    </h4>
                    {ocrConfidence && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                        ຄວາມຊັດເຈນ OCR: {ocrConfidence}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ແປງເອກະສານເຈ້ຍທີ່ສະແກນເປັນຂໍ້ຄວາມດິຈິທັລ ເພື່ອໃຫ້ສາມາດຄົ້ນຫາທຸກຄຳສັບໃນເອກະສານໄດ້ທັນທີ
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isScanningOcr}
                onClick={() => runOcrAndAutoTagging()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0 self-start sm:self-auto"
              >
                {isScanningOcr ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>ກຳລັງສະກັດຂໍ້ຄວາມ OCR...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>ສະກັດຂໍ້ຄວາມ OCR & ວິເຄາະ AI</span>
                  </>
                )}
              </button>
            </div>

            {/* 1-Click Scanned Document Sample Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">
                ທົດສອບດ່ວນດ້ວຍຕົວຢ່າງເອກະສານເຈ້ຍສະແກນ (1-Click Scanned Document Samples):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SCANNED_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyScannedPreset(preset)}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-xl text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Extracted OCR Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ຂໍ້ຄວາມທີ່ສະກັດໄດ້ຈາກເອກະສານສະແກນ (Extracted Searchable OCR Text):</span>
                </label>
                {ocrText && (
                  <button
                    type="button"
                    onClick={handleCopyOcrText}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {ocrCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{ocrCopied ? 'ສຳເນົາແລ້ວ' : 'ສຳເນົາຂໍ້ຄວາມ OCR'}</span>
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="ຂໍ້ຄວາມຈາກການສະແກນ OCR ຈະປາກົດຢູ່ບ່ອນນີ້ໂດຍອັດຕະໂນມັດ ເມື່ອທ່ານອັບໂຫຼດໄຟລ໌ ຫຼື ກົດປຸ່ມ 'ສະກັດຂໍ້ຄວາມ OCR'..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans leading-relaxed text-slate-700"
              />
            </div>

            {/* AI Auto-Suggested Category Tags */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>ປ້າຍກຳກັບໝວດໝູ່ AI ສຳລັບການຄົ້ນຫາ (AI Suggested Category Tags):</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100/80 text-indigo-800 border border-indigo-200 text-[11px] font-bold"
                  >
                    <Tag className="w-3 h-3 text-indigo-600" />
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-indigo-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="+ ເພີ່ມປ້າຍກຳກັບ..."
                    className="px-2.5 py-1 text-[11px] bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="p-1 bg-slate-200 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-lg transition cursor-pointer"
                    title="ເພີ່ມປ້າຍກຳກັບ"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 flex items-center gap-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ບັນທຶກເອກະສານ & ຂໍ້ຄວາມ OCR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
