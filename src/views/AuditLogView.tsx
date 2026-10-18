import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Lock, ShieldCheck, Download, AlertTriangle } from 'lucide-react';
import { AuditLogItem } from '../types';
import { documentStore } from '../services/store';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  useEffect(() => {
    const update = () => setLogs(documentStore.getAuditLogs());
    update();
    const unsub = documentStore.subscribe(update);
    return () => unsub();
  }, []);

  const filtered = logs.filter(l => {
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = (l.userName + l.details + (l.documentNumber || '') + l.action).toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
              Audit Log ປະຫວັດຄວາມປອດໄພ ແລະ ການເຄື່ອນໄຫວ
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ບັນທຶກທຸກການດຳເນີນງານແບບ Append-Only / Immutable Log ບໍ່ສາມາດດັດແກ້ ຫຼື ລຶບໄດ້
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-600 border border-slate-200">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>WORM Protected (Write Once, Read Many)</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ຄົ້ນຫາຜູ້ໃຊ້, ເລກທີເອກະສານ, ລາຍລະອຽດ..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'ALL', label: 'ທັງໝົດ' },
            { id: 'SIGN', label: 'E-Signature' },
            { id: 'COMMENT', label: '💬 ຄຳເຫັນ' },
            { id: 'FORWARD', label: 'ສົ່ງຕໍ່ / ອະນຸມັດ' },
            { id: 'RETURN', label: 'ສົ່ງຄືນ / ຕີກັບ' },
            { id: 'UNAUTHORIZED_ATTEMPT', label: '🚨 ຄວາມພະຍາຍາມລະເມີດສິດ' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActionFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                actionFilter === t.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">ວັນທີ & ເວລາ</th>
              <th className="py-3.5 px-4">ຜູ້ດຳເນີນການ</th>
              <th className="py-3.5 px-4">Action ທີ່ປະຕິບັດ</th>
              <th className="py-3.5 px-4">ເອກະສານ</th>
              <th className="py-3.5 px-4">ລາຍລະອຽດ</th>
              <th className="py-3.5 px-4 font-mono">IP & ອຸປະກອນ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  ບໍ່ພົບລາຍການ Audit Log ຕາມເງື່ອນໄຂ
                </td>
              </tr>
            ) : (
              filtered.map(l => {
                const isUnauthorized = l.action === 'UNAUTHORIZED_ATTEMPT';
                return (
                  <tr key={l.id} className={`hover:bg-slate-50 transition ${isUnauthorized ? 'bg-rose-50/40' : ''}`}>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString('lo-LA')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{l.userName}</div>
                      <div className="text-[10px] text-slate-400">{l.userPosition}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isUnauthorized
                          ? 'bg-rose-600 text-white'
                          : l.action === 'SIGN'
                          ? 'bg-indigo-100 text-indigo-800'
                          : l.action === 'COMMENT'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : l.action === 'APPROVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.action === 'RETURN'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {l.documentNumber || '-'}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-700">
                      <div>{l.details}</div>
                      {l.newValue && <div className="text-[10px] text-slate-400 mt-0.5">{l.newValue}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                      <div>{l.ipAddress}</div>
                      <div className="text-slate-400">{l.device}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
