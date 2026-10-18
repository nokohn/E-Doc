import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  Filter,
  Inbox,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  FolderArchive,
  Folder,
  X,
  Check,
  CheckSquare,
  Square,
  Target,
  AlertCircle,
} from 'lucide-react';
import { DocumentRecord, User, EStorageFolder, SavedSearchCriteria } from '../types';
import { documentStore } from '../services/store';
import { ROLE_HIERARCHY } from '../services/workflowAuthMiddleware';
import { useAlert } from '../components/SweetAlertModal';
import { SavedSearchesBar } from '../components/SavedSearchesBar';

interface IncomingViewProps {
  currentUser: User;
  onOpenDocument: (documentId: string) => void;
  onNewIncoming: () => void;
}

export const IncomingView: React.FC<IncomingViewProps> = ({
  currentUser,
  onOpenDocument,
  onNewIncoming,
}) => {
  const alert = useAlert();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SIGNED' | 'RETURNED' | 'COMPLETED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('ALL');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showMoveFolderModal, setShowMoveFolderModal] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [folders, setFolders] = useState<EStorageFolder[]>([]);

  useEffect(() => {
    const update = () => {
      setDocuments(documentStore.getDocuments().filter(d => d.direction === 'INCOMING'));
      setFolders(documentStore.getFolders());
    };
    update();
    const unsub = documentStore.subscribe(update);
    return () => unsub();
  }, []);

  const filtered = documents.filter(d => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchText = (
        d.documentNumber +
        ' ' +
        d.subject +
        ' ' +
        d.sender +
        ' ' +
        d.departmentName +
        ' ' +
        d.category +
        ' ' +
        (d.ocrText || '') +
        ' ' +
        (d.tags || []).join(' ')
      ).toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    if (categoryFilter !== 'ALL' && d.category !== categoryFilter) {
      return false;
    }
    if (statusFilter === 'PENDING') return d.status === 'IN_PROGRESS' || d.status === 'REGISTERED';
    if (statusFilter === 'RETURNED') return d.status === 'RETURNED';
    if (statusFilter === 'COMPLETED') return d.status === 'COMPLETED' || d.status === 'ARCHIVED';
    if (priorityFilter !== 'ALL') {
      if (priorityFilter === 'MEDIUM') {
        if (d.priority !== 'MEDIUM' && d.priority !== 'NORMAL') return false;
      } else if (d.priority !== priorityFilter) {
        return false;
      }
    }
    return true;
  });

  const isAllSelected = filtered.length > 0 && filtered.every(d => selectedDocIds.includes(d.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filtered.map(d => d.id));
    }
  };

  const handleToggleSelectDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedDocIds.length === 0) return;
    const confirmed = await alert.fire({
      type: 'approval',
      title: 'ຢືນຢັນການອະນຸມັດເປັນກຸ່ມ',
      text: `ທ່ານຕ້ອງການອະນຸມັດ ແລະ ສົ່ງຕໍ່ເອກະສານທີ່ເລືອກທັງໝົດ ${selectedDocIds.length} ສະບັບ ແທ້ຫຼືບໍ່? (ລະບົບຈະສົ່ງ Email Alert ອັດຕະໂນມັດ)`,
      confirmButtonText: 'ຢືນຢັນອະນຸມັດ (Approve)',
      cancelButtonText: 'ຍົກເລີກ',
    });

    if (confirmed) {
      const res = documentStore.bulkApproveDocuments(selectedDocIds, currentUser);
      setSelectedDocIds([]);
      await alert.fire({
        type: 'success',
        title: 'ອະນຸມັດເປັນກຸ່ມສຳເລັດ',
        text: `ອະນຸມັດ ແລະ ສົ່ງຕໍ່ເອກະສານສຳເລັດແລ້ວ ${res.successCount} ສະບັບ${res.failedCount > 0 ? ` (ບໍ່ສຳເລັດ ${res.failedCount} ສະບັບ)` : ''}`,
      });
    }
  };

  const handleBulkReject = async () => {
    if (selectedDocIds.length === 0) return;
    const confirmed = await alert.fire({
      type: 'reject',
      title: 'ຢືນຢັນການສົ່ງຄືນ/ຕີກັບເປັນກຸ່ມ',
      text: `ກະລຸນາລະບຸເຫດຜົນໃນການສົ່ງຄືນເອກະສານ ${selectedDocIds.length} ສະບັບ:`,
      requireReason: true,
      reasonPlaceholder: 'ຕົວຢ່າງ: ເນື້ອໃນຍັງບໍ່ຄົບຖ້ວນ, ຕ້ອງການຂໍ້ມູນເພີ່ມເຕີມ...',
      confirmButtonText: 'ສົ່ງຄືນ (Reject & Return)',
      cancelButtonText: 'ຍົກເລີກ',
    });

    if (confirmed) {
      const reason = typeof confirmed === 'string' ? confirmed : 'ສົ່ງຄືນເປັນກຸ່ມໂດຍ ' + currentUser.fullName;
      const res = documentStore.bulkRejectDocuments(selectedDocIds, currentUser, reason);
      setSelectedDocIds([]);
      await alert.fire({
        type: 'success',
        title: 'ສົ່ງຄືນເປັນກຸ່ມສຳເລັດ',
        text: `ໄດ້ສົ່ງຄືນເອກະສານ ${res.successCount} ສະບັບ ໄປຍັງຂັ້ນຕອນກ່ອນໜ້າຮຽບຮ້ອຍແລ້ວ`,
      });
    }
  };

  const handleBulkMoveConfirm = async () => {
    if (!selectedFolderId || selectedDocIds.length === 0) return;
    const res = documentStore.bulkMoveToFolder(selectedDocIds, selectedFolderId, currentUser);
    setShowMoveFolderModal(false);
    setSelectedDocIds([]);
    await alert.fire({
      type: 'success',
      title: 'ຍ້າຍເຂົ້າໂຟນເດີສຳເລັດ',
      text: `ໄດ້ຍ້າຍເອກະສານ ${res.successCount} ສະບັບ ເຂົ້າສູ່ໂຟນເດີ "${res.folderName}" ຮຽບຮ້ອຍແລ້ວ`,
    });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Inbox className="w-5 h-5" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
              ລາຍການເອກະສານຂາເຂົ້າ (Incoming Documents)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Workflow: ຮັບ & ລົງທະບຽນ → ຫົວໜ້າພະແນກ → ຮອງຫົວໜ້າພະແນກ → ຫົວໜ້າໜ່ວຍງານ → ໃບຢັ້ງຢືນຄວາມຖືກຕ້ອງຂອງພະນັກງານ → E-Storage & ສຳເລັດ
          </p>
        </div>

        <button
          onClick={onNewIncoming}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>ລົງທະບຽນຂາເຂົ້າໃໝ່</span>
        </button>
      </div>

      {/* Saved Searches Bar */}
      <SavedSearchesBar
        currentUser={currentUser}
        direction="INCOMING"
        currentQuery={search}
        currentCategory={categoryFilter}
        currentPriority={priorityFilter}
        currentStatus={statusFilter === 'SIGNED' ? 'ALL' : statusFilter}
        onApplyCriteria={(c: SavedSearchCriteria) => {
          setSearch(c.query || '');
          setCategoryFilter(c.category || 'ALL');
          setPriorityFilter((c.priority as any) || 'ALL');
          setStatusFilter((c.status as any) || 'ALL');
        }}
        onResetFilters={() => {
          setSearch('');
          setCategoryFilter('ALL');
          setPriorityFilter('ALL');
          setStatusFilter('ALL');
        }}
        onOpenDocument={onOpenDocument}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາເລກທີຂາເຂົ້າ, ຫົວຂໍ້, ຜູ້ສົ່ງ..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category, Priority & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              title="ກັ່ນຕອງຕາມໝວດເອກະສານ"
            >
              <option value="ALL">ທຸກໝວດເອກະສານ (All Categories)</option>
              <option value="ແຈ້ງການລັດຖະການ">ແຈ້ງການລັດຖະການ</option>
              <option value="ໜັງສືສະເໜີ">ໜັງສືສະເໜີ</option>
              <option value="ບົດສະເໜີ">ບົດສະເໜີ</option>
              <option value="ຂໍ້ຕົກລົງ">ຂໍ້ຕົກລົງ</option>
              <option value="ຄຳສັ່ງ">ຄຳສັ່ງ</option>
              <option value="ບົດລາຍງານ">ບົດລາຍງານ</option>
              <option value="ສັນຍາ / MOU">ສັນຍາ / MOU</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              title="ກັ່ນຕອງຕາມລະດັບຄວາມດ່ວນ (Filter by Priority)"
            >
              <option value="ALL">ທຸກລະດັບຄວາມດ່ວນ (All Priorities)</option>
              <option value="URGENT">🚨 ດ່ວນທີ່ສຸດ (Urgent)</option>
              <option value="HIGH">🟠 ສູງ (High)</option>
              <option value="MEDIUM">🔵 ປານກາງ (Medium)</option>
              <option value="LOW">🟢 ຕ່ຳ (Low)</option>
            </select>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'ທັງໝົດ' },
            { id: 'PENDING', label: 'ກຳລັງດຳເນີນການ' },
            { id: 'RETURNED', label: 'ສົ່ງຄືນ / ຕີກັບ' },
            { id: 'COMPLETED', label: 'ສຳເລັດແລ້ວ' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Bulk Selection Actions Bar (Appears when 1 or more documents are selected) */}
      {selectedDocIds.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-2xl shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {selectedDocIds.length}
            </span>
            <div>
              <span className="text-xs font-bold text-white">
                ເລືອກແລ້ວ {selectedDocIds.length} ສະບັບ (Selected)
              </span>
              <span className="text-[11px] text-slate-300 block">
                ທ່ານສາມາດດຳເນີນການເປັນກຸ່ມ (Bulk Action) ພ້ອມກັນໄດ້:
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBulkApprove}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="ອະນຸມັດ ແລະ ສົ່ງຕໍ່ເອກະສານທີ່ເລືອກທັງໝົດ"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve (ອະນຸມັດ)</span>
            </button>

            <button
              type="button"
              onClick={handleBulkReject}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="ສົ່ງຄືນ ຫຼື ຕີກັບເອກະສານທີ່ເລືອກ"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reject (ສົ່ງຄືນ)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (folders.length > 0) setSelectedFolderId(folders[0].id);
                setShowMoveFolderModal(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="ຍ້າຍເອກະສານເຂົ້າໂຟນເດີ E-Storage"
            >
              <FolderArchive className="w-4 h-4" />
              <span>Move to Folder (ຍ້າຍເຂົ້າໂຟນເດີ)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDocIds([])}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            >
              ຍົກເລີກ
            </button>
          </div>
        </div>
      )}

      {/* Table of Documents */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    title="ເລືອກທັງໝົດ / ຍົກເລີກທັງໝົດ"
                  />
                </th>
                <th className="py-3.5 px-4">ເລກທີຂາເຂົ້າ</th>
                <th className="py-3.5 px-4">ວັນທີຮັບ</th>
                <th className="py-3.5 px-4">ເລື່ອງ / ຫົວຂໍ້</th>
                <th className="py-3.5 px-4">ຜູ້ສົ່ງ</th>
                <th className="py-3.5 px-4">ຂັ້ນຕອນປັດຈຸບັນ</th>
                <th className="py-3.5 px-4">ຜູ້ມີສິດດຳເນີນການ</th>
                <th className="py-3.5 px-4 text-center">ສະຖານະ</th>
                <th className="py-3.5 px-4 text-right">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    ບໍ່ພົບຂໍ້ມູນເອກະສານຂາເຂົ້າ
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const curStep = d.workflowSteps.find(s => s.stepOrder === d.currentStepOrder);
                  const isUrgent = d.priority === 'URGENT';
                  const isReturned = d.status === 'RETURNED';
                  const isCompleted = d.status === 'COMPLETED' || d.status === 'ARCHIVED';
                  const isSelected = selectedDocIds.includes(d.id);

                  return (
                    <tr
                      key={d.id}
                      onClick={() => onOpenDocument(d.id)}
                      className={`transition cursor-pointer group ${
                        isSelected ? 'bg-blue-50/80' : 'hover:bg-blue-50/40'
                      }`}
                    >
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectDoc(d.id, e as any)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{d.documentNumber}</span>
                        </div>
                        {d.referenceNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            ອ້າງອີງ: {d.referenceNumber}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {d.priority === 'URGENT' ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-700 rounded border border-rose-200">
                              🚨 ດ່ວນທີ່ສຸດ
                            </span>
                          ) : d.priority === 'HIGH' ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded border border-amber-200">
                              🟠 ສູງ
                            </span>
                          ) : d.priority === 'LOW' ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-medium bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                              🟢 ຕ່ຳ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-medium bg-blue-50 text-blue-700 rounded border border-blue-200">
                              🔵 ປານກາງ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {d.receivedDate || d.documentDate}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition truncate">
                          {d.subject}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                          <span>{d.documentType} • {d.category}</span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-200/60" title="ຈຸດປະສົງ">
                            <Target className="w-2.5 h-2.5 text-indigo-600" />
                            <span>
                              {d.purpose === 'RESEARCH' ? '🔍 ເພື່ອຄົ້ນຄວ້າ' : d.purpose === 'INFORM' ? '📢 ເພື່ອຮັບຊາບ' : '📌 ອື່ນໆ'}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {d.sender}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-800 font-semibold block text-[11px]">
                          ຂັ້ນຕອນທີ {d.currentStepOrder}: {curStep?.stepNameLao}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${ROLE_HIERARCHY[curStep?.requiredRole || 'STAFF']?.color}`}>
                          {ROLE_HIERARCHY[curStep?.requiredRole || 'STAFF']?.labelLao.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ສຳເລັດ</span>
                          </span>
                        ) : isReturned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <RotateCcw className="w-3 h-3" />
                            <span>ສົ່ງຄືນ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            <span>ດຳເນີນການ</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDocument(d.id);
                          }}
                          className="px-3 py-1 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white rounded-lg text-xs font-semibold transition"
                        >
                          ເບິ່ງ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Move to Folder Modal */}
      {showMoveFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">ຍ້າຍເອກະສານເຂົ້າໂຟນເດີ (Move to Folder)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMoveFolderModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                ກະລຸນາເລືອກໂຟນເດີ E-Storage ປາຍທາງ ສຳລັບເອກະສານທີ່ເລືອກທັງໝົດ{' '}
                <strong className="text-indigo-600 font-bold">{selectedDocIds.length} ສະບັບ</strong>:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {folders.map(f => (
                  <label
                    key={f.id}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      selectedFolderId === f.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="targetFolder"
                        value={f.id}
                        checked={selectedFolderId === f.id}
                        onChange={() => setSelectedFolderId(f.id)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-xs flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{f.nameLao}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          ປີ: {f.year} • ພະແນກ: {f.departmentName}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200 font-mono text-slate-500 font-semibold">
                      {f.documentCount} ສະບັບ
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMoveFolderModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="button"
                disabled={!selectedFolderId}
                onClick={handleBulkMoveConfirm}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ຢືນຢັນຍ້າຍ ({selectedDocIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
