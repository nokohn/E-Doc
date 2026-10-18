import React, { useState, useEffect } from 'react';
import { PenTool, ShieldCheck, Search, CheckCircle2, Clock, Check, AlertCircle, ExternalLink, QrCode } from 'lucide-react';
import { DocumentRecord, User } from '../types';
import { documentStore } from '../services/store';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { VerifySignatureModal } from '../components/VerifySignatureModal';

interface ESignatureViewProps {
  currentUser: User;
  onOpenDocument: (documentId: string) => void;
}

export const ESignatureView: React.FC<ESignatureViewProps> = ({
  currentUser,
  onOpenDocument,
}) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY' | 'VERIFY'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname;
      if (params.get('verify') || path.toLowerCase().startsWith('/verify/')) return 'VERIFY';
    }
    return 'PENDING';
  });
  const [verifyCode, setVerifyCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verify')) return params.get('verify') || '';
      const path = window.location.pathname;
      if (path.toLowerCase().startsWith('/verify/')) {
        return decodeURIComponent(path.slice('/verify/'.length)).replace(/\/+$/, '');
      }
    }
    return '';
  });
  const [verifyResult, setVerifyResult] = useState<{ found: boolean; data?: any } | null>(null);

  // Certificate modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [targetVerifyDoc, setTargetVerifyDoc] = useState<DocumentRecord | null>(null);
  const [targetVerifySig, setTargetVerifySig] = useState<any>(null);

  useEffect(() => {
    const update = () => setDocuments(documentStore.getDocuments());
    update();
    const unsub = documentStore.subscribe(update);
    return () => unsub();
  }, []);

  // Auto verify when verifyCode is set via URL or input
  const resolveVerification = (codeString: string) => {
    if (!codeString || documents.length === 0) return;
    const code = codeString.trim().toUpperCase();

    // 1. Match signature verification code
    const allSigs = documents.flatMap(d =>
      d.signatures.map(s => ({
        ...s,
        docRef: d,
        documentNumber: d.documentNumber,
        subject: d.subject,
      }))
    );
    const matchedSig = allSigs.find(s => s.verificationCode.toUpperCase() === code);
    if (matchedSig) {
      setVerifyResult({ found: true, data: matchedSig });
      return;
    }

    // 2. Match document unique ID or document number
    const matchedDoc = documents.find(d =>
      d.id.toUpperCase() === code ||
      d.documentNumber.toUpperCase() === code
    );
    if (matchedDoc) {
      if (matchedDoc.signatures.length > 0) {
        const latestSig = matchedDoc.signatures[matchedDoc.signatures.length - 1];
        setVerifyResult({
          found: true,
          data: {
            ...latestSig,
            docRef: matchedDoc,
            documentNumber: matchedDoc.documentNumber,
            subject: matchedDoc.subject,
          },
        });
      } else {
        setVerifyResult({
          found: true,
          data: {
            id: 'doc-ver-' + matchedDoc.id,
            documentId: matchedDoc.id,
            signerName: matchedDoc.createdByName || 'ເຈົ້າໜ້າທີ່ສາລະບັນ',
            positionLao: 'ເອກະສານທາງການ ລັດວິສາຫະກິດ',
            signedAt: matchedDoc.createdAt,
            verificationCode: matchedDoc.id,
            docRef: matchedDoc,
            documentNumber: matchedDoc.documentNumber,
            subject: matchedDoc.subject,
            ipAddress: '192.168.1.1',
          },
        });
      }
      return;
    }

    setVerifyResult({ found: false });
  };

  useEffect(() => {
    if (verifyCode && documents.length > 0) {
      resolveVerification(verifyCode);
    }
  }, [verifyCode, documents]);

  // Pending signatures for current user role or all
  const pendingDocs = documents.filter(d => {
    if (d.status === 'COMPLETED') return false;
    const curStep = d.workflowSteps.find(s => s.stepOrder === d.currentStepOrder);
    if (!curStep) return false;
    const isSigStep = curStep.stepNameLao.includes('E-Signature') || curStep.stepNameLao.includes('ເຊັນ');
    if (!isSigStep) return false;
    if (currentUser.role === 'ADMIN') return true;
    return curStep.requiredRole === currentUser.role;
  });

  // All verified signatures
  const allSignatures = documents.flatMap(d =>
    d.signatures.map(s => ({
      ...s,
      docRef: d,
      documentNumber: d.documentNumber,
      subject: d.subject,
    }))
  );

  const openCertificate = (sig: any) => {
    const doc = sig.docRef || documents.find(d => d.id === sig.documentId) || documents[0];
    setTargetVerifyDoc(doc);
    setTargetVerifySig(sig);
    setShowVerifyModal(true);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    resolveVerification(verifyCode);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <PenTool className="w-5 h-5" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
              ລະບົບລາຍເຊັນດິຈິທັລ (E-Signature Management)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ການລົງລາຍເຊັນດິຈິທັລ, ປະຫວັດການເຊັນເອກະສານ ແລະ ການກວດສອບໃບຢັ້ງຢືນ Verification Code
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'PENDING'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>ເອກະສານລໍຖ້າເຊັນ ({pendingDocs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ປະຫວັດລາຍເຊັນທີ່ຮັບຮອງ ({allSignatures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('VERIFY')}
          className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'VERIFY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>ກວດສອບລະຫັດລາຍເຊັນ (Verify Code)</span>
        </button>
      </div>

      {/* Tab 1: Pending */}
      {activeTab === 'PENDING' && (
        <div className="space-y-4">
          {pendingDocs.length === 0 ? (
            <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-70" />
              <p className="text-sm font-bold text-slate-700">ບໍ່ມີເອກະສານລໍຖ້າລົງລາຍເຊັນໃນບົດບາດຂອງທ່ານ</p>
              <p className="text-xs text-slate-400 mt-1">
                ຖ້າຕ້ອງການທົດສອບລົງລາຍເຊັນ ສາມາດສະຫຼັບບົດບາດໄປເປັນ ຫົວໜ້າພະແນກ ຫຼື ຜູ້ອຳນວຍການ ໄດ້ທີ່ເມນູດ້ານເທິງ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingDocs.map(d => {
                const curStep = d.workflowSteps.find(s => s.stepOrder === d.currentStepOrder);
                return (
                  <div
                    key={d.id}
                    onClick={() => onOpenDocument(d.id)}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-500 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-slate-800">{d.documentNumber}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                          ຕ້ອງລົງລາຍເຊັນ
                        </span>
                      </div>
                      <h3 className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition line-clamp-2 mb-3">
                        {d.subject}
                      </h3>
                      <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                        <div><strong>ຂັ້ນຕອນ: </strong>{curStep?.stepNameLao}</div>
                        <div><strong>ຜູ້ຮັບຜິດຊອບ: </strong>{curStep?.requiredRole}</div>
                      </div>
                    </div>
                    <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                      <PenTool className="w-3.5 h-3.5" />
                      <span>ເປີດເອກະສານເພື່ອເຊັນ</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: History */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">ລະຫັດກວດສອບ (Code)</th>
                <th className="py-3.5 px-4">ຜູ້ລົງລາຍເຊັນ</th>
                <th className="py-3.5 px-4">ຕຳແໜ່ງ</th>
                <th className="py-3.5 px-4">ເອກະສານ</th>
                <th className="py-3.5 px-4">ວັນທີ & ເວລາ</th>
                <th className="py-3.5 px-4">ຕົວຢ່າງລາຍເຊັນ</th>
                <th className="py-3.5 px-4 text-center">QR Code</th>
                <th className="py-3.5 px-4 text-center">ໃບຢັ້ງຢືນ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allSignatures.map(sig => (
                <tr key={sig.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                    {sig.verificationCode}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {sig.signerName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {sig.positionLao}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-700 font-semibold">{sig.documentNumber}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{sig.subject}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(sig.signedAt).toLocaleString('lo-LA')}
                  </td>
                  <td className="py-3.5 px-4">
                    {sig.signatureImage.startsWith('data:image') ? (
                      <img src={sig.signatureImage} alt="Signature" className="max-h-8 max-w-[120px] object-contain" />
                    ) : (
                      <span className="italic font-serif">{sig.signerName}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openCertificate(sig)}
                      className="inline-block p-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition cursor-pointer"
                      title="ກວດສອບຜ່ານ QR Code"
                    >
                      <QRCodeGenerator
                        text={typeof window !== 'undefined' ? `${window.location.origin}?verify=${sig.verificationCode}` : `https://edoc.state-enterprise.gov.la/verify/${sig.verificationCode}`}
                        size={26}
                      />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openCertificate(sig)}
                      className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ໃບຢັ້ງຢືນ</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Verification Tool */}
      {activeTab === 'VERIFY' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="text-center">
            <ShieldCheck className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
            <h2 className="text-base font-bold text-slate-800">ກວດສອບຄວາມຖືກຕ້ອງຂອງ E-Signature</h2>
            <p className="text-xs text-slate-500 mt-1">
              ປ້ອນລະຫັດຢັ້ງຢືນ Verification Code (ຕົວຢ່າງ: LA-SIG-784920) ທີ່ປາກົດໃນເອກະສານ
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="flex gap-2">
            <input
              type="text"
              required
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="ປ້ອນລະຫັດ ເຊັ່ນ: LA-SIG-..."
              className="flex-1 px-4 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 uppercase"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              ກວດສອບ
            </button>
          </form>

          {verifyResult && (
            <div className={`p-5 rounded-2xl border ${
              verifyResult.found ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}>
              {verifyResult.found ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>ລາຍເຊັນດິຈິທັລຖືກຕ້ອງຕາມມາດຕະຖານ (Authentic Signature)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCertificate(verifyResult.data)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ເປີດໃບຢັ້ງຢືນທາງການ (Certificate)</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-3 border-t border-emerald-200">
                    <div><strong>ຜູ້ລົງລາຍເຊັນ: </strong>{verifyResult.data.signerName}</div>
                    <div><strong>ຕຳແໜ່ງ: </strong>{verifyResult.data.positionLao}</div>
                    <div><strong>ເລກທີເອກະສານ: </strong>{verifyResult.data.documentNumber}</div>
                    <div><strong>ວັນທີລົງລາຍເຊັນ: </strong>{new Date(verifyResult.data.signedAt).toLocaleString('lo-LA')}</div>
                    <div><strong>IP ທີ່ລົງລາຍເຊັນ: </strong>{verifyResult.data.ipAddress}</div>
                    <div><strong>Verification Code: </strong>{verifyResult.data.verificationCode}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>ບໍ່ພົບລະຫັດລາຍເຊັນດິຈິທັລນີ້ໃນຖານຂໍ້ມູນ ຫຼື ລະຫັດບໍ່ຖືກຕ້ອງ!</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Official Certificate Modal */}
      {showVerifyModal && targetVerifyDoc && (
        <VerifySignatureModal
          document={targetVerifyDoc}
          targetSignature={targetVerifySig || undefined}
          onClose={() => setShowVerifyModal(false)}
          onViewDocument={(docId) => {
            setShowVerifyModal(false);
            onOpenDocument(docId);
          }}
        />
      )}
    </div>
  );
};
