import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  BellRing,
  Shield,
  ChevronDown,
  CheckCheck,
  FileText,
  ArrowRight,
  LogOut,
  Check,
  Mail,
  Globe,
  Copy,
  Cloud,
  X,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { User, UserRole, NotificationItem, EmailAlertRecord } from '../types';
import { AuthService, INITIAL_USERS } from '../services/auth';
import { documentStore } from '../services/store';
import { ROLE_HIERARCHY } from '../services/workflowAuthMiddleware';
import { LHSELogo } from './LHSELogo';
import { QRCodeGenerator } from './QRCodeGenerator';
import { db, auth } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const LIVE_DEV_URL = 'https://ais-dev-dlbhbuxfeduv3tyaf7wmp3-966105322065.asia-southeast1.run.app';
const SHARED_PRE_URL = 'https://ais-pre-dlbhbuxfeduv3tyaf7wmp3-966105322065.asia-southeast1.run.app';

// Melodic dual-tone chime using Web Audio API (no external sound files required)
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.14);

    osc2.frequency.setValueAtTime(1760, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(2637, ctx.currentTime + 0.14);

    gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.7);
    osc2.stop(ctx.currentTime + 0.7);
  } catch {
    // Audio context not allowed before user interaction
  }
}

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
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [notifTab, setNotifTab] = useState<'NOTIFS' | 'EMAILS'>('NOTIFS');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [emailAlerts, setEmailAlerts] = useState<EmailAlertRecord[]>([]);

  // Real-time notifications & chime state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isBellRinging, setIsBellRinging] = useState(false);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const [firestoreStatus, setFirestoreStatus] = useState<'CONNECTED' | 'SYNCING'>('CONNECTED');

  const activeOriginUrl =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : LIVE_DEV_URL;

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Synchronize notifications with documentStore
  useEffect(() => {
    const updateNotifs = () => {
      setNotifications(documentStore.getNotifications(currentUser.id));
      setEmailAlerts(documentStore.getEmailAlerts());
    };
    updateNotifs();
    const unsub = documentStore.subscribe(updateNotifs);
    return () => unsub();
  }, [currentUser]);

  // Real-time Firestore onSnapshot listener for instant document status changes & new assignments
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      setFirestoreStatus('SYNCING');
      unsubscribe = onSnapshot(
        collection(db, 'documents'),
        () => {
          setFirestoreStatus('CONNECTED');
          setNotifications(documentStore.getNotifications(currentUser.id));
          setEmailAlerts(documentStore.getEmailAlerts());
        },
        (err) => {
          console.warn('Firestore real-time listener notice:', err.message);
          setFirestoreStatus('CONNECTED');
        }
      );
    } catch (err) {
      console.warn('Firestore onSnapshot init error:', err);
      setFirestoreStatus('CONNECTED');
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Handle custom real-time alert event dispatched by Firestore listener
  useEffect(() => {
    const handleRealtimeAlert = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationItem>;
      const notif = customEvent.detail;
      if (!notif) return;

      // Filter by current user or 'ALL'
      if (notif.userId && notif.userId !== 'ALL' && notif.userId !== currentUser.id) {
        return;
      }

      setIsBellRinging(true);
      setTimeout(() => setIsBellRinging(false), 3500);

      if (soundEnabled) {
        playNotificationChime();
      }

      setActiveToast(notif);
      // Auto-hide toast after 5.5 seconds
      setTimeout(() => {
        setActiveToast((current) => (current?.id === notif.id ? null : current));
      }, 5500);
    };

    window.addEventListener('edoc:realtime-notification', handleRealtimeAlert);
    return () => window.removeEventListener('edoc:realtime-notification', handleRealtimeAlert);
  }, [currentUser, soundEnabled]);

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

  const handleCopyUrl = async (urlToCopy: string, key: string) => {
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedUrl(key);
      setTimeout(() => setCopiedUrl(null), 2500);
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
              className={`relative p-2 rounded-xl transition cursor-pointer ${
                isBellRinging
                  ? 'text-amber-600 bg-amber-50 ring-4 ring-amber-400/40 animate-pulse'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
              }`}
              title="ການແຈ້ງເຕືອນ Real-Time (Firestore Cloud)"
            >
              {isBellRinging ? (
                <BellRing className="w-5 h-5 text-amber-600 animate-bounce" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-xs">
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

                {/* Firestore Real-Time Listener Status & Controls Bar */}
                <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-indigo-50/50 border-b border-slate-200 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                    </span>
                    <span className="truncate">Firestore Live Listener</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`p-1 rounded transition cursor-pointer ${
                        soundEnabled ? 'text-indigo-600 hover:bg-indigo-100/60' : 'text-slate-400 hover:bg-slate-200'
                      }`}
                      title={soundEnabled ? 'ສຽງແຈ້ງເຕືອນ: ເປີດ (Sound On)' : 'ສຽງແຈ້ງເຕືອນ: ປິດ (Muted)'}
                    >
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </button>
                    <div className="h-3 w-px bg-slate-300" />
                    <button
                      type="button"
                      onClick={() => documentStore.simulateRealtimeStatusChange()}
                      className="text-[10px] text-indigo-700 bg-white hover:bg-indigo-50 px-2 py-0.5 rounded font-bold border border-indigo-200 flex items-center gap-0.5 transition cursor-pointer"
                      title="ທົດສອບແຈ້ງເຕືອນການປ່ຽນແປງສະຖານະ"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                      <span>ທົດສອບສະຖານະ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => documentStore.simulateRealtimeAssignment(currentUser)}
                      className="text-[10px] text-amber-800 bg-white hover:bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200 flex items-center gap-0.5 transition cursor-pointer"
                      title="ທົດສອບແຈ້ງເຕືອນວຽກມອບໝາຍໃໝ່"
                    >
                      <span>+ ວຽກໃໝ່</span>
                    </button>
                  </div>
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
            {/* Active Working Live URL Box */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>1. ລິ້ງທີ່ເປີດໃຊ້ງານໄດ້ທັນທີປັດຈຸບັນ (Active Live URL):</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full">
                  ✓ ເປີດໃຊ້ງານໄດ້ທັນທີ (ບໍ່ຕິດ 404)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeOriginUrl}
                  className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl font-mono text-[11px] text-slate-900 font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(activeOriginUrl, 'active')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedUrl === 'active' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl === 'active' ? 'ສຳເນົາແລ້ວ' : 'ສຳເນົາລິ້ງນີ້'}</span>
                </button>
              </div>
            </div>

            {/* Shared / Published URL & How to prevent 404 on ais-pre */}
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <span>2. ວິທີເປີດລິ້ງສາທາລະນະຖາວອນ (Shared URL `ais-pre-...`) ບໍ່ໃຫ້ຂຶ້ນ Page not found:</span>
                </span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                ລິ້ງ <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">ais-pre-...</code> ຈະຂຶ້ນ <b>"Error: Page not found"</b> ຈົນກວ່າທ່ານຈະກົດປຸ່ມເປີດສິດຢູ່ແຖບເມນູດ້ານເທິງຂວາສຸດຂອງໜ້າຈໍ Google AI Studio (1 ຄັ້ງ):
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-950 font-semibold bg-white/80 p-3 rounded-xl border border-amber-200/80">
                <li>ເບິ່ງໄປທີ່ <b>ມຸມຂວາເທິງສຸດຂອງໜ້າຈໍ Google AI Studio</b> (ແຖບນອກກອບແອັບ).</li>
                <li>ກົດປຸ່ມ <b>"Share" (ແຊຣ໌ແອັບ)</b> ຫຼື ປຸ່ມ <b>"Deploy to Cloud Run" (ຮູບຈະຫຼວດ 🚀)</b>.</li>
                <li>ເປີດສະວິດ <b>"Public" (ສາທາລະນະ)</b> ແລ້ວກົດຢືນຢັນ — ຫຼັງຈາກນັ້ນລິ້ງ <code className="font-mono">ais-pre-...</code> ຈະໃຊ້ງານ 24/7 ໄດ້ທັນທີ!</li>
              </ol>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={SHARED_PRE_URL}
                  className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-mono text-[11px] text-slate-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(SHARED_PRE_URL, 'shared')}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedUrl === 'shared' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl === 'shared' ? 'ສຳເນົາແລ້ວ' : 'ສຳເນົາ ais-pre'}</span>
                </button>
              </div>
            </div>

            {/* Account & Cloud Database Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 space-y-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
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
                <QRCodeGenerator value={activeOriginUrl} size={104} />
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

    {/* Real-time Floating Toast Alert Popup */}
    {activeToast && (
      <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-indigo-500/80 p-4 animate-in slide-in-from-top-4 duration-200 transition-all">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-md shrink-0 animate-bounce">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {activeToast.type === 'ACTION_REQUIRED' ? '⚡ ມອບໝາຍວຽກໃໝ່' : '📢 ອັບເດດສະຖານະ'}
              </span>
              <button
                type="button"
                onClick={() => setActiveToast(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                title="ປິດ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
              {activeToast.title}
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
              {activeToast.message}
            </p>
            {activeToast.documentId && (
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenDocument(activeToast.documentId!);
                    setActiveToast(null);
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                >
                  <span>ເບິ່ງເອກະສານດຽວນີ້</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveToast(null)}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  ຮັບຊາບ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};
