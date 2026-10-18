import React, { useState, createContext, useContext } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle } from 'lucide-react';
import { SweetAlertOptions } from '../types';

interface AlertContextType {
  fire: (options: SweetAlertOptions) => Promise<{ isConfirmed: boolean; value?: string }>;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const SweetAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: SweetAlertOptions;
    resolve?: (result: { isConfirmed: boolean; value?: string }) => void;
  }>({
    isOpen: false,
    options: { type: 'info', title: '', text: '' },
  });

  const [reasonInput, setReasonInput] = useState('');
  const [reasonError, setReasonError] = useState('');

  const fire = (options: SweetAlertOptions): Promise<{ isConfirmed: boolean; value?: string }> => {
    setReasonInput('');
    setReasonError('');
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    if (modalState.options.requireReason && !reasonInput.trim()) {
      setReasonError('ກະລຸນາລະບຸເຫດຜົນຢ່າງຊັດເຈນ');
      return;
    }

    modalState.resolve?.({ isConfirmed: true, value: reasonInput.trim() });
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    modalState.resolve?.({ isConfirmed: false });
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const { options, isOpen } = modalState;

  return (
    <AlertContext.Provider value={{ fire }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center transform transition-all border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Icon Banner */}
            <div className="mx-auto flex items-center justify-center mb-4">
              {options.type === 'success' && (
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce duration-700">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              )}
              {options.type === 'error' && (
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 animate-pulse">
                  <XCircle className="w-10 h-10" />
                </div>
              )}
              {options.type === 'warning' && (
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              )}
              {options.type === 'approval' && (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <HelpCircle className="w-10 h-10" />
                </div>
              )}
              {options.type === 'reject' && (
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              )}
              {options.type === 'info' && (
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Info className="w-10 h-10" />
                </div>
              )}
            </div>

            {/* Title & Description */}
            <h3 className="text-xl font-bold text-slate-800 mb-2">{options.title}</h3>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">{options.text}</p>

            {/* Input if Reject or requireReason */}
            {options.requireReason && (
              <div className="mb-5 text-left">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ເຫດຜົນໃນການຕີກັບ / ສົ່ງຄືນ <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reasonInput}
                  onChange={(e) => {
                    setReasonInput(e.target.value);
                    if (reasonError) setReasonError('');
                  }}
                  placeholder={options.reasonPlaceholder || 'ປ້ອນເຫດຜົນລະອຽດ ເພື່ອແຈ້ງໃຫ້ຜູ້ຮັບຜິດຊອບແກ້ໄຂ...'}
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                    reasonError ? 'border-red-400 bg-red-50/50' : 'border-slate-300'
                  }`}
                  autoFocus
                />
                {reasonError && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{reasonError}</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3">
              {(options.showCancelButton ?? (options.type === 'approval' || options.type === 'reject' || options.type === 'warning')) && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 cursor-pointer"
                >
                  {options.cancelButtonText || 'ຍົກເລີກ'}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition duration-150 cursor-pointer ${
                  options.type === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                    : options.type === 'error'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : options.type === 'approval'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                {options.confirmButtonText || (options.type === 'approval' ? 'ອະນຸມັດ' : options.type === 'reject' ? 'ຢືນຢັນຕີກັບ' : 'ຕົກລົງ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within a SweetAlertProvider');
  }
  return context;
};
