import React, { useEffect, useRef, useState } from "react";
import { Eraser, PenLine } from "lucide-react";
import { useI18n } from "../../../../i18n";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 140;

function trimCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  let top = height;
  let left = width;
  let right = 0;
  let bottom = 0;
  let found = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      const r = data[(y * width + x) * 4];
      const g = data[(y * width + x) * 4 + 1];
      const b = data[(y * width + x) * 4 + 2];
      const isInk = alpha > 0 && (r < 250 || g < 250 || b < 250);

      if (isInk) {
        found = true;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  if (!found) return "";

  const padding = 8;
  const cropX = Math.max(0, left - padding);
  const cropY = Math.max(0, top - padding);
  const cropW = Math.min(width - cropX, right - left + 1 + padding * 2);
  const cropH = Math.min(height - cropY, bottom - top + 1 + padding * 2);

  const trimmed = document.createElement("canvas");
  trimmed.width = cropW;
  trimmed.height = cropH;
  trimmed.getContext("2d").drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return trimmed.toDataURL("image/png");
}

export default function SignaturePad({ label, value, onChange }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const emitChange = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const trimmed = trimCanvas(canvas);
    setIsEmpty(!trimmed);
    onChange(trimmed);
  };

  const startDraw = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;
    drawingRef.current = true;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;
    const ctx = canvas.getContext("2d");
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    emitChange();
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange("");
  };

  const initCanvas = (canvas) => {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initCanvas(canvas);

    if (value) {
      const img = new Image();
      img.onload = () => {
        initCanvas(canvas);
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height,
          1
        );
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        canvas.getContext("2d").drawImage(img, x, y, w, h);
        setIsEmpty(false);
      };
      img.src = value;
    }
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <PenLine size={16} className="text-blue-600" />
          {label}
        </label>
        <button
          type="button"
          onClick={clearPad}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          <Eraser size={14} />
          {tr("Hapus", "Clear")}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full rounded-lg border border-dashed border-gray-300 bg-white cursor-crosshair"
        style={{ touchAction: "none" }}
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
        onPointerCancel={endDraw}
      />
      <p className="mt-1.5 text-xs text-gray-500">
        {isEmpty
          ? tr("Gambar tanda tangan di area putih (opsional)", "Draw signature in the white area (optional)")
          : tr("Tanda tangan tersimpan untuk PDF", "Signature saved for PDF")}
      </p>
    </div>
  );
}
