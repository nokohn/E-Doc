import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Shield, ChevronDown, CheckCheck, FileText, ArrowRight, LogOut, Check, Mail, Globe, Copy, Cloud, X } from 'lucide-react';
import { User, UserRole, NotificationItem, EmailAlertRecord } from '../types';
import { AuthService, INITIAL_USERS } from '../services/auth';
import { documentStore } from '../services/store';
import { ROLE_HIERARCHY } from '../services/workflowAuthMiddleware';
import { LHSELogo } from './LHSELogo';
import { QRCodeGenerator } from './QRCodeGenerator';

const PERMANENT_APP_URL = 'https://ais-pre-dlbhbuxfeduv3tyaf7wmp3-966105322065.asia-southeast1.run.app';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onSearch: (query: string) => void;
  onOpenDocument: (documentId: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  onSearch,
  onOpenDocument,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [notifTab, setNotifTab] = useState<'NOTIFS' | 'EMAILS'>('NOTIFS');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [emailAlerts, setEmailAlerts] = useState<EmailAlertRecord[]>([]);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateNotifs = () => {
      setNotifications(documentStore.getNotifications(currentUser.id));
      setEmailAlerts(documentStore.getEmailAlerts());
    };
    updateNotifs();
    const unsub = documentStore.subscribe(updateNotifs);
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleUserSelect = (user: User) => {
    const updated = AuthService.switchUserById(user.id);
    onUserChange(updated);
    setShowRoleMenu(false);
  };

  const handleCopyPermanentUrl = async () => {
    try {
      await navigator.clipboard.writeText(PERMANENT_APP_URL);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const currentRoleMeta = ROLE_HIERARCHY[currentUser.role];

  return (
    <>
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: System branding & state enterprise seal */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 drop-shadow-sm hover:scale-105 transition-transform">
            <LHSELogo size={44} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-sm lg:text-base">
                ລະບົບຈັດການເອກະສານຂາເຂົ້າ–ຂາອອກ
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                LHSE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              ລັດວິສາຫະກິດຖືຮຸ້ນລາວ • Lao Holding State Enterprise
            </p>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-md mx-4 lg:mx-8 hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="ຄົ້ນຫາເລກທີເອກະສານ, ເລື່ອງ, ພະແນກ, ຫຼື ຜູ້ສົ່ງ..."
              className="w-full pl-10 pr-4 py-2 text-xs lg:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  onSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ລຶບ
              </button>
            )}
          </form>
        </div>

        {/* Right: 24/7 Cloud Online Badge, Notifications, Quick Role Switcher & User Profile */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* 24/7 Permanent Cloud Status Badge */}
          <button
            type="button"
            onClick={() => setShowCloudModal(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 transition cursor-pointer"
            title="ສະຖານະການ Deploy ຖາວອນ 24/7 (nokohn@mail.com)"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <div className="text-left leading-tight">
              <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-tight">
                ONLINE 24/7 • FREE CLOUD
              </div>
              <div className="text-[10px] font-mono font-semibold text-emerald-700">
                nokohn@mail.com
              </div>
            </div>
          </button>

          {/* Quick RBAC Role Switcher */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer text-left"
              title="ຄລິກເພື່ອທົດສອບສະຫຼັບບົດບາດ (Role Switcher)"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="hidden xl:block">
                <div className="text-[10px] text-slate-400 uppercase font-semibold leading-none">
                  ບົດບາດທົດສອບ (Role)
                </div>
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentRoleMeta.labelLao.split(' ')[0]}
                </div>
              </div>
              <span className={`xl:hidden text-xs font-bold px-2 py-0.5 rounded-md ${currentRoleMeta.color}`}>
                {currentUser.role}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role Switcher Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">ສະຫຼັບບົດບາດທົດສອບ (RBAC)</span>
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ເລືອກບົດບາດເພື່ອທົດສອບສິດການເຂົ້າເຖິງ ແລະ Workflow Guard
                  </p>
                </div>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {INITIAL_USERS.map((usr) => {
                    const isSelected = usr.id === currentUser.id;
                    return (
                      <button
                        key={usr.id}
                        onClick={() => handleUserSelect(usr)}
                        className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border border-indigo-200 text-indigo-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{usr.fullName}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <div className="text-[11px] text-slate-500">{usr.positionLao}</div>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-semibold rounded ${ROLE_HIERARCHY[usr.role].color}`}>
                            {usr.role}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNotifTab('NOTIFS')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        notifTab === 'NOTIFS'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>ການແຈ້ງເຕືອນ ({notifications.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifTab('EMAILS')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        notifTab === 'EMAILS'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Alerts ({emailAlerts.length})</span>
                    </button>
                  </div>

                  {notifTab === 'NOTIFS' && unreadCount > 0 && (
                    <button
                      onClick={() => documentStore.markAllNotificationsAsRead(currentUser.id)}
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ອ່ານທັງໝົດ</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifTab === 'NOTIFS' ? (
                    notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        ບໍ່ມີການແຈ້ງເຕືອນໃໝ່
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            documentStore.markNotificationAsRead(n.id);
                            if (n.documentId) {
                              onOpenDocument(n.documentId);
                              setShowNotifMenu(false);
                            }
                          }}
                          className={`p-3 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                            !n.read ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            {n.type === 'ACTION_REQUIRED' ? (
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1" />
                            ) : n.type === 'COMPLETED' ? (
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-800">{n.title}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                              {n.message}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {n.emailAlertSent && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                                  <Mail className="w-3 h-3 text-emerald-600" />
                                  <span>ສົ່ງ Email Alert ແລ້ວ</span>
                                </span>
                              )}
                              {n.documentNumber && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-semibold">
                                  <span>ເບິ່ງເອກະສານ</span>
                                  <ArrowRight className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    /* Email Alerts List */
                    emailAlerts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        ຍັງບໍ່ມີປະຫວັດການສົ່ງ Email Alert ອັດຕະໂນມັດ
                      </div>
                    ) : (
                      emailAlerts.map((eml) => (
                        <div
                          key={eml.id}
                          onClick={() => {
                            if (eml.documentId) {
                              onOpenDocument(eml.documentId);
                              setShowNotifMenu(false);
                            }
                          }}
                          className="p-3 hover:bg-slate-50 transition cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              📧 {eml.actionRequired}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              ✓ {eml.status}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-800">
                            {eml.recipientName}
                            <span className="font-mono text-[11px] text-slate-500 font-normal ml-1">
                              &lt;{eml.recipientEmail}&gt;
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 line-clamp-2">
                            {eml.subject}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                            <span>ເລກທີ: {eml.documentNumber}</span>
                            <span>{new Date(eml.sentAt).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {currentUser.fullName.slice(0, 1)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-slate-500 leading-none">
                {currentUser.positionLao.split('(')[0]}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1"
              title="ອອກຈາກລະບົບ (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* 24/7 Permanent Cloud Deployment Status Modal */}
    {showCloudModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 rounded-2xl border border-white/20">
                <Cloud className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-emerald-950 uppercase">
                    ONLINE 24/7 PERMANENT
                  </span>
                  <span className="text-xs font-mono text-emerald-200">FREE CLOUD TIER</span>
                </div>
                <h3 className="text-base font-bold mt-0.5">
                  ສະຖານະການ Deploy ຖາວອນ 24/7 (Permanent Cloud Deployment)
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCloudModal(false)}
              className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {/* Permanent URL Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>ລິ້ງເຂົ້າໃຊ້ງານຖາວອນ 24/7 (Permanent App URL):</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active 24/7
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={PERMANENT_APP_URL}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyPermanentUrl}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'ສຳເນົາແລ້ວ' : 'ສຳເນົາລິ້ງ'}</span>
                </button>
              </div>
            </div>

            {/* Account & Cloud Database Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 space-y-2.5 p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    ບັນຊີຫຼັກທີ່ຜູກມັດຖາວອນ (Primary Account 24/7):
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900">nokohn@mail.com</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    ລະຫັດຜ່ານເຂົ້າລະບົບ (Password):
                  </span>
                  <span className="font-mono font-bold text-xs text-slate-800">admin123456</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    ຖານຂໍ້ມູນ Cloud ຖາວອນ (Firebase Firestore):
                  </span>
                  <span className="font-mono text-[11px] text-slate-700 break-all">
                    ai-studio-edocumentmanagem-82e1736d-5c1c-43fa-b39c-cb2086a87f65
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl">
                <QRCodeGenerator value={PERMANENT_APP_URL} size={104} />
                <span className="text-[10px] font-bold text-slate-500 mt-1.5">
                  ສະແກນເຂົ້າໃຊ້ຜ່ານມືຖື 24/7
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                ຮອງຮັບການໃຊ້ງານ 24/7 ທັງຄອມພິວເຕີ ແລະ ມືຖື (Cloud Run + Firebase Firestore)
              </span>
              <button
                type="button"
                onClick={() => setShowCloudModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
              >
                ປິດໜ້າຕ່າງ
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
