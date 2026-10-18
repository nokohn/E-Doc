import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Send,
  GitBranch,
  PenTool,
  Archive,
  BarChart3,
  Users,
  ShieldAlert,
  Settings,
  PlusCircle,
  FileCheck,
} from 'lucide-react';
import { User } from '../types';
import { LHSELogo } from './LHSELogo';

export type NavTab =
  | 'dashboard'
  | 'incoming'
  | 'outgoing'
  | 'workflow'
  | 'esignature'
  | 'estorage'
  | 'reports'
  | 'admin'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentUser: User;
  onNewIncoming: () => void;
  onNewOutgoing: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onNewIncoming,
  onNewOutgoing,
}) => {
  const navItems: { id: NavTab; labelLao: string; labelEn: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'dashboard', labelLao: 'Dashboard (ພາບລວມ)', labelEn: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'incoming', labelLao: 'ເອກະສານຂາເຂົ້າ', labelEn: 'Incoming Docs', icon: <Inbox className="w-5 h-5" /> },
    { id: 'outgoing', labelLao: 'ເອກະສານຂາອອກ', labelEn: 'Outgoing Docs', icon: <Send className="w-5 h-5" /> },
    { id: 'workflow', labelLao: 'Workflow ວຽກຂອງຂ້ອຍ', labelEn: 'My Tasks & Workflow', icon: <GitBranch className="w-5 h-5" /> },
    { id: 'esignature', labelLao: 'E-Signature ລາຍເຊັນດິຈິທັລ', labelEn: 'Digital Signatures', icon: <PenTool className="w-5 h-5" /> },
    { id: 'estorage', labelLao: 'E-Storage ຄັງເກັບມ້ຽນ', labelEn: 'Digital Archive', icon: <Archive className="w-5 h-5" /> },
    { id: 'reports', labelLao: 'ລາຍງານ ແລະ ສະຖິຕິ', labelEn: 'Reports & Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'admin', labelLao: 'ຈັດການຜູ້ໃຊ້ & ອົງກອນ', labelEn: 'Users & Roles', icon: <Users className="w-5 h-5" />, adminOnly: true },
    { id: 'audit', labelLao: 'Audit Log ປະຫວັດຄວາມປອດໄພ', labelEn: 'Security Audit', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'settings', labelLao: 'ການຕັ້ງຄ່າລະບົບ', labelEn: 'System Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header with Official Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
        <div className="shrink-0 drop-shadow-sm hover:scale-105 transition-transform">
          <LHSELogo size={42} />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-white tracking-tight truncate">
            ລັດວິສາຫະກິດຖືຮຸ້ນລາວ
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
            <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded font-bold text-[9px] border border-rose-500/30">
              LHSE
            </span>
            <span>E-Document</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-4 space-y-2 border-b border-slate-800">
        <button
          onClick={onNewIncoming}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-900/30 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>ລົງທະບຽນຂາເຂົ້າໃໝ່</span>
        </button>
        <button
          onClick={onNewOutgoing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>ສ້າງຮ່າງຂາອອກໃໝ່</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          ເມນູຫຼັກ (MAIN MENU)
        </div>
        {navItems.map((item) => {
          if (item.adminOnly && currentUser.role !== 'ADMIN') {
            return null;
          }

          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
              <div className="text-left flex-1 truncate">
                <div className="truncate">{item.labelLao}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <div className="text-[11px] text-slate-400 font-medium">ລະບົບເຊື່ອມຕໍ່ປົກກະຕິ (Online)</div>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          E-Document State Enterprise v2.4
        </div>
      </div>
    </aside>
  );
};
