import React, { useState, useEffect } from 'react';
import { Archive, Folder, Search, FileText, Download, Printer, Shield, Eye, Lock } from 'lucide-react';
import { DocumentRecord, EStorageFolder, User } from '../types';
import { documentStore } from '../services/store';
import { useAlert } from '../components/SweetAlertModal';

interface EStorageViewProps {
  currentUser: User;
  onOpenDocument: (documentId: string) => void;
}

export const EStorageView: React.FC<EStorageViewProps> = ({
  currentUser,
  onOpenDocument,
}) => {
  const alert = useAlert();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [folders, setFolders] = useState<EStorageFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const update = () => {
      setDocuments(documentStore.getDocuments());
      setFolders(documentStore.getFolders());
    };
    update();
    const unsub = documentStore.subscribe(update);
    return () => unsub();
  }, []);

  const archivedDocs = documents.filter(d => d.status === 'COMPLETED' || d.status === 'ARCHIVED');

  const filtered = archivedDocs.filter(d => {
    if (selectedFolderId !== 'ALL' && d.eStorageFolderId !== selectedFolderId) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = (
        d.documentNumber +
        ' ' +
        d.subject +
        ' ' +
        d.departmentName +
        ' ' +
        (d.ocrText || '') +
        ' ' +
        (d.tags || []).join(' ')
      ).toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
              <Archive className="w-5 h-5" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
              E-Storage ຄັງເກັບມ້ຽນເອກະສານດິຈິທັລ
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ເອກະສານທີ່ສຳເລັດຂະບວນການຖືກຈັດເກັບອັດຕະໂນມັດ ປ້ອງກັນການດັດແກ້ ແລະ ບໍ່ສາມາດລຶບໄດ້ໂດຍ User ທົ່ວໄປ
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-600 border border-slate-200">
          <Lock className="w-4 h-4 text-slate-500" />
          <span>Protected Archive (Read-Only)</span>
        </div>
      </div>

      {/* Folders Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedFolderId('ALL')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedFolderId === 'ALL'
              ? 'bg-teal-50 border-teal-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-teal-300'
          }`}
        >
          <Folder className="w-6 h-6 text-teal-600 mb-2" />
          <div className="font-bold text-xs text-slate-800">ທຸກໂຟນເດີ (All Folders)</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{archivedDocs.length} ເອກະສານ</div>
        </div>

        {folders.map(f => (
          <div
            key={f.id}
            onClick={() => setSelectedFolderId(f.id)}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedFolderId === f.id
                ? 'bg-teal-50 border-teal-500 shadow-sm'
                : 'bg-white border-slate-200 hover:border-teal-300'
            }`}
          >
            <Folder className="w-6 h-6 text-teal-600 mb-2" />
            <div className="font-bold text-xs text-slate-800 truncate">{f.nameLao}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">ປີ {f.year} • {f.departmentName.split(' ')[1] || f.departmentName}</div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາໃນຄັງ E-Storage..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          ພົບ {filtered.length} ເອກະສານ
        </div>
      </div>

      {/* Archived Document Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">ເລກທີເອກະສານ</th>
              <th className="py-3.5 px-4">ວັນທີສຳເລັດ</th>
              <th className="py-3.5 px-4">ເລື່ອງ / ຫົວຂໍ້</th>
              <th className="py-3.5 px-4">ສາຍເອກະສານ</th>
              <th className="py-3.5 px-4">ຈຳນວນລາຍເຊັນ</th>
              <th className="py-3.5 px-4 text-right">ຈັດການ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  ບໍ່ພົບເອກະສານໃນຄັງເກັບມ້ຽນ
                </td>
              </tr>
            ) : (
              filtered.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {d.documentNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {d.completedAt ? new Date(d.completedAt).toLocaleDateString('lo-LA') : d.documentDate}
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="font-semibold text-slate-800 truncate">{d.subject}</div>
                    <div className="text-[10px] text-slate-400">{d.documentType} • {d.departmentName}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.direction === 'INCOMING' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {d.direction === 'INCOMING' ? 'ຂາເຂົ້າ' : 'ຂາອອກ'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {d.signatures.length} ລາຍເຊັນຢັ້ງຢືນ
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => onOpenDocument(d.id)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-teal-600 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      ເປີດອ່ານ
                    </button>
                    <button
                      onClick={() => alert.fire({ type: 'info', title: 'ດາວໂຫຼດ E-Archive', text: `ດາວໂຫຼດເອກະສານ ${d.documentNumber} ສຳເລັດ` })}
                      className="p-1 text-slate-500 hover:text-teal-600 rounded cursor-pointer"
                    >
                      <Download className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
