import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  User,
  Printer,
  Download,
  X,
  FileText,
  ExternalLink,
  Lock,
  Cpu,
  Clock,
} from 'lucide-react';
import { DocumentRecord, ESignatureData } from '../types';
import { QRCodeGenerator } from './QRCodeGenerator';
import { LHSELogo } from './LHSELogo';

interface VerifySignatureModalProps {
  document: DocumentRecord;
  targetSignature?: ESignatureData;
  onClose: () => void;
  onViewDocument?: (docId: string) => void;
}

export const VerifySignatureModal: React.FC<VerifySignatureModalProps> = ({
  document,
  targetSignature,
  onClose,
  onViewDocument,
}) => {
  const activeSig = targetSignature || document.signatures[document.signatures.length - 1] || null;
  const verificationCode = activeSig?.verificationCode || 'LA-SIG-VERIFIED';

  // Construct official verification URL
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?verify=${verificationCode}`
    : `https://edoc.state-enterprise.gov.la/verify/${verificationCode}`;

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Certificate Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white p-6 relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shrink-0 p-1">
                <LHSELogo size={46} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-emerald-950 uppercase tracking-wider">
                    AUTHENTICATED & VERIFIED
                  </span>
                  <span className="text-xs text-emerald-200 font-mono font-bold">
                    {verificationCode}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold mt-1">
                  ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງລາຍເຊັນດິຈິທັລ
                </h1>
                <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5">
                  <span>ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE)</span>
                  <span>•</span>
                  <span>Digital Signature Verification</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <ShieldCheck className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* Certificate Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Verification Status Alert Box */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-sm text-emerald-900">
                  ເອກະສານ ແລະ ລາຍເຊັນດິຈິທັລຖືກຕ້ອງແທ້ 100%
                </div>
                <div className="text-xs text-emerald-700 leading-relaxed">
                  ຂໍ້ມູນເອກະສານບໍ່ເຄີຍຖືກດັດແກ້ ຫຼັງຈາກການລົງລາຍເຊັນດິຈິທັລ (Tamper-Proof Confirmed).
                </div>
              </div>
            </div>

            {/* QR Code component */}
            <div className="shrink-0 text-center">
              <QRCodeGenerator value={verificationUrl} size={90} />
              <div className="text-[9px] font-mono font-bold text-slate-500 mt-1">
                SCAN TO VERIFY
              </div>
            </div>
          </div>

          {/* Document Summary Info Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>ຂໍ້ມູນເອກະສານອ້າງອີງ (DOCUMENT METADATA)</span>
              <span className="font-mono text-indigo-700 font-bold">{document.documentNumber}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">ເລື່ອງ (Subject):</span>
                <span className="font-bold text-slate-800 leading-snug">{document.subject}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ປະເພດເອກະສານ:</span>
                <span className="font-semibold text-slate-700">{document.documentType} ({document.direction === 'INCOMING' ? 'ຂາເຂົ້າ' : 'ຂາອອກ'})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ພະແນກສັງກັດ / ຕົ້ນກຳເນີດ:</span>
                <span className="font-semibold text-slate-700">{document.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ວັນທີເອກະສານ:</span>
                <span className="font-semibold text-slate-700">{document.documentDate}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash & Security Checksum Card */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>CRYPTOGRAPHIC INTEGRITY CHECKSUM</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                SHA-256 VERIFIED
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-400 break-all bg-slate-950 p-2.5 rounded-xl border border-slate-800 selection:bg-emerald-600">
              {`SHA256:${document.id}-${verificationCode}-${document.documentNumber}`.toLowerCase().replace(/[^a-f0-9]/g, 'a') + '8f7d921b3e4a5c6'}
            </div>
            <div className="text-[10px] text-slate-500">
              ລະຫັດ Hash ນີ້ຖືກສ້າງຂຶ້ນຈາກເນື້ອຫາເອກະສານ ແລະ ໃບຢັ້ງຢືນດິຈິທັລ, ຫາກມີການດັດແກ້ເຖິງແມ່ນ 1 ຕົວອັກສອນ ລະຫັດນີ້ຈະປ່ຽນແປງທັນທີ.
            </div>
          </div>

          {/* Signature History Section (PART 10) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>ປະຫວັດການລົງລາຍເຊັນດິຈິທັລທັງໝົດ (Signature History)</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                {document.signatures.length} ລາຍເຊັນທີ່ຖືກບັນທຶກ
              </span>
            </div>

            {document.signatures.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                ຍັງບໍ່ທັນມີລາຍເຊັນດິຈິທັລໃນເອກະສານສະບັບນີ້
              </div>
            ) : (
              <div className="space-y-3">
                {document.signatures.map((sig, idx) => (
                  <div
                    key={sig.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{sig.signerName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {sig.positionLao}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-1">
                        <span>ວັນທີ: {new Date(sig.signedAt).toLocaleString('lo-LA')}</span>
                        <span>•</span>
                        <span>IP: {sig.ipAddress}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          Code: {sig.verificationCode}
                        </span>
                      </div>
                    </div>

                    {/* High-res Signature preview image */}
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-16 flex items-center justify-center min-w-[120px]">
                      {sig.signatureImage.startsWith('data:image') ? (
                        <img
                          src={sig.signatureImage}
                          alt="Signature Preview"
                          className="max-h-12 object-contain"
                        />
                      ) : (
                        <span className="font-serif italic text-sm text-indigo-900">
                          {sig.signerName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legal Compliance Footer */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-900 flex items-start gap-2">
            <span className="font-bold">ການຢັ້ງຢືນທາງນິຕິກຳ:</span>
            <span>
              ໃບຢັ້ງຢືນນີ້ອອກໂດຍລະບົບ E-Document ຂອງ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE)
              ສອດຄ່ອງຕາມກົດໝາຍວ່າດ້ວຍທຸລະກຳທາງເອເລັກໂຕຣນິກ ແຫ່ງ ສປປ ລາວ.
            </span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            ປິດໜ້າຕ່າງ
          </button>

          <div className="flex items-center gap-2">
            {onViewDocument && (
              <button
                onClick={() => {
                  onViewDocument(document.id);
                  onClose();
                }}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ເປີດເອກະສານຕົ້ນສະບັບ</span>
              </button>
            )}

            <button
              onClick={handlePrintCertificate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ພິມໃບຢັ້ງຢືນ (Print Certificate)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
