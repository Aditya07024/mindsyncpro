import React, { useState, useRef, useEffect } from 'react';
import { X, Crop, ZoomIn, Check } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}) => {
  const [aspectRatio, setAspectRatio] = useState<number>(2 / 1); // Default 2:1 banner
  const [scale, setScale] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [cropWidth, setCropWidth] = useState<number>(1200);
  const [cropHeight, setCropHeight] = useState<number>(600);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      renderCrop();
    };
  }, [isOpen, imageSrc, aspectRatio, scale, offsetX, offsetY]);

  const handleRatioChange = (ratio: number, width: number, height: number) => {
    setAspectRatio(ratio);
    setCropWidth(width);
    setCropHeight(height);
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const renderCrop = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Background fill
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scaling & centering
    const imgAspect = img.width / img.height;
    const targetAspect = cropWidth / cropHeight;

    let drawW: number;
    let drawH: number;

    if (imgAspect > targetAspect) {
      drawH = cropHeight * scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = cropWidth * scale;
      drawH = drawW / imgAspect;
    }

    const startX = (cropWidth - drawW) / 2 + offsetX;
    const startY = (cropHeight - drawH) / 2 + offsetY;

    ctx.drawImage(img, startX, startY, drawW, drawH);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const croppedUrl = canvas.toDataURL('image/jpeg', 0.88);
    onCropComplete(croppedUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Crop className="size-5 text-emerald-400" />
            <h3 className="font-display font-bold text-lg text-white">Crop & Adjust Ad Banner Image</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Aspect Ratio Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Aspect Ratio Preset
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleRatioChange(2 / 1, 1200, 600)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                aspectRatio === 2 / 1
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              2:1 Banner (1200×600) ⭐ Recommended
            </button>
            <button
              type="button"
              onClick={() => handleRatioChange(16 / 9, 1280, 720)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                aspectRatio === 16 / 9
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              16:9 Widescreen (1280×720)
            </button>
            <button
              type="button"
              onClick={() => handleRatioChange(4 / 3, 1024, 768)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                aspectRatio === 4 / 3
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              4:3 Standard (1024×768)
            </button>
          </div>
        </div>

        {/* Canvas Preview Box */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[220px] max-h-[340px]">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[300px] object-contain rounded-xl shadow-lg"
          />
        </div>

        {/* Adjustments Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1">
              <ZoomIn className="size-3.5 text-emerald-400" /> Zoom Scale ({scale.toFixed(1)}x)
            </label>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Horizontal Shift ({offsetX}px)
            </label>
            <input
              type="range"
              min="-300"
              max="300"
              step="5"
              value={offsetX}
              onChange={(e) => setOffsetX(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Vertical Shift ({offsetY}px)
            </label>
            <input
              type="range"
              min="-200"
              max="200"
              step="5"
              value={offsetY}
              onChange={(e) => setOffsetY(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition active:scale-[0.98]"
          >
            <Check className="size-4" /> Save Cropped Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
