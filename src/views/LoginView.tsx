import React, { useState } from 'react';
import { FileText, Shield, Lock, User as UserIcon, CheckCircle2, ArrowRight } from 'lucide-react';
import { User, UserRole } from '../types';
import { AuthService, INITIAL_USERS } from '../services/auth';
import { ROLE_HIERARCHY } from '../services/workflowAuthMiddleware';
import { LHSELogo } from '../components/LHSELogo';
import { auth, googleProvider, signInWithPopup } from '../firebase';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('nokohn@mail.com');
  const [password, setPassword] = useState('admin123456');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AuthService.login(username, password);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.message || 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email || 'nokohn@mail.com';
      const res = AuthService.login(email, 'admin123456');
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        const fallbackUser = INITIAL_USERS.find(u => u.role === 'ADMIN') || INITIAL_USERS[0];
        AuthService.setCurrentUser(fallbackUser);
        onLoginSuccess(fallbackUser);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'ບໍ່ສາມາດເຂົ້າສູ່ລະບົບດ້ວຍ Google ໄດ້');
    }
  };

  const handleQuickRoleLogin = (role: UserRole) => {
    const user = AuthService.switchUserByRole(role);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-700/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 p-8 text-white text-center relative">
          <div className="w-18 h-18 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg p-1.5">
            <LHSELogo size={58} />
          </div>
          <h1 className="text-lg font-bold">
            ລະບົບຈັດການເອກະສານຂາເຂົ້າ–ຂາອອກ
          </h1>
          <p className="text-xs text-blue-100 mt-1">
            Incoming & Outgoing E-Document Management System
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-[11px] font-semibold text-blue-200">
            <span>ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE)</span>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ບັນຊີຜູ້ໃຊ້ງານ / ອີເມວ (Account / Email)
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nokohn@mail.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ລະຫັດຜ່ານ (Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123456"
                  className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition cursor-pointer"
            >
              ເຂົ້າສູ່ລະບົບ (Log In)
            </button>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>ເຂົ້າສູ່ລະບົບດ້ວຍ Google Cloud (Firebase Auth)</span>
            </button>
          </form>

          {/* Primary Account Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              ບັນຊີຫຼັກ (Primary Account):
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-center font-mono">
              nokohn@mail.com / admin123456 (Administrator)
            </div>

            {/* Quick 1-Click Role Login */}
            <div className="mt-4">
              <div className="text-[10px] font-semibold text-slate-500 mb-2 text-center">
                ຫຼື ເລືອກເຂົ້າສູ່ລະບົບດ່ວນຕາມບົດບາດ (Quick Role Login):
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {INITIAL_USERS.map((usr) => (
                  <button
                    key={usr.id}
                    onClick={() => onLoginSuccess(usr)}
                    className="p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-left transition cursor-pointer"
                  >
                    <div className="font-bold text-[11px] text-slate-800 truncate">
                      {usr.fullName}
                    </div>
                    <div className="text-[10px] text-indigo-700 font-semibold truncate">
                      {usr.positionLao}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
