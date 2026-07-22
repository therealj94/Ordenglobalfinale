import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiCheck, FiRotateCw, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface SignaturePadProps {
  onSubmit: (signature: string) => Promise<void>;
}

const INK_COLOR = '#1e2a44';
const PAPER_COLOR = '#fdfbf3';

export default function SignaturePad({ onSubmit }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const paintBackground = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = PAPER_COLOR;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = INK_COLOR;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    paintBackground();
  }, [paintBackground]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPos(e);
    setHasDrawn(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !lastPointRef.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPointRef.current = pos;
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClear = () => {
    paintBackground();
    setHasDrawn(false);
  };

  const handleConfirm = async () => {
    if (!hasDrawn) {
      toast.error('Please sign inside the box first');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      setSubmitting(true);
      await onSubmit(canvas.toDataURL('image/png'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save signature');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <p className="text-center text-gray-600 text-sm mb-3">
        Sign inside the box below with your finger or mouse.
      </p>
      <canvas
        ref={canvasRef}
        className="w-full h-56 rounded-lg border-2 border-dashed border-gray-300 touch-none"
        style={{ backgroundColor: PAPER_COLOR }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleClear}
          disabled={submitting}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition flex items-center justify-center"
        >
          <FiRotateCw className="mr-2" />
          Clear
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition flex items-center justify-center"
        >
          {submitting ? <FiLoader className="animate-spin mr-2" /> : <FiCheck className="mr-2" />}
          {submitting ? 'Saving...' : 'Use This Signature'}
        </button>
      </div>
    </div>
  );
}
