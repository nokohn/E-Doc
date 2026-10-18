import React, { useState, useEffect } from 'react';
import { GitBranch, Clock, CheckCircle2, RotateCcw, PenTool, ArrowRight, Shield, Filter } from 'lucide-react';
import { DocumentRecord, User } from '../types';
import { documentStore } from '../services/store';
import { ROLE_HIERARCHY } from '../services/workflowAuthMiddleware';

interface WorkflowViewProps {
  currentUser: User;
  onOpenDocument: (documentId: string) => void;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({
  currentUser,
  onOpenDocument,
}) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'MY_TASKS' | 'PENDING_SIG' | 'RETURNED' | 'ALL_TRACKING'>('MY_TASKS');

  useEffect(() => {
    const update = () => setDocuments(documentStore.getDocuments());
    update();
    const unsub = documentStore.subscribe(update);
    return () => unsub();
  }, []);

  const myTasks = documents.filter(d => {
    if (d.status === 'COMPLETED' || d.status === 'ARCHIVED') return false;
    const curStep = d.workflowSteps.find(s => s.stepOrder === d.currentStepOrder);
    if (!curStep) return false;
    if (currentUser.role === 'ADMIN') return true;
    return curStep.requiredRole === currentUser.role;
  });

  const pendingSignatures = documents.filter(d => {
    if (d.status === 'COMPLETED') return false;
    const curStep = d.workflowSteps.find(s => s.stepOrder === d.currentStepOrder);
    return curStep && (curStep.stepNameLao.includes('E-Signature') || curStep.stepNameLao.includes('ເຊັນ'));
  });

  const returnedDocs = documents.filter(d => d.status === 'RETURNED');

  const displayedDocs =
    activeTab === 'MY_TASKS'
      ? myTasks
      : activeTab === 'PENDING_SIG'
      ? pendingSignatures
      : activeTab === 'RETURNED'
      ? returnedDocs
      : documents;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <GitBranch className="w-5 h-5" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
              Workflow ຕິດຕາມວຽກງານ ແລະ ຂະບວນການ
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ກວດສອບວຽກທີ່ມອບໝາຍ, ຂັ້ນຕອນທີ່ຄ້າງຄາ, ລາຍເຊັນດິຈິທັລ ແລະ ການຕີກັບ/ສົ່ງຄືນ
          </p>
        </div>

        {/* Current Active Role Badge */}
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5 shadow-xs">
          <Shield className="w-4 h-4 text-indigo-600" />
          <div className="text-xs">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">ສິດທິປັດຈຸບັນ</div>
            <div className="font-bold text-slate-800">{currentUser.positionLao}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 lg:gap-4 overflow-x-auto pb-1">
        {[
          { id: 'MY_TASKS', label: `ວຽກຂອງຂ້ອຍ (${myTasks.length})`, icon: <Clock className="w-4 h-4" /> },
          { id: 'PENDING_SIG', label: `ລໍຖ້າ E-Signature (${pendingSignatures.length})`, icon: <PenTool className="w-4 h-4" /> },
          { id: 'RETURNED', label: `ຖືກຕີກັບ/ສົ່ງຄືນ (${returnedDocs.length})`, icon: <RotateCcw className="w-4 h-4" /> },
          { id: 'ALL_TRACKING', label: `ຕິດຕາມທຸກເອກະສານ (${documents.length})`, icon: <GitBranch className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Workflow Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedDocs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-70" />
            <p className="text-sm font-bold text-slate-700">ບໍ່ມີເອກະສານໃນໝວດນີ້</p>
            <p className="text-xs text-slate-400 mt-1">
              ທຸກຂັ້ນຕອນໄດ້ຮັບການດຳເນີນການຄົບຖ້ວນແລ້ວ
            </p>
          </div>
        ) : (
          displayedDocs.map(d => {
            const curStep = d.workflowSteps.find(s => s.stepOrder === d.currentStepOrder);
            const isIncoming = d.direction === 'INCOMING';

            return (
              <div
                key={d.id}
                onClick={() => onOpenDocument(d.id)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isIncoming ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isIncoming ? '📥 ຂາເຂົ້າ' : '📤 ຂາອອກ'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800">{d.documentNumber}</span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-xs line-clamp-2 group-hover:text-indigo-600 transition mb-2">
                    {d.subject}
                  </h3>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100 mb-4">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase">ຂັ້ນຕອນປັດຈຸບັນ:</div>
                    <div className="font-bold text-indigo-900 text-xs">
                      ຂັ້ນຕອນ {d.currentStepOrder}: {curStep?.stepNameLao}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>ສິດທິ:</span>
                      <span className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${ROLE_HIERARCHY[curStep?.requiredRole || 'STAFF']?.color}`}>
                        {ROLE_HIERARCHY[curStep?.requiredRole || 'STAFF']?.labelLao.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                  <span className="text-slate-400 text-[11px]">{d.documentDate}</span>
                  <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    <span>ເບິ່ງລາຍລະອຽດ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
