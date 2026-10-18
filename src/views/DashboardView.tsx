import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PenTool,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Target,
  BarChart3,
  BellRing,
  Flame,
  Timer,
} from 'lucide-react';
import { DocumentRecord, User } from '../types';
import { documentStore } from '../services/store';

interface DashboardViewProps {
  currentUser: User;
  onOpenDocument: (documentId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export type UrgencyTier = 'CRITICAL' | 'HIGH' | 'APPROACHING';

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onOpenDocument,
  onNavigateTab,
}) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('MONTH');
  const [chartOrientation, setChartOrientation] = useState<'VERTICAL' | 'HORIZONTAL'>('VERTICAL');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | UrgencyTier>('ALL');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const update = () => setDocuments(documentStore.getDocuments());
    update();
    const unsub = documentStore.subscribe(update);
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const incomingDocs = documents.filter(d => d.direction === 'INCOMING');
  const outgoingDocs = documents.filter(d => d.direction === 'OUTGOING');
  const pendingDocs = documents.filter(d => d.status === 'IN_PROGRESS' || d.status === 'REGISTERED');
  const pendingSignatureDocs = documents.filter(d => {
    const curStep = d.workflowSteps.find(s => s.stepOrder === d.currentStepOrder);
    return curStep && (curStep.stepNameLao.includes('E-Signature') || curStep.stepNameLao.includes('ເຊັນ'));
  });
  const completedDocs = documents.filter(d => d.status === 'COMPLETED' || d.status === 'ARCHIVED');
  const urgentDocs = documents.filter(d => d.priority === 'URGENT' && d.status !== 'COMPLETED');

  // Tasks requiring the current user's role
  const myTasks = documents.filter(d => {
    const curStep = d.workflowSteps.find(s => s.stepOrder === d.currentStepOrder);
    if (!curStep) return false;
    if (currentUser.role === 'ADMIN') return d.status !== 'COMPLETED';
    return curStep.requiredRole === currentUser.role && d.status !== 'COMPLETED';
  });

  // Compute documents with deadlines approaching within 48 hours
  const urgentDeadlineTasks = documents
    .filter(d => d.status !== 'COMPLETED' && d.status !== 'ARCHIVED' && d.dueDate)
    .map(doc => {
      const dueTime = new Date(doc.dueDate!).getTime();
      const diffMs = dueTime - nowMs;
      const hoursLeft = diffMs / (1000 * 60 * 60);
      let tier: UrgencyTier = 'APPROACHING';
      if (hoursLeft <= 6) {
        tier = 'CRITICAL';
      } else if (hoursLeft <= 24) {
        tier = 'HIGH';
      }
      return {
        doc,
        dueTime,
        diffMs,
        hoursLeft,
        tier,
      };
    })
    .filter(item => item.hoursLeft <= 48)
    .sort((a, b) => a.hoursLeft - b.hoursLeft);

  const filteredUrgentDeadlineTasks =
    urgencyFilter === 'ALL'
      ? urgentDeadlineTasks
      : urgentDeadlineTasks.filter(item => item.tier === urgencyFilter);

  const criticalCount = urgentDeadlineTasks.filter(i => i.tier === 'CRITICAL').length;
  const highUrgencyCount = urgentDeadlineTasks.filter(i => i.tier === 'HIGH').length;
  const approachingCount = urgentDeadlineTasks.filter(i => i.tier === 'APPROACHING').length;

  const formatRemainingTime = (diffMs: number) => {
    if (diffMs <= 0) {
      const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      const overdueMins = Math.abs(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
      return `ກາຍກຳນົດ ${overdueHours} ຊມ ${overdueMins} ນາທີ`;
    }
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `ເຫຼືອເວລາ ${hrs} ຊມ ${mins} ນາທີ`;
  };

  const metricChartData = [
    {
      id: 'incoming',
      shortLabel: 'ຂາເຂົ້າ',
      fullLabel: 'ເອກະສານຂາເຂົ້າ',
      count: incomingDocs.length,
      tab: 'incoming',
      icon: Inbox,
      barGradient: 'from-blue-600 to-blue-400',
      solidBg: 'bg-blue-600',
      softBg: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      iconGroupHover: 'group-hover:bg-blue-600 group-hover:text-white',
      hex: '#2563eb',
    },
    {
      id: 'outgoing',
      shortLabel: 'ຂາອອກ',
      fullLabel: 'ເອກະສານຂາອອກ',
      count: outgoingDocs.length,
      tab: 'outgoing',
      icon: Send,
      barGradient: 'from-emerald-600 to-emerald-400',
      solidBg: 'bg-emerald-600',
      softBg: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
      iconGroupHover: 'group-hover:bg-emerald-600 group-hover:text-white',
      hex: '#059669',
    },
    {
      id: 'pending',
      shortLabel: 'ລໍຖ້າ',
      fullLabel: 'ລໍຖ້າດຳເນີນການ',
      count: pendingDocs.length,
      tab: 'workflow',
      icon: Clock,
      barGradient: 'from-amber-500 to-amber-400',
      solidBg: 'bg-amber-500',
      softBg: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      hoverBorder: 'hover:border-amber-400',
      iconGroupHover: 'group-hover:bg-amber-600 group-hover:text-white',
      hex: '#d97706',
    },
    {
      id: 'esignature',
      shortLabel: 'ລໍຖ້າເຊັນ',
      fullLabel: 'ລໍຖ້າ E-Signature',
      count: pendingSignatureDocs.length,
      tab: 'esignature',
      icon: PenTool,
      barGradient: 'from-indigo-600 to-violet-400',
      solidBg: 'bg-indigo-600',
      softBg: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      hoverBorder: 'hover:border-indigo-400',
      iconGroupHover: 'group-hover:bg-indigo-600 group-hover:text-white',
      hex: '#4f46e5',
    },
    {
      id: 'completed',
      shortLabel: 'ສຳເລັດ',
      fullLabel: 'ເກັບເຂົ້າ E-Storage',
      count: completedDocs.length,
      tab: 'estorage',
      icon: CheckCircle2,
      barGradient: 'from-teal-600 to-teal-400',
      solidBg: 'bg-teal-600',
      softBg: 'bg-teal-50',
      textColor: 'text-teal-600',
      borderColor: 'border-teal-200',
      hoverBorder: 'hover:border-teal-400',
      iconGroupHover: 'group-hover:bg-teal-600 group-hover:text-white',
      hex: '#0d9488',
    },
    {
      id: 'urgent',
      shortLabel: 'ດ່ວນ',
      fullLabel: 'ດ່ວນທີ່ສຸດ',
      count: urgentDocs.length,
      tab: 'incoming',
      icon: AlertTriangle,
      barGradient: 'from-rose-600 to-rose-400',
      solidBg: 'bg-rose-600',
      softBg: 'bg-rose-50',
      textColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      hoverBorder: 'hover:border-rose-400',
      iconGroupHover: 'group-hover:bg-rose-600 group-hover:text-white',
      hex: '#e11d48',
    },
  ];

  const maxCount = Math.max(...metricChartData.map(m => m.count), 1);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">ສະຖິຕິ ແລະ ພາບລວມ (Overview)</h2>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {(['TODAY', 'WEEK', 'MONTH', 'YEAR'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filterPeriod === p ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              {p === 'TODAY' ? 'ມື້ນີ້' : p === 'WEEK' ? 'ອາທິດນີ້' : p === 'MONTH' ? 'ເດືອນນີ້' : 'ປີນີ້'}
            </button>
          ))}
        </div>
      </div>

      {/* SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {metricChartData.map(item => {
          const IconComponent = item.icon;
          const pct = Math.round((item.count / maxCount) * 100);
          return (
            <div
              key={item.id}
              onClick={() => onNavigateTab(item.tab)}
              className={`bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs ${item.hoverBorder} hover:shadow-md transition cursor-pointer group relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${item.softBg} ${item.textColor} ${item.iconGroupHover} transition`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.softBg} ${item.textColor}`}>
                  {item.shortLabel}
                </span>
              </div>
              <div className={`text-2xl font-bold ${item.id === 'urgent' ? 'text-rose-600' : 'text-slate-900'}`}>
                {item.count}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{item.fullLabel}</div>
              {/* Mini color bar at bottom of card */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${item.barGradient} transition-all duration-500`}
                  style={{ width: `${Math.max(pct, 10)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* MULTI-COLOR BAR CHART SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 lg:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                ແຜນວາດແທ່ງສະຖິຕິເອກະສານແຕ່ລະລາຍການ (Document Status Bar Chart)
              </h3>
              <p className="text-[11px] text-slate-400">
                ປຽບທຽບຈຳນວນເອກະສານທັງ 6 ໝວດໝູ່ ແຍກຕາມສີສະຖານະ (ຄລິກໃສ່ແທ່ງກຣາຟເພື່ອເບິ່ງລາຍລະອຽດ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-semibold text-slate-600">
              <button
                onClick={() => setChartOrientation('VERTICAL')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartOrientation === 'VERTICAL' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                ກຣາຟແນວຕັ້ງ
              </button>
              <button
                onClick={() => setChartOrientation('HORIZONTAL')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartOrientation === 'HORIZONTAL' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                ກຣາຟແນວນອນ
              </button>
            </div>
          </div>
        </div>

        {chartOrientation === 'VERTICAL' ? (
          <div className="pt-4">
            {/* Vertical Column Bar Chart */}
            <div className="relative h-64 flex items-end justify-around gap-3 sm:gap-6 px-2 sm:px-6 pt-8 pb-2 border-b border-slate-200 bg-slate-50/40 rounded-t-xl">
              {/* Horizontal Reference Grid Lines */}
              <div className="absolute inset-x-0 top-8 bottom-2 flex flex-col justify-between pointer-events-none px-4">
                {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
                  <div key={idx} className="w-full border-b border-dashed border-slate-200/80 flex items-center">
                    <span className="text-[10px] font-mono text-slate-400 -mt-4 bg-white/80 px-1 rounded">
                      {Math.round(maxCount * ratio)}
                    </span>
                  </div>
                ))}
              </div>

              {metricChartData.map(item => {
                const heightPercent = Math.max(Math.round((item.count / maxCount) * 100), 8);
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigateTab(item.tab)}
                    className="relative z-10 flex-1 max-w-[96px] h-full flex flex-col items-center justify-end group cursor-pointer"
                  >
                    {/* Count badge above bar */}
                    <div
                      className={`mb-2 px-2.5 py-0.5 rounded-full text-xs font-extrabold shadow-xs border ${item.softBg} ${item.textColor} ${item.borderColor} group-hover:scale-110 transition-transform`}
                    >
                      {item.count}
                    </div>

                    {/* Colored Bar */}
                    <div className="w-full px-1 sm:px-2 flex items-end justify-center h-[175px]">
                      <div
                        className={`w-full rounded-t-xl bg-gradient-to-t ${item.barGradient} shadow-sm group-hover:brightness-110 group-hover:shadow-md transition-all duration-500 relative flex items-start justify-center pt-2`}
                        style={{ height: `${heightPercent}%` }}
                      >
                        <IconComponent className="w-4 h-4 text-white/90 hidden sm:block" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex items-start justify-around gap-3 sm:gap-6 px-2 sm:px-6 pt-3">
              {metricChartData.map(item => (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab(item.tab)}
                  className="flex-1 max-w-[96px] text-center cursor-pointer group"
                >
                  <div className="inline-flex items-center gap-1.5 justify-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.solidBg} shrink-0`} />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                      {item.shortLabel}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.fullLabel}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Horizontal Bar Chart */
          <div className="space-y-3.5 pt-2">
            {metricChartData.map(item => {
              const widthPercent = Math.max(Math.round((item.count / maxCount) * 100), 6);
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab(item.tab)}
                  className="group cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${item.softBg} ${item.textColor}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-bold text-slate-800">{item.shortLabel}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{item.fullLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-xs ${item.softBg} ${item.textColor}`}>
                        {item.count} ລາຍການ
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.barGradient} transition-all duration-500`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Color Legend Pills */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            {metricChartData.map(item => (
              <div
                key={item.id}
                onClick={() => onNavigateTab(item.tab)}
                className="flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 cursor-pointer transition"
              >
                <span className={`w-2.5 h-2.5 rounded-sm ${item.solidBg}`} />
                <span className="text-slate-600 font-medium">{item.fullLabel}:</span>
                <span className={`font-bold ${item.textColor}`}>{item.count}</span>
              </div>
            ))}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            ເອກະສານທັງໝົດໃນລະບົບ: <strong className="text-slate-700">{documents.length} ສະບັບ</strong>
          </span>
        </div>
      </div>

      {/* URGENT TASKS NOTIFICATION WIDGET (DEADLINES WITHIN 48 HOURS) */}
      <div className="bg-white rounded-2xl border border-rose-200/80 shadow-sm overflow-hidden">
        {/* Widget Header */}
        <div className="bg-gradient-to-r from-rose-50 via-orange-50/60 to-amber-50/40 px-5 py-4 border-b border-rose-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-rose-600 text-white shadow-sm shrink-0">
              <BellRing className="w-5 h-5" />
              {urgentDeadlineTasks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-white animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  ແຈ້ງເຕືອນວຽກດ່ວນ ໃກ້ຮອດກຳນົດພາຍໃນ 48 ຊົ່ວໂມງ (Urgent Tasks Notification)
                </h3>
                <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-rose-600 text-white">
                  {urgentDeadlineTasks.length} ລາຍການ
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                ຕິດຕາມເອກະສານທີ່ມີກຳນົດເວລາສຳເລັດ (SLA Deadline) ພາຍໃນ 48 ຊົ່ວໂມງ ແຍກຕາມລະດັບສີຄວາມຮີບດ່ວນ
              </p>
            </div>
          </div>

          {/* Color-coded Urgency Level Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setUrgencyFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                urgencyFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ທັງໝົດ ({urgentDeadlineTasks.length})
            </button>
            <button
              onClick={() => setUrgencyFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                urgencyFilter === 'CRITICAL'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>ວິກິດ ≤ 6 ຊມ ({criticalCount})</span>
            </button>
            <button
              onClick={() => setUrgencyFilter('HIGH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                urgencyFilter === 'HIGH'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                  : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>ດ່ວນຫຼາຍ 6–24 ຊມ ({highUrgencyCount})</span>
            </button>
            <button
              onClick={() => setUrgencyFilter('APPROACHING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                urgencyFilter === 'APPROACHING'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>ເຝົ້າລະວັງ 24–48 ຊມ ({approachingCount})</span>
            </button>
          </div>
        </div>

        {/* Urgent Tasks Cards List */}
        <div className="p-4 sm:p-5">
          {filteredUrgentDeadlineTasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">ບໍ່ມີເອກະສານໃກ້ຮອດກຳນົດໃນລະດັບນີ້</p>
              <p className="text-xs text-slate-400 mt-0.5">ເອກະສານທັງໝົດຢູ່ໃນເກນເວລາປົກກະຕິ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredUrgentDeadlineTasks.map(({ doc, diffMs, hoursLeft, tier }) => {
                const currentStep = doc.workflowSteps.find(s => s.stepOrder === doc.currentStepOrder);
                // Urgency level styling
                const tierStyles =
                  tier === 'CRITICAL'
                    ? {
                        cardBg: 'bg-rose-50/50 hover:bg-rose-50/90 border-rose-200 hover:border-rose-400',
                        accentBar: 'bg-rose-600',
                        badgeBg: 'bg-rose-600 text-white',
                        timeBadge: 'bg-rose-100 text-rose-800 border-rose-300',
                        progressFill: 'bg-gradient-to-r from-rose-600 to-red-500',
                        btnStyle: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
                        levelLabel: 'ວິກິດ (≤ 6 ຊມ)',
                      }
                    : tier === 'HIGH'
                    ? {
                        cardBg: 'bg-orange-50/40 hover:bg-orange-50/80 border-orange-200 hover:border-orange-400',
                        accentBar: 'bg-orange-500',
                        badgeBg: 'bg-orange-500 text-white',
                        timeBadge: 'bg-orange-100 text-orange-800 border-orange-300',
                        progressFill: 'bg-gradient-to-r from-orange-500 to-amber-500',
                        btnStyle: 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs',
                        levelLabel: 'ດ່ວນຫຼາຍ (6–24 ຊມ)',
                      }
                    : {
                        cardBg: 'bg-amber-50/35 hover:bg-amber-50/75 border-amber-200 hover:border-amber-400',
                        accentBar: 'bg-amber-500',
                        badgeBg: 'bg-amber-500 text-white',
                        timeBadge: 'bg-amber-100 text-amber-800 border-amber-300',
                        progressFill: 'bg-gradient-to-r from-amber-500 to-yellow-400',
                        btnStyle: 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs',
                        levelLabel: 'ເຝົ້າລະວັງ (24–48 ຊມ)',
                      };

                // Progress percentage of 48h window consumed (closer to 0h left = closer to 100% urgent bar)
                const urgencyProgressPct = Math.min(
                  100,
                  Math.max(12, Math.round(((48 - Math.max(0, hoursLeft)) / 48) * 100))
                );

                return (
                  <div
                    key={doc.id}
                    onClick={() => onOpenDocument(doc.id)}
                    className={`relative rounded-xl border p-4 transition cursor-pointer group overflow-hidden ${tierStyles.cardBg}`}
                  >
                    {/* Left Color-Coded Urgency Strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${tierStyles.accentBar}`} />

                    <div className="pl-2 space-y-2.5">
                      {/* Top row: Urgency level badge + Document Number + Remaining Time Countdown */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${tierStyles.badgeBg}`}
                          >
                            <Flame className="w-3 h-3" />
                            <span>{tierStyles.levelLabel}</span>
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {doc.documentNumber}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              doc.direction === 'INCOMING'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {doc.direction === 'INCOMING' ? 'ຂາເຂົ້າ' : 'ຂາອອກ'}
                          </span>
                        </div>

                        <div
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${tierStyles.timeBadge}`}
                        >
                          <Timer className="w-3.5 h-3.5" />
                          <span>{formatRemainingTime(diffMs)}</span>
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition line-clamp-1">
                        {doc.subject}
                      </div>

                      {/* 48h Urgency Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-white/90 h-2 rounded-full overflow-hidden border border-slate-200/70">
                          <div
                            className={`h-full rounded-full ${tierStyles.progressFill} transition-all duration-500`}
                            style={{ width: `${urgencyProgressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom row: Current Workflow Step & Quick Action Button */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="text-[11px] text-slate-600 truncate">
                          <span className="font-semibold text-slate-700">ຂັ້ນຕອນປັດຈຸບັນ:</span>{' '}
                          <span>{currentStep?.stepNameLao || `ຂັ້ນຕອນທີ ${doc.currentStepOrder}`}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDocument(doc.id);
                          }}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${tierStyles.btnStyle}`}
                        >
                          <span>ດຳເນີນການດ່ວນ</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Pending Tasks vs Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Actionable Tasks For Current User Role */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-sm">
                ລາຍການທີ່ຕ້ອງດຳເນີນການໃນບົດບາດຂອງທ່ານ ({currentUser.positionLao})
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {myTasks.length} ລາຍການລໍຖ້າ
            </span>
          </div>

          {myTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50/60 rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-700">ບໍ່ມີວຽກຄ້າງໃນບົດບາດຂອງທ່ານໃນຕອນນີ້</p>
              <p className="text-xs text-slate-400 mt-0.5">
                ທ່ານສາມາດໃຊ້ Role Switcher ດ້ານເທິງເພື່ອທົດສອບບົດບາດອື່ນ (ເຊັ່ນ: ຫົວໜ້າພະແນກ, ຮອງຫົວໜ້າພະແນກ, ຜູ້ອຳນວຍການ)
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myTasks.map((d) => {
                const currentStep = d.workflowSteps.find(s => s.stepOrder === d.currentStepOrder);
                return (
                  <div
                    key={d.id}
                    onClick={() => onOpenDocument(d.id)}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition cursor-pointer group"
                  >
                    <div className="space-y-1 flex-1 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          d.direction === 'INCOMING' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {d.direction === 'INCOMING' ? 'ຂາເຂົ້າ' : 'ຂາອອກ'}
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-800">{d.documentNumber}</span>
                        {d.priority === 'URGENT' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded border border-rose-200">
                            🚨 ດ່ວນທີ່ສຸດ
                          </span>
                        ) : d.priority === 'HIGH' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded border border-amber-200">
                            🟠 ສູງ
                          </span>
                        ) : d.priority === 'LOW' ? (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                            🟢 ຕ່ຳ
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200">
                            🔵 ປານກາງ
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200/60">
                          <Target className="w-2.5 h-2.5 text-indigo-600" />
                          <span>{d.purpose === 'RESEARCH' ? '🔍 ເພື່ອຄົ້ນຄວ້າ' : d.purpose === 'INFORM' ? '📢 ເພື່ອຮັບຊາບ' : '📌 ອື່ນໆ'}</span>
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition truncate">
                        {d.subject}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>ຂັ້ນຕອນທີ {d.currentStepOrder}: {currentStep?.stepNameLao}</span>
                        <span>•</span>
                        <span>{d.documentDate}</span>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 shrink-0">
                      <span>ດຳເນີນການ</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right (1 col): System Workflow & Analytics Quick Peek */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">ສັດສ່ວນເອກະສານຕາມສະຖານະ</h3>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          {/* All 6 Statuses with Distinct Colored Bars */}
          <div className="space-y-3 pt-1">
            {metricChartData.map(item => (
              <div key={item.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.solidBg}`} />
                    {item.shortLabel} ({item.fullLabel})
                  </span>
                  <span className={`font-bold ${item.textColor}`}>{item.count}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${item.solidBg} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max((item.count / maxCount) * 100, 6)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              E-Signature Verification
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-indigo-900">ໃບຢັ້ງຢືນດິຈິທັລກວດສອບໄດ້</div>
                <div className="text-indigo-700 text-[11px]">ທຸກລາຍເຊັນມີລະຫັດ LA-SIG ປ້ອງກັນການປອມແປງ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

