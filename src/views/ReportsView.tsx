import React, { useState } from 'react';
import { BarChart3, Download, Printer, FileSpreadsheet, FileText, Calendar, Filter } from 'lucide-react';
import { documentStore } from '../services/store';
import { useAlert } from '../components/SweetAlertModal';
import { LHSELogo } from '../components/LHSELogo';

export const ReportsView: React.FC = () => {
  const alert = useAlert();
  const [reportType, setReportType] = useState<'MONTHLY' | 'DEPT' | 'STATUS' | 'PERFORMANCE'>('MONTHLY');
  const documents = documentStore.getDocuments();

  const handleExportExcel = () => {
    alert.fire({
      type: 'success',
      title: 'Export Excel ສຳເລັດ',
      text: 'ລະບົບໄດ້ສ້າງໄຟລ໌ລາຍງານ E-Document_Report_2026.xlsx ຮຽບຮ້ອຍແລ້ວ',
    });
  };

  const handleExportPDF = () => {
    alert.fire({
      type: 'success',
      title: 'Export PDF ສຳເລັດ',
      text: 'ລະບົບໄດ້ສ້າງໄຟລ໌ PDF ບົດສະຫຼຸບທາງການສຳລັບຄະນະຜູ້ອຳນວຍການແລ້ວ',
    });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="shrink-0 drop-shadow-sm hover:scale-105 transition-transform p-1 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <LHSELogo size={44} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
                ລາຍງານ ແລະ ສະຖິຕິເອກະສານ (Reports & Analytics)
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 rounded border border-rose-200">
                LHSE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ສະຫຼຸບການໄຫຼວຽນຂອງເອກະສານຂາເຂົ້າ-ຂາອອກ ປະສິດທິພາບ Workflow ແລະ ການສົ່ງອອກຂໍ້ມູນ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        {[
          { id: 'MONTHLY', label: 'ສະຫຼຸບປະຈຳເດືອນ (Monthly)' },
          { id: 'DEPT', label: 'ແຍກຕາມພະແນກ (By Department)' },
          { id: 'STATUS', label: 'ແຍກຕາມສະຖານະ (By Status)' },
          { id: 'PERFORMANCE', label: 'ປະສິດທິພາບ Workflow (SLA)' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id as any)}
            className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              reportType === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">ເອກະສານທັງໝົດໃນລະບົບ</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{documents.length} ສະບັບ</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">✓ ບັນທຶກລະບົບດິຈິທັລ 100%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">ຂາເຂົ້າ ທຽບກັບ ຂາອອກ</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {documents.filter(d => d.direction === 'INCOMING').length} : {documents.filter(d => d.direction === 'OUTGOING').length}
          </div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">ອັດຕາສ່ວນການເຄື່ອນໄຫວ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">ເວລາສະເລ່ຍໃນການອະນຸມັດ</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">1.8 ມື້</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">⚡ ໄວກວ່າເປົ້າໝາຍ 30%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">ອັດຕາການເຊັນ E-Signature</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">94.2%</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">🔒 ຮັບຮອງໃບຢັ້ງຢືນ LA-SIG</div>
        </div>
      </div>

      {/* Visual Report Details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">
          ຕາຕະລາງລາຍລະອຽດການເຄື່ອນໄຫວເອກະສານ
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">ໝວດໝູ່ / ພະແນກ</th>
                <th className="py-3 px-4 text-center">ຂາເຂົ້າ</th>
                <th className="py-3 px-4 text-center">ຂາອອກ</th>
                <th className="py-3 px-4 text-center">ກຳລັງດຳເນີນການ</th>
                <th className="py-3 px-4 text-center">ສຳເລັດ</th>
                <th className="py-3 px-4 text-right">ອັດຕາສຳເລັດ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'ພະແນກ ບໍລິຫານ ແລະ ຈັດຕັ້ງ', in: 48, out: 32, pending: 8, done: 72, rate: '90%' },
                { name: 'ພະແນກ ການເງິນ ແລະ ບັນຊີ', in: 36, out: 24, pending: 5, done: 55, rate: '91%' },
                { name: 'ພະແນກ ແຜນການ ແລະ ການລົງທຶນ', in: 22, out: 18, pending: 4, done: 36, rate: '90%' },
                { name: 'ພະແນກ ເຕັກໂນໂລຊີຂໍ້ມູນຂ່າວສານ (IT)', in: 19, out: 15, pending: 2, done: 32, rate: '94%' },
                { name: 'ພະແນກ ກົດໝາຍ ແລະ ນິຕິກຳ', in: 17, out: 9, pending: 3, done: 23, rate: '88%' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-800">{row.name}</td>
                  <td className="py-3 px-4 text-center text-blue-600 font-semibold">{row.in}</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{row.out}</td>
                  <td className="py-3 px-4 text-center text-amber-600 font-semibold">{row.pending}</td>
                  <td className="py-3 px-4 text-center text-teal-600 font-semibold">{row.done}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
