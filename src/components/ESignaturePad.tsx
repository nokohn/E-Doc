import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Upload, RefreshCw, PenTool, ShieldCheck, X } from 'lucide-react';
import { LHSELogo } from './LHSELogo';

interface ESignaturePadProps {
  signerName: string;
  signerPosition: string;
  initialMode?: 'DRAW' | 'UPLOAD';
  onSave: (signatureDataUrl: string) => void;
  onCancel: () => void;
}

export const ESignaturePad: React.FC<ESignaturePadProps> = ({
  signerName,
  signerPosition,
  initialMode = 'DRAW',
  onSave,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [activeTab, setActiveTab] = useState<'DRAW' | 'UPLOAD'>(initialMode);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0f172a'; // Deep slate / ink blue
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSignature = () => {
    if (activeTab === 'UPLOAD' && uploadedImage) {
      onSave(uploadedImage);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export transparent PNG signature
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="shrink-0 drop-shadow-sm hover:scale-105 transition-transform">
              <LHSELogo size={36} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">ລົງລາຍເຊັນດິຈິທັລ (E-Signature)</h3>
                <span className="px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-bold">LHSE</span>
              </div>
              <p className="text-xs text-blue-100">ລະບົບກວດສອບຄວາມຖືກຕ້ອງ ແລະ ເຊື່ອມຕໍ່ໃບຢັ້ງຢືນ</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signer Info Badge */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">ຜູ້ລົງລາຍເຊັນ:</div>
            <div className="font-bold text-slate-800 text-sm">{signerName}</div>
            <div className="text-xs text-indigo-700 font-medium">{signerPosition}</div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Identity Verified</span>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('DRAW')}
            className={`pb-2.5 text-sm font-semibold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'DRAW'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>ແຕ້ມລາຍເຊັນ (Draw / Touch)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('UPLOAD')}
            className={`pb-2.5 text-sm font-semibold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'UPLOAD'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload ຮູບລາຍເຊັນ</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {activeTab === 'DRAW' ? (
            <div>
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden shadow-inner touch-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-48 cursor-crosshair block"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                    <PenTool className="w-8 h-8 mb-2 stroke-[1.5] opacity-50" />
                    <p className="text-sm font-medium">ໃຊ້ເມົາສ໌, Stylus ຫຼື ແຕະໜ້າຈໍເພື່ອເຊັນລາຍເຊັນ</p>
                    <p className="text-xs opacity-75">Sign here with mouse, stylus or touch</p>
                  </div>
                )}
                <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 font-mono">
                  X __________________________________________________
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>ຮອງຮັບ Mouse, Touchscreen ແລະ Stylus</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1 text-slate-600 hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>ລຶບແຕ້ມໃໝ່ (Clear)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {uploadedImage ? (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <img
                    src={uploadedImage}
                    alt="Uploaded Signature"
                    className="max-h-40 mx-auto object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setUploadedImage(null)}
                    className="mt-3 text-xs text-rose-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ເລືອກຮູບໃໝ່</span>
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 rounded-2xl p-8 block hover:border-indigo-400 hover:bg-indigo-50/20 transition cursor-pointer">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">ຄລິກເພື່ອອັບໂຫຼດໄຟລ໌ຮູບລາຍເຊັນ</p>
                  <p className="text-xs text-slate-500 mt-1">ຮອງຮັບ PNG, JPG (ແນະນຳໄຟລ໌ PNG ພື້ນຫຼັງໂປ່ງໃສ)</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Legal / Compliance notice */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <span className="font-bold">ໝາຍເຫດ:</span>
            <span>
              ການລົງລາຍເຊັນດິຈິທັລນີ້ຖືເປັນການຮັບຮອງທາງນິຕິກຳ ແລະ ຈະຖືກບັນທຶກເຂົ້າໃນ Audit Log
              ພ້ອມລະຫັດ Hash ຢັ້ງຢືນ ທີ່ບໍ່ສາມາດປອມແປງໄດ້.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            ຍົກເລີກ
          </button>
          <button
            type="button"
            onClick={handleConfirmSignature}
            disabled={activeTab === 'DRAW' ? !hasDrawn : !uploadedImage}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer ${
              (activeTab === 'DRAW' ? hasDrawn : uploadedImage)
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>ຢືນຢັນລົງລາຍເຊັນ (Sign Document)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
