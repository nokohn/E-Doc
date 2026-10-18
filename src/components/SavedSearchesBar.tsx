import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  BookmarkPlus,
  Bell,
  BellOff,
  X,
  Check,
  Sparkles,
  Trash2,
  Filter,
  RotateCcw,
} from 'lucide-react';
import {
  User,
  DocumentTypeDirection,
  DocumentPriority,
  SavedSearchItem,
  SavedSearchCriteria,
} from '../types';
import { documentStore } from '../services/store';
import { useAlert } from './SweetAlertModal';

interface SavedSearchesBarProps {
  currentUser: User;
  direction: DocumentTypeDirection;
  currentQuery: string;
  currentCategory: string;
  currentPriority: 'ALL' | DocumentPriority;
  currentStatus: 'ALL' | 'PENDING' | 'RETURNED' | 'COMPLETED';
  onApplyCriteria: (criteria: SavedSearchCriteria) => void;
  onResetFilters: () => void;
  onOpenDocument?: (docId: string) => void;
}

export const SavedSearchesBar: React.FC<SavedSearchesBarProps> = ({
  currentUser,
  direction,
  currentQuery,
  currentCategory,
  currentPriority,
  currentStatus,
  onApplyCriteria,
  onResetFilters,
  onOpenDocument,
}) => {
  const alert = useAlert();
  const [savedSearches, setSavedSearches] = useState<SavedSearchItem[]>([]);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Saved Search Form State
  const [searchName, setSearchName] = useState('');
  const [formQuery, setFormQuery] = useState(currentQuery);
  const [formCategory, setFormCategory] = useState(currentCategory || 'ALL');
  const [formPriority, setFormPriority] = useState<'ALL' | DocumentPriority>(currentPriority);
  const [formStatus, setFormStatus] = useState<'ALL' | 'PENDING' | 'RETURNED' | 'COMPLETED'>(
    currentStatus
  );
  const [notifyOnMatch, setNotifyOnMatch] = useState(true);

  useEffect(() => {
    const update = () => {
      setSavedSearches(documentStore.getSavedSearches(direction));
    };
    update();
    const unsub = documentStore.subscribe(update);
    return () => unsub();
  }, [direction]);

  const handleOpenSaveModal = () => {
    setFormQuery(currentQuery);
    setFormCategory(currentCategory || 'ALL');
    setFormPriority(currentPriority);
    setFormStatus(currentStatus);
    setNotifyOnMatch(true);

    // Suggest a descriptive name based on current filters
    const parts: string[] = [];
    if (currentCategory && currentCategory !== 'ALL') parts.push(currentCategory);
    if (currentPriority !== 'ALL') {
      parts.push(
        currentPriority === 'URGENT'
          ? 'ດ່ວນທີ່ສຸດ'
          : currentPriority === 'HIGH'
          ? 'ຄວາມດ່ວນສູງ'
          : currentPriority === 'LOW'
          ? 'ຄວາມດ່ວນຕ່ຳ'
          : 'ປານກາງ'
      );
    }
    if (currentQuery.trim()) parts.push(`"${currentQuery.trim()}"`);
    if (currentStatus !== 'ALL') {
      parts.push(
        currentStatus === 'PENDING'
          ? 'ກຳລັງດຳເນີນການ'
          : currentStatus === 'RETURNED'
          ? 'ສົ່ງຄືນ'
          : 'ສຳເລັດ'
      );
    }
    setSearchName(
      parts.length > 0
        ? parts.join(' • ')
        : `ການຄົ້ນຫາ${direction === 'INCOMING' ? 'ຂາເຂົ້າ' : 'ຂາອອກ'}ໃໝ່`
    );
    setShowCreateModal(true);
  };

  const handleCreateSavedSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) return;

    const created = documentStore.addSavedSearch(currentUser, {
      name: searchName.trim(),
      criteria: {
        direction,
        query: formQuery.trim(),
        category: formCategory,
        priority: formPriority,
        status: formStatus,
      },
      notifyOnMatch,
    });

    setShowCreateModal(false);
    setActiveSavedId(created.id);
    onApplyCriteria(created.criteria);

    await alert.fire({
      type: 'success',
      title: 'ບັນທຶກການຄົ້ນຫາສຳເລັດ (Saved Search)',
      text: notifyOnMatch
        ? `ບັນທຶກ "${created.name}" ແລ້ວ • ລະບົບຈະແຈ້ງເຕືອນອັດຕະໂນມັດເມື່ອມີເອກະສານໃໝ່ທີ່ກົງກັບເງື່ອນໄຂນີ້`
        : `ບັນທຶກ "${created.name}" ສຳລັບການຄົ້ນຫາດ່ວນຮຽບຮ້ອຍແລ້ວ`,
    });
  };

  const handleSelectSavedSearch = (item: SavedSearchItem) => {
    if (activeSavedId === item.id) {
      setActiveSavedId(null);
      onResetFilters();
    } else {
      setActiveSavedId(item.id);
      onApplyCriteria(item.criteria);
    }
  };

  const handleToggleNotify = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    documentStore.toggleSavedSearchNotification(id);
  };

  const handleDeleteSavedSearch = async (item: SavedSearchItem, e: React.MouseEvent) => {
    e.stopPropagation();
    documentStore.deleteSavedSearch(item.id);
    if (activeSavedId === item.id) {
      setActiveSavedId(null);
      onResetFilters();
    }
  };

  const formatCriteriaSummary = (c: SavedSearchCriteria) => {
    const tags: string[] = [];
    if (c.category && c.category !== 'ALL') tags.push(c.category);
    if (c.priority && c.priority !== 'ALL') {
      tags.push(
        c.priority === 'URGENT'
          ? '🚨 ດ່ວນທີ່ສຸດ'
          : c.priority === 'HIGH'
          ? '🟠 ສູງ'
          : c.priority === 'LOW'
          ? '🟢 ຕ່ຳ'
          : '🔵 ປານກາງ'
      );
    }
    if (c.query && c.query.trim()) tags.push(`ຄຳຄົ້ນ: "${c.query}"`);
    if (c.status && c.status !== 'ALL') {
      tags.push(
        c.status === 'PENDING'
          ? 'ກຳລັງດຳເນີນການ'
          : c.status === 'RETURNED'
          ? 'ສົ່ງຄືນ'
          : 'ສຳເລັດ'
      );
    }
    return tags.length > 0 ? tags.join(' • ') : 'ທຸກເອກະສານ';
  };

  const accentColor = direction === 'INCOMING' ? 'blue' : 'emerald';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              accentColor === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800">
                ການຄົ້ນຫາທີ່ບັນທຶກໄວ້ & ແຈ້ງເຕືອນອັດຕະໂນມັດ (Saved Searches)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
                {savedSearches.length} ລາຍການ
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ຄລິກເພື່ອກັ່ນຕອງເອກະສານດ່ວນ ຫຼື ເປີດກະດິ່ງ 🔔 ເພື່ອຮັບແຈ້ງເຕືອນເມື່ອມີເອກະສານໃໝ່ທີ່ກົງເງື່ອນໄຂ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeSavedId && (
            <button
              type="button"
              onClick={() => {
                setActiveSavedId(null);
                onResetFilters();
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ລ້າງຕົວກອງ</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>ບັນທຶກການຄົ້ນຫານີ້</span>
          </button>
        </div>
      </div>

      {/* Saved Search Pills List */}
      {savedSearches.length === 0 ? (
        <div className="text-xs text-slate-400 bg-slate-50/70 rounded-xl p-3 text-center border border-dashed border-slate-200">
          ຍັງບໍ່ມີລາຍການຄົ້ນຫາທີ່ບັນທຶກໄວ້ • ກົດປຸ່ມ "ບັນທຶກການຄົ້ນຫານີ້" ເພື່ອສ້າງຕົວກອງອັດຕະໂນມັດ
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {savedSearches.map((item) => {
            const isSelected = activeSavedId === item.id;
            const matchCount = documentStore.getMatchingDocumentCount(item.criteria);
            return (
              <div
                key={item.id}
                onClick={() => handleSelectSavedSearch(item)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50/80 hover:bg-indigo-50/60 text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{item.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {matchCount}
                    </span>
                  </div>
                  <div
                    className={`text-[10px] ${
                      isSelected ? 'text-indigo-100' : 'text-slate-400'
                    }`}
                  >
                    {formatCriteriaSummary(item.criteria)}
                  </div>
                </div>

                {/* Latest matched document quick badge */}
                {item.lastMatchedDocNumber && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.lastMatchedDocId && onOpenDocument) {
                        onOpenDocument(item.lastMatchedDocId);
                      }
                    }}
                    title="ເປີດເອກະສານລ່າສຸດທີ່ກົງກັບເງື່ອນໄຂນີ້"
                    className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                      isSelected
                        ? 'bg-white/20 text-white hover:bg-white/30'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>ລ່າສຸດ: {item.lastMatchedDocNumber}</span>
                  </button>
                )}

                {/* Notification Bell Toggle */}
                <button
                  type="button"
                  onClick={(e) => handleToggleNotify(item.id, e)}
                  title={
                    item.notifyOnMatch
                      ? 'ກຳລັງເປີດຮັບແຈ້ງເຕືອນອັດຕະໂນມັດ (ຄລິກເພື່ອປິດ)'
                      : 'ປິດການແຈ້ງເຕືອນຢູ່ (ຄລິກເພື່ອເປີດຮັບແຈ້ງເຕືອນເມື່ອມີເອກະສານໃໝ່)'
                  }
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    isSelected
                      ? 'hover:bg-white/20 text-white'
                      : item.notifyOnMatch
                      ? 'bg-amber-100/80 text-amber-700 hover:bg-amber-200'
                      : 'text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {item.notifyOnMatch ? (
                    <Bell className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <BellOff className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Delete Saved Search */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteSavedSearch(item, e)}
                  title="ລຶບລາຍການຄົ້ນຫານີ້"
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    isSelected
                      ? 'hover:bg-white/20 text-indigo-100 hover:text-white'
                      : 'text-slate-400 hover:bg-rose-100 hover:text-rose-600'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Save Search Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <BookmarkPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">ບັນທຶກເງື່ອນໄຂການຄົ້ນຫາ (Save Search)</h3>
                  <p className="text-[11px] text-slate-400">
                    ບັນທຶກຕົວກອງເພື່ອໃຊ້ຊ້ຳ ແລະ ຮັບການແຈ້ງເຕືອນເມື່ອມີເອກະສານໃໝ່
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSavedSearch} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ຊື່ລາຍການຄົ້ນຫາ (Saved Search Name) *
                </label>
                <input
                  type="text"
                  required
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="ຕົວຢ່າງ: ແຈ້ງການດ່ວນ ກະຊວງການເງິນ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ຄຳຄົ້ນຫາ (Keyword / ເລກທີ / ຜູ້ສົ່ງ-ຜູ້ຮັບ):
                </label>
                <input
                  type="text"
                  value={formQuery}
                  onChange={(e) => setFormQuery(e.target.value)}
                  placeholder="ປ່ອຍວ່າງໄວ້ຖ້າບໍ່ລະບຸຄຳຄົ້ນ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ໝວດເອກະສານ:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="ALL">ທຸກໝວດເອກະສານ (All)</option>
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
                  <label className="block font-semibold text-slate-700 mb-1">ລະດັບຄວາມດ່ວນ:</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="ALL">ທຸກລະດັບ (All)</option>
                    <option value="URGENT">🚨 ດ່ວນທີ່ສຸດ (Urgent)</option>
                    <option value="HIGH">🟠 ສູງ (High)</option>
                    <option value="MEDIUM">🔵 ປານກາງ (Medium)</option>
                    <option value="LOW">🟢 ຕ່ຳ (Low)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ສະຖານະເອກະສານ:</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="ALL">ທຸກສະຖານະ (All Statuses)</option>
                  <option value="PENDING">ກຳລັງດຳເນີນການ (Pending)</option>
                  <option value="RETURNED">ສົ່ງຄືນ / ຕີກັບ (Returned)</option>
                  <option value="COMPLETED">ສຳເລັດແລ້ວ (Completed)</option>
                </select>
              </div>

              {/* Notification Toggle */}
              <div
                onClick={() => setNotifyOnMatch(!notifyOnMatch)}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                  notifyOnMatch
                    ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={notifyOnMatch}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-indigo-600"
                />
                <div className="flex-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>ແຈ້ງເຕືອນອັດຕະໂນມັດເມື່ອມີເອກະສານໃໝ່ (Auto-Notify)</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    ລະບົບຈະສົ່ງແຈ້ງເຕືອນທັນທີເມື່ອມີການລົງທະບຽນເອກະສານໃໝ່ທີ່ກົງກັບເງື່ອນໄຂນີ້
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>ບັນທຶກການຄົ້ນຫາ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
