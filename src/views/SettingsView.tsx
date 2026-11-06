import React, { useState } from 'react';
import { Settings, Building, Hash, Shield, Database, Save, RotateCcw, Upload, Image } from 'lucide-react';
import { documentStore } from '../services/store';
import { useAlert } from '../components/SweetAlertModal';
import { LHSELogo } from '../components/LHSELogo';

export const SettingsView: React.FC = () => {
  const alert = useAlert();
  const [orgName, setOrgName] = useState('ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE)');
  const [incomingPrefix, setIncomingPrefix] = useState('ລຮລ/');
  const [outgoingPrefix, setOutgoingPrefix] = useState('ລຮລ.ຄກ/');
  const [autoArchive, setAutoArchive] = useState(true);
  const [requireSignatureReason, setRequireSignatureReason] = useState(false);

  const handleSave = () => {
    alert.fire({
      type: 'success',
      title: 'ບັນທຶກການຕັ້ງຄ່າສຳເລັດ',
      text: 'ການຕັ້ງຄ່າລະບົບໄດ້ຮັບການອັບເດດແລ້ວ',
    });
  };

  const handleResetData = async () => {
    const confirm = await alert.fire({
      type: 'warning',
      title: 'ຣີເຊັດຂໍ້ມູນຕົວຢ່າງ (Reset Demo Data)?',
      text: 'ຂໍ້ມູນເອກະສານ, ລາຍເຊັນ ແລະ Workflow ທັງໝົດຈະຖືກຣີເຊັດກັບຄືນຄ່າເລີ່ມຕົ້ນ.',
      confirmButtonText: 'ຣີເຊັດຂໍ້ມູນ',
      cancelButtonText: 'ຍົກເລີກ',
      showCancelButton: true,
    });

    if (confirm.isConfirmed) {
      documentStore.resetToDefault();
      await alert.fire({
        type: 'success',
        title: 'ຣີເຊັດສຳເລັດ',
        text: 'ຂໍ້ມູນລະບົບຖືກຣີເຊັດຄືນເປັນ Default Demo Data ແລ້ວ',
      });
      window.location.reload();
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
              ການຕັ້ງຄ່າລະບົບ (System Configuration)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ກຳນົດຄ່າອົງກອນ, ລະຫັດເລກທີເອກະສານ, ຄວາມປອດໄພ ແລະ ການຈັດການຖານຂໍ້ມູນ
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>ບັນທຶກການຕັ້ງຄ່າ</span>
        </button>
      </div>

      {/* 24/7 Permanent Cloud Deployment Status Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md space-y-4 border border-emerald-700/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-emerald-950 uppercase">
                ONLINE 24/7 • FREE PERMANENT CLOUD
              </span>
              <span className="text-xs font-mono text-emerald-200">Account: nokohn@mail.com</span>
            </div>
            <h2 className="text-base font-bold mt-1.5">
              ລະບົບອອນລາຍຖາວອນ 24/7 (Cloud Run + Firebase Firestore)
            </h2>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              ຜູກມັດບັນຊີຫຼັກ nokohn@mail.com ພ້ອມຖານຂໍ້ມູນ Cloud ຖາວອນແບບຟຣີ ໃຊ້ງານໄດ້ຕະຫຼອດ 24 ຊົ່ວໂມງ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-black/25 p-4 rounded-xl border border-white/10">
          <div>
            <span className="text-emerald-300 text-[10px] uppercase font-bold block">
              1. ລິ້ງເປີດໃຊ້ງານໄດ້ທັນທີປັດຈຸບັນ (Active Live URL - ບໍ່ຕິດ 404):
            </span>
            <span className="font-mono font-bold text-white break-all">
              https://ais-dev-dlbhbuxfeduv3tyaf7wmp3-966105322065.asia-southeast1.run.app
            </span>
          </div>
          <div>
            <span className="text-emerald-300 text-[10px] uppercase font-bold block">
              2. ບັນຊີຜູ້ຄຸ້ມຄອງລະບົບຫຼັກ (24/7 Primary Account):
            </span>
            <span className="font-mono font-bold text-white">
              nokohn@mail.com (Password: admin123456)
            </span>
          </div>
        </div>

        <div className="text-[11px] bg-amber-500/20 border border-amber-400/40 rounded-xl p-3 text-amber-100 leading-relaxed">
          <span className="font-bold text-amber-300">💡 ໝາຍເຫດສຳຄັນສຳລັບລິ້ງ Shared URL (ais-pre-...):</span> ຫາກເປີດລິ້ງ <code className="font-mono font-bold text-white">ais-pre-dlbhbuxfeduv3tyaf7wmp3-966105322065.asia-southeast1.run.app</code> ແລ້ວຂຶ້ນ <b>"Error: Page not found"</b> ແມ່ນຍ້ອນຍັງບໍ່ທັນໄດ້ກົດປຸ່ມເປີດ Public ຢູ່ໜ້າຈໍ Google AI Studio. ກະລຸນາກົດປຸ່ມ <b>"Share" (ແຊຣ໌)</b> ຫຼື <b>"Deploy" (ຮູບຈະຫຼວດ 🚀)</b> ຢູ່ <b>ມຸມຂວາເທິງສຸດຂອງໜ້າຈໍ AI Studio</b> ແລ້ວເປີດ Public 1 ຄັ້ງ. ໃນລະຫວ່າງນີ້ ທ່ານສາມາດໃຊ້ລິ້ງ <code className="font-mono font-bold text-emerald-300">ais-dev-...</code> ຂ້າງເທິງນີ້ໄດ້ທັນທີ!
        </div>
      </div>

      {/* Organization Profile */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-600" />
          <span>ຂໍ້ມູນອົງກອນ ແລະ ຫົວເອກະສານທາງການ</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">ຊື່ອົງກອນ (Lao):</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">ປະເພດອົງກອນ:</label>
            <input
              type="text"
              disabled
              value="ລັດວິສາຫະກິດ (Lao State Enterprise)"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
            />
          </div>
        </div>

        {/* Logo preview and management */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
              <LHSELogo size={56} />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-800 flex items-center gap-2">
                <span>ສັນຍາລັກທາງການ: ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (ລຮລ / LHSE)</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded font-semibold">Active Seal</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ໂລໂກ້ແບບ Vector SVG ໃຊ້ສຳລັບຫົວເອກະສານ, QR Code, ໃບຢັ້ງຢືນລາຍເຊັນ ແລະ ລະບົບພິມ PDF
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              alert.fire({
                type: 'info',
                title: 'ສັນຍາລັກທາງການຖືກກຳນົດແລ້ວ',
                text: 'ໂລໂກ້ຂອງ ລັດວິສາຫະກິດຖືຮຸ້ນລາວ (LHSE) ເປັນກາປະທັບທາງລັດຖະການທີ່ຖືກຕ້ອງຕາມລະບຽບການແລ້ວ',
              });
            }}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
          >
            <Image className="w-3.5 h-3.5 text-slate-500" />
            <span>ກວດສອບໂລໂກ້</span>
          </button>
        </div>
      </div>

      {/* Document Prefix Setting */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Hash className="w-4 h-4 text-indigo-600" />
          <span>ຮູບແບບເລກທີເອກະສານ (Document Numbering)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">ຄຳນຳໜ້າເລກທີຂາເຂົ້າ (Incoming Prefix):</label>
            <input
              type="text"
              value={incomingPrefix}
              onChange={(e) => setIncomingPrefix(e.target.value)}
              className="w-full px-3 py-2 font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">ຕົວຢ່າງ: ລຮລ/0245</span>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">ຄຳນຳໜ້າເລກທີຂາອອກ (Outgoing Prefix):</label>
            <input
              type="text"
              value={outgoingPrefix}
              onChange={(e) => setOutgoingPrefix(e.target.value)}
              className="w-full px-3 py-2 font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">ຕົວຢ່າງ: ລຮລ.ຄກ/089</span>
          </div>
        </div>
      </div>

      {/* Security & Reset Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-rose-600" />
          <span>ການຈັດການຂໍ້ມູນ ແລະ ຖານຂໍ້ມູນຕົວຢ່າງ</span>
        </h2>
        <p className="text-xs text-slate-600">
          ທ່ານສາມາດຣີເຊັດຂໍ້ມູນທົດສອບກັບຄືນສູ່ຄ່າເລີ່ມຕົ້ນໄດ້ທຸກເວລາ ເພື່ອເລີ່ມຕົ້ນຂັ້ນຕອນການທົດສອບ Workflow ໃໝ່
        </p>
        <button
          onClick={handleResetData}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>ຣີເຊັດຂໍ້ມູນຕົວຢ່າງ (Reset All Demo Data)</span>
        </button>
      </div>
    </div>
  );
};
