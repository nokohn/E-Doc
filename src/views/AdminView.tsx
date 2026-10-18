import React, { useState } from 'react';
import { Users, Shield, Plus, Building, UserCheck } from 'lucide-react';
import { INITIAL_USERS } from '../services/auth';
import { ROLE_HIERARCHY } from '../services/workflowAuthMiddleware';
import { UserRole } from '../types';
import { LHSELogo } from '../components/LHSELogo';

export const AdminView: React.FC = () => {
  const [users, setUsers] = useState(INITIAL_USERS);

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
                ຈັດການຜູ້ໃຊ້ ແລະ ສິດທິ (Users & Roles RBAC)
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 rounded border border-purple-200">
                LHSE Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ກຳນົດໂຄງສ້າງບົດບາດ 7 ລະດັບ, ຕຳແໜ່ງງານ, ແລະ ພະແນກການສຳລັບລະບົບເອກະສານລັດວິສາຫະກິດ
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-xs uppercase text-slate-600">
            ບັນຊີຜູ້ໃຊ້ໃນລະບົບ (System Accounts)
          </h2>
          <span className="text-xs text-slate-500 font-medium">ທັງໝົດ {users.length} ບັນຊີ</span>
        </div>

        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">ຊື່ ແລະ ນາມສະກຸນ</th>
              <th className="py-3.5 px-4">ຊື່ຜູ້ໃຊ້ (Username)</th>
              <th className="py-3.5 px-4">ບົດບາດ (Role)</th>
              <th className="py-3.5 px-4">ຕຳແໜ່ງງານ (Position)</th>
              <th className="py-3.5 px-4">ພະແນກສັງກັດ</th>
              <th className="py-3.5 px-4">ອີເມວ & ເບີໂທ</th>
              <th className="py-3.5 px-4 text-center">ສະຖານະ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="py-3.5 px-4 font-bold text-slate-800">
                  {u.fullName}
                </td>
                <td className="py-3.5 px-4 font-mono text-indigo-700">
                  {u.username}
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ROLE_HIERARCHY[u.role].color}`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-700">
                  {u.positionLao}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {u.departmentName}
                </td>
                <td className="py-3.5 px-4 text-[11px] text-slate-500">
                  <div>{u.email}</div>
                  <div>{u.phone}</div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Hierarchy Definitions Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">
          ໂຄງສ້າງລະດັບສິດທິ (Role-Based Access Control Hierarchy)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(ROLE_HIERARCHY) as UserRole[]).map(roleKey => {
            const meta = ROLE_HIERARCHY[roleKey];
            return (
              <div key={roleKey} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${meta.color}`}>
                    Level {meta.level}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{roleKey}</span>
                </div>
                <div className="font-bold text-slate-800 text-xs mt-1">{meta.labelLao}</div>
                <div className="text-[10px] text-slate-500">{meta.labelEn}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
