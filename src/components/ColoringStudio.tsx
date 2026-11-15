import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookmarkCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Eraser,
  Hand,
  PaintBucket,
  Palette,
  PenTool,
  Pencil,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { BRUSH_RADII, CRAYON_PALETTE } from '../data/palette';
import {
  BrushSize,
  ColoringTemplate,
  PatternId,
  SavedArtwork,
  ToolType,
} from '../types/coloring';
import { floodFillCanvas } from '../utils/floodFill';
import { loadImageFromUrl } from '../utils/lineArtProcessor';
import { getPatternPreviewUrl, PATTERN_OPTIONS } from '../utils/patternFill';

const CANVAS_SIZE = 1024;
const MAX_HISTORY = 16;

interface HistoryEntry {
  imageData: ImageData;
  regionIds: Uint16Array;
}

interface ColoringStudioProps {
  template: ColoringTemplate;
  existingArtwork?: SavedArtwork | null;
  onSaveArtwork: (artwork: SavedArtwork) => Promise<void>;
  onBack: () => void;
}

export const ColoringStudio: React.FC<ColoringStudioProps> = ({
  template,
  existingArtwork,
  onSaveArtwork,
  onBack,
}) => {
  const paintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTool, setActiveTool] = useState<ToolType>('fill');
  const [activeColor, setActiveColor] = useState<string>(CRAYON_PALETTE[0].hex);
  const [activePattern, setActivePattern] = useState<PatternId>('solid');
  const [showMobilePatterns, setShowMobilePatterns] = useState(false);
  const [brushSize, setBrushSize] = useState<BrushSize>('md');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ dist: number; midX: number; midY: number; panX: number; panY: number } | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const rainbowHueRef = useRef(0);
  const regionIdsRef = useRef<Uint16Array>(new Uint16Array(CANVAS_SIZE * CANVAS_SIZE));
  const nextRegionIdRef = useRef<number>(1);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const artworkIdRef = useRef<string>(
    existingArtwork?.id || `art-${template.id}-${Date.now()}`
  );

  const patternPreviews = useMemo(() => {
    const map: Record<PatternId, string> = {
      solid: '',
      love: '',
      rainbow: '',
      diamond: '',
      stars: '',
      dots: '',
      stripes: '',
      waves: '',
    };
    for (const opt of PATTERN_OPTIONS) {
      map[opt.id] = getPatternPreviewUrl(opt.id, activeColor);
    }
    return map;
  }, [activeColor]);

  const activePatternLabel = useMemo(
    () => PATTERN_OPTIONS.find((p) => p.id === activePattern)?.label || 'Solid',
    [activePattern]
  );

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const pushHistory = useCallback(() => {
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const regionIds = new Uint16Array(regionIdsRef.current);
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push({ imageData, regionIds });
    if (nextHistory.length > MAX_HISTORY) {
      nextHistory.shift();
    }
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  // Initialize paint & outline canvases whenever template changes
  useEffect(() => {
    let cancelled = false;
    setIsReady(false);
    historyRef.current = [];
    historyIndexRef.current = -1;
    regionIdsRef.current.fill(0);
    nextRegionIdRef.current = 1;
    syncHistoryFlags();

    const initCanvases = async () => {
      const paintCanvas = paintCanvasRef.current;
      const lineCanvas = lineCanvasRef.current;
      if (!paintCanvas || !lineCanvas) return;

      const paintCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
      const lineCtx = lineCanvas.getContext('2d', { willReadFrequently: true });
      if (!paintCtx || !lineCtx) return;

      // Clear & prepare crisp white paper
      paintCtx.fillStyle = '#FFFFFF';
      paintCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      lineCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      try {
        const lineImg = await loadImageFromUrl(template.lineArtUrl);
        if (cancelled) return;
        lineCtx.drawImage(lineImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

        if (existingArtwork?.paintDataUrl) {
          const savedPaintImg = await loadImageFromUrl(existingArtwork.paintDataUrl);
          if (cancelled) return;
          paintCtx.drawImage(savedPaintImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }
      } catch {
        // Leave blank paper if image load fails gracefully
      }

      if (!cancelled) {
        pushHistory();
        setIsReady(true);
      }
    };

    initCanvases();
    return () => {
      cancelled = true;
    };
  }, [template, existingArtwork, pushHistory, syncHistoryFlags]);

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    const paintCanvas = paintCanvasRef.current;
    const ctx = paintCanvas?.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    historyIndexRef.current -= 1;
    const entry = historyRef.current[historyIndexRef.current];
    ctx.putImageData(entry.imageData, 0, 0);
    regionIdsRef.current = new Uint16Array(entry.regionIds);
    syncHistoryFlags();
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const paintCanvas = paintCanvasRef.current;
    const ctx = paintCanvas?.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    historyIndexRef.current += 1;
    const entry = historyRef.current[historyIndexRef.current];
    ctx.putImageData(entry.imageData, 0, 0);
    regionIdsRef.current = new Uint16Array(entry.regionIds);
    syncHistoryFlags();
  };

  const handleClear = () => {
    const paintCanvas = paintCanvasRef.current;
    const ctx = paintCanvas?.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    regionIdsRef.current.fill(0);
    pushHistory();
    setConfirmClear(false);
  };

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE,
    };
  };

  const drawCrayonDab = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string
  ) => {
    ctx.save();
    ctx.fillStyle = color;
    const dots = Math.max(10, Math.round(radius * 1.4));
    for (let i = 0; i < dots; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * radius;
      const dx = x + Math.cos(angle) * dist;
      const dy = y + Math.sin(angle) * dist;
      const dotR = 1.3 + Math.random() * 2.2;
      ctx.globalAlpha = 0.35 + Math.random() * 0.45;
      ctx.beginPath();
      ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const clearRegionIdsInStroke = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    radius: number
  ) => {
    const minX = Math.max(0, Math.floor(Math.min(from.x, to.x) - radius));
    const maxX = Math.min(CANVAS_SIZE - 1, Math.ceil(Math.max(from.x, to.x) + radius));
    const minY = Math.max(0, Math.floor(Math.min(from.y, to.y) - radius));
    const maxY = Math.min(CANVAS_SIZE - 1, Math.ceil(Math.max(from.y, to.y) + radius));
    const ids = regionIdsRef.current;
    for (let y = minY; y <= maxY; y++) {
      const rowOffset = y * CANVAS_SIZE;
      for (let x = minX; x <= maxX; x++) {
        ids[rowOffset + x] = 0;
      }
    }
  };

  const drawSegment = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) => {
    const radius = BRUSH_RADII[brushSize];
    clearRegionIdsInStroke(from, to, radius * 0.8);

    if (activeTool === 'crayon') {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.hypot(dx, dy);
      const step = Math.max(2, radius * 0.32);
      const steps = Math.max(1, Math.ceil(dist / step));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        drawCrayonDab(ctx, from.x + dx * t, from.y + dy * t, radius * 0.65, activeColor);
      }
      return;
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = radius * 1.35;

    if (activeTool === 'rainbow') {
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      rainbowHueRef.current = (rainbowHueRef.current + Math.max(2, dist * 0.45)) % 360;
      ctx.strokeStyle = `hsl(${rainbowHueRef.current}, 90%, 54%)`;
    } else if (activeTool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
    } else {
      ctx.strokeStyle = activeColor;
    }

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  };

  const clampPan = useCallback(
    (nextX: number, nextY: number, targetZoom: number) => {
      if (targetZoom <= 1) return { x: 0, y: 0 };
      const box = viewportRef.current?.getBoundingClientRect();
      const maxX = box ? ((targetZoom - 1) * box.width) / 2 + 40 : 320;
      const maxY = box ? ((targetZoom - 1) * box.height) / 2 + 40 : 320;
      return {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY)),
      };
    },
    []
  );

  const handleZoomChange = useCallback(
    (nextZoomRaw: number) => {
      const nextZoom = Math.max(1, Math.min(3, Math.round(nextZoomRaw * 20) / 20));
      setZoom(nextZoom);
      if (nextZoom <= 1) {
        setPan({ x: 0, y: 0 });
        setIsPanMode(false);
      } else {
        setPan((prev) => clampPan(prev.x, prev.y, nextZoom));
      }
    },
    [clampPan]
  );

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsPanMode(false);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isReady) return;
    e.preventDefault();
    const paintCanvas = paintCanvasRef.current;
    const lineCanvas = lineCanvasRef.current;
    const paintCtx = paintCanvas?.getContext('2d', { willReadFrequently: true });
    const lineCtx = lineCanvas?.getContext('2d', { willReadFrequently: true });
    if (!paintCtx || !paintCanvas) return;

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two-finger pan gesture on touch devices
    if (activePointersRef.current.size === 2) {
      isDrawingRef.current = false;
      isPanningRef.current = true;
      const pts = Array.from(activePointersRef.current.values());
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartRef.current = { dist, midX, midY, panX: pan.x, panY: pan.y };
      return;
    }

    // Single-pointer Move / Pan mode or middle-click drag
    if (isPanMode || e.button === 1) {
      paintCanvas.setPointerCapture(e.pointerId);
      isPanningRef.current = true;
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      return;
    }

    const pt = getCanvasPoint(e);

    if (activeTool === 'fill') {
      const nextId = nextRegionIdRef.current;
      const changed = floodFillCanvas(paintCtx, lineCtx ?? null, pt.x, pt.y, activeColor, {
        patternId: activePattern,
        regionIds: regionIdsRef.current,
        nextRegionId: nextId,
      });
      if (changed) {
        if (activePattern !== 'solid') {
          nextRegionIdRef.current = nextId >= 65500 ? 1 : nextId + 1;
        }
        pushHistory();
      }
      return;
    }

    paintCanvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    lastPosRef.current = pt;
    drawSegment(paintCtx, pt, { x: pt.x + 0.1, y: pt.y + 0.1 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const dx = midX - pinchStartRef.current.midX;
      const dy = midY - pinchStartRef.current.midY;
      setPan(clampPan(pinchStartRef.current.panX + dx, pinchStartRef.current.panY + dy, zoom));
      return;
    }

    if (isPanningRef.current && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      setPan(clampPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy, zoom));
      return;
    }

    if (!isDrawingRef.current || !lastPosRef.current) return;
    const paintCtx = paintCanvasRef.current?.getContext('2d', { willReadFrequently: true });
    if (!paintCtx) return;

    const pt = getCanvasPoint(e);
    drawSegment(paintCtx, lastPosRef.current, pt);
    lastPosRef.current = pt;
  };

  const handlePointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e) {
      activePointersRef.current.delete(e.pointerId);
    } else {
      activePointersRef.current.clear();
    }

    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;
    pushHistory();
  };

  const buildCompositeDataUrl = (): string => {
    const out = document.createElement('canvas');
    out.width = CANVAS_SIZE;
    out.height = CANVAS_SIZE;
    const ctx = out.getContext('2d');
    if (!ctx || !paintCanvasRef.current || !lineCanvasRef.current) return '';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(paintCanvasRef.current, 0, 0);
    ctx.drawImage(lineCanvasRef.current, 0, 0);
    return out.toDataURL('image/png');
  };

  const handleSaveToArtbook = async () => {
    if (!paintCanvasRef.current) return;
    const previewDataUrl = buildCompositeDataUrl();
    const paintDataUrl = paintCanvasRef.current.toDataURL('image/png');
    await onSaveArtwork({
      id: artworkIdRef.current,
      templateId: template.id,
      title: template.title,
      previewDataUrl,
      paintDataUrl,
      lineArtUrl: template.lineArtUrl,
      updatedAt: Date.now(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleDownloadPng = () => {
    const dataUrl = buildCompositeDataUrl();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    const safeName = template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'coloring';
    link.download = `${safeName}.png`;
    link.click();
  };

  const tools: { id: ToolType; label: string; icon: React.ReactNode }[] = [
    { id: 'fill', label: 'Fill', icon: <PaintBucket className="h-5 w-5" /> },
    { id: 'crayon', label: 'Crayon', icon: <Pencil className="h-5 w-5" /> },
    { id: 'marker', label: 'Marker', icon: <PenTool className="h-5 w-5" /> },
    { id: 'rainbow', label: 'Rainbow', icon: <Sparkles className="h-5 w-5" /> },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="h-5 w-5" /> },
  ];

  const cycleBrushSize = () => {
    setBrushSize((prev) => (prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'sm'));
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] bg-[#FAF8F4] select-none overflow-hidden">
      {/* Studio Sub-Header */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 bg-white border-b border-[#E8E3DA] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] px-3 py-2 text-xs sm:text-sm font-semibold text-[#1E2430] hover:bg-[#EFEAE0] shrink-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Pages</span>
          </button>
          <h1 className="text-sm sm:text-lg font-bold text-[#1E2430] truncate">
            {template.title}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Undo"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E8E3DA] bg-white text-[#1E2430] hover:bg-[#FAF8F4] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Redo"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E8E3DA] bg-white text-[#1E2430] hover:bg-[#FAF8F4] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            aria-label="Clear Page"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E8E3DA] bg-white text-[#5C6473] hover:bg-[#FFF0EB] hover:text-[#D9381E] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleSaveToArtbook}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#1E2430] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#31394A] cursor-pointer"
          >
            {savedNotice ? (
              <>
                <Check className="h-4 w-4 text-[#4ADE80]" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <BookmarkCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            aria-label="Download PNG"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[#FF5A36] px-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#E84C29] cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span className="hidden md:inline ml-1.5">Export</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Desktop Left Tool Rail */}
        <aside className="hidden lg:flex w-56 flex-col justify-between border-r border-[#E8E3DA] bg-white p-4 shrink-0 overflow-y-auto">
          <div className="space-y-5">
            <div>
              <div className="text-xs font-semibold text-[#5C6473] mb-2">Tools</div>
              <div className="grid grid-cols-1 gap-1.5">
                {tools.map((tool) => {
                  const active = activeTool === tool.id && !isPanMode;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        setIsPanMode(false);
                        setActiveTool(tool.id);
                      }}
                      className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#FF5A36] text-white'
                          : 'bg-[#FAF8F4] text-[#1E2430] hover:bg-[#EFEAE0]'
                      }`}
                    >
                      {tool.icon}
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-[#5C6473] mb-2">Brush Size</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['sm', 'md', 'lg'] as BrushSize[]).map((sz) => {
                  const active = brushSize === sz;
                  const dotSize = sz === 'sm' ? 'h-2.5 w-2.5' : sz === 'md' ? 'h-4 w-4' : 'h-6 w-6';
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setBrushSize(sz)}
                      aria-label={`Brush size ${sz}`}
                      className={`flex min-h-[44px] items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                        active
                          ? 'border-[#FF5A36] bg-[#FFF2EE]'
                          : 'border-[#E8E3DA] bg-[#FAF8F4] hover:bg-[#EFEAE0]'
                      }`}
                    >
                      <span className={`rounded-full bg-[#1E2430] ${dotSize}`} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#5C6473] mb-2">
                <span>Zoom</span>
                <span className="tabular-nums text-[#1E2430]">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom - 0.25)}
                  disabled={zoom <= 1}
                  aria-label="Zoom out"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] text-[#1E2430] hover:bg-[#EFEAE0] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => handleZoomChange(Number(e.target.value))}
                  aria-label="Zoom level"
                  className="w-full accent-[#FF5A36] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom + 0.25)}
                  disabled={zoom >= 3}
                  aria-label="Zoom in"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] text-[#1E2430] hover:bg-[#EFEAE0] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
              {zoom > 1 && (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPanMode((prev) => !prev)}
                    className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      isPanMode
                        ? 'border-[#1E2430] bg-[#1E2430] text-white'
                        : 'border-[#E8E3DA] bg-[#FAF8F4] text-[#1E2430] hover:bg-[#EFEAE0]'
                    }`}
                  >
                    <Hand className="h-3.5 w-3.5" />
                    <span>Move</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="flex min-h-[44px] items-center justify-center rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] text-xs font-semibold text-[#1E2430] hover:bg-[#EFEAE0] cursor-pointer"
                  >
                    Reset 1x
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F2EDE4] text-xs text-[#5C6473]">
            {isPanMode
              ? 'Drag the sheet to pan while zoomed in.'
              : activeTool === 'fill'
              ? 'Tap inside any shape to fill it cleanly with color.'
              : 'Draw freely—outlines stay sharp on top.'}
          </div>
        </aside>

        {/* Center Paper Sheet */}
        <main className="flex-1 flex items-center justify-center p-2 sm:p-5 lg:p-6 min-h-0 overflow-hidden">
          <div
            ref={viewportRef}
            className="relative aspect-square w-full max-w-[min(100%,calc(100dvh-310px))] lg:max-w-[min(100%,calc(100dvh-132px))] rounded-2xl sm:rounded-3xl bg-white shadow-md border border-[#E8E3DA] overflow-hidden"
          >
            <div
              className="relative h-full w-full origin-center"
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              }}
            >
              <canvas
                ref={paintCanvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`absolute inset-0 h-full w-full touch-none ${
                  isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
                }`}
              />
              <canvas
                ref={lineCanvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
            </div>
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-semibold text-[#5C6473]">
                Preparing drawing sheet...
              </div>
            )}
          </div>
        </main>

        {/* Desktop Right Crayon Box & Pattern Fill Menu */}
        <aside className="hidden lg:flex w-52 flex-col border-l border-[#E8E3DA] bg-white p-4 shrink-0 overflow-y-auto space-y-5">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5C6473] mb-3">
              <Palette className="h-4 w-4" />
              <span>Crayon Box</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CRAYON_PALETTE.map((swatch) => {
                const selected =
                  activeColor === swatch.hex &&
                  activeTool !== 'eraser' &&
                  activeTool !== 'rainbow';
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => {
                      setActiveColor(swatch.hex);
                      setIsPanMode(false);
                      if (activeTool === 'eraser' || activeTool === 'rainbow') {
                        setActiveTool('fill');
                      }
                    }}
                    aria-label={swatch.name}
                    title={swatch.name}
                    className={`flex h-11 w-full items-center justify-center rounded-xl border transition-transform cursor-pointer ${
                      selected
                        ? 'scale-105 border-[#1E2430] ring-2 ring-[#1E2430] ring-offset-2'
                        : 'border-[#E8E3DA] hover:scale-105'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {selected && (
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          swatch.hex === '#FFFFFF' || swatch.hex === '#FFD22E'
                            ? 'bg-[#1E2430]'
                            : 'bg-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F2EDE4]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5C6473] mb-2.5">
              <span>Fill Pattern</span>
              <span className="text-[#1E2430]">{activePatternLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PATTERN_OPTIONS.map((pattern) => {
                const isSelected =
                  activePattern === pattern.id && activeTool === 'fill' && !isPanMode;
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => {
                      setActivePattern(pattern.id);
                      setActiveTool('fill');
                      setIsPanMode(false);
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#FF5A36] bg-[#FFF2EE]'
                        : 'border-[#E8E3DA] bg-[#FAF8F4] hover:bg-[#EFEAE0]'
                    }`}
                  >
                    <img
                      src={patternPreviews[pattern.id]}
                      alt={`${pattern.label} fill pattern`}
                      className="h-9 w-full rounded-lg border border-[#E8E3DA] object-cover"
                    />
                    <span className="text-[11px] font-semibold text-[#1E2430] truncate max-w-full">
                      {pattern.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Android / Mobile Thumb-Zone Dock */}
      <div className="lg:hidden bg-white border-t border-[#E8E3DA] px-2 pt-2 pb-2 pb-safe shrink-0 space-y-2">
        {/* Expandable Pattern Fill Menu */}
        {showMobilePatterns && (
          <div className="rounded-2xl border border-[#E8E3DA] bg-[#FAF8F4] p-2">
            <div className="flex items-center justify-between px-1 pb-1.5">
              <span className="text-xs font-semibold text-[#1E2430]">
                Fill Pattern
              </span>
              <span className="text-xs font-semibold text-[#FF5A36]">
                {activePatternLabel}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PATTERN_OPTIONS.map((pattern) => {
                const isSelected = activePattern === pattern.id;
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => {
                      setActivePattern(pattern.id);
                      setActiveTool('fill');
                      setIsPanMode(false);
                      setShowMobilePatterns(false);
                    }}
                    className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border p-1.5 cursor-pointer ${
                      isSelected
                        ? 'border-[#FF5A36] bg-white ring-1 ring-[#FF5A36]'
                        : 'border-[#E8E3DA] bg-white/80'
                    }`}
                  >
                    <img
                      src={patternPreviews[pattern.id]}
                      alt={pattern.label}
                      className="h-7 w-full rounded-lg border border-[#E8E3DA] object-cover"
                    />
                    <span className="text-[11px] font-semibold text-[#1E2430] truncate max-w-full">
                      {pattern.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Zoom Slider Row */}
        <div className="flex items-center gap-1.5 px-1">
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.25)}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] text-[#1E2430] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            aria-label="Zoom slider"
            className="flex-1 accent-[#FF5A36] h-2 cursor-pointer"
          />
          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.25)}
            disabled={zoom >= 3}
            aria-label="Zoom in"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] text-[#1E2430] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="min-w-[46px] text-center text-xs font-bold tabular-nums text-[#1E2430]">
            {Math.round(zoom * 100)}%
          </span>
          {zoom > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIsPanMode((prev) => !prev)}
                aria-label="Move zoomed canvas"
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border cursor-pointer ${
                  isPanMode
                    ? 'border-[#1E2430] bg-[#1E2430] text-white'
                    : 'border-[#E8E3DA] bg-[#FAF8F4] text-[#1E2430]'
                }`}
              >
                <Hand className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="min-h-[44px] rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] px-2.5 text-xs font-semibold text-[#1E2430] cursor-pointer"
              >
                1x
              </button>
            </>
          )}
        </div>

        {/* Pattern Menu Trigger + Swatches Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 py-0.5">
          <button
            type="button"
            onClick={() => setShowMobilePatterns((prev) => !prev)}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold cursor-pointer ${
              showMobilePatterns || activePattern !== 'solid'
                ? 'border-[#FF5A36] bg-[#FFF2EE] text-[#1E2430]'
                : 'border-[#D5CFC3] bg-[#FAF8F4] text-[#1E2430]'
            }`}
          >
            <img
              src={patternPreviews[activePattern]}
              alt={activePatternLabel}
              className="h-6 w-6 rounded-full border border-[#D5CFC3] object-cover"
            />
            <span>{activePatternLabel}</span>
            {showMobilePatterns ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#5C6473]" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-[#5C6473]" />
            )}
          </button>

          {CRAYON_PALETTE.map((swatch) => {
            const selected =
              activeColor === swatch.hex &&
              activeTool !== 'eraser' &&
              activeTool !== 'rainbow';
            return (
              <button
                key={swatch.id}
                type="button"
                onClick={() => {
                  setActiveColor(swatch.hex);
                  setIsPanMode(false);
                  if (activeTool === 'eraser' || activeTool === 'rainbow') {
                    setActiveTool('fill');
                  }
                }}
                aria-label={swatch.name}
                className={`h-11 w-11 shrink-0 rounded-full border transition-transform cursor-pointer ${
                  selected
                    ? 'scale-110 border-[#1E2430] ring-2 ring-[#1E2430] ring-offset-1'
                    : 'border-[#D5CFC3]'
                }`}
                style={{ backgroundColor: swatch.hex }}
              />
            );
          })}
        </div>

        {/* Tools + Size Cycler Row */}
        <div className="flex items-center justify-between gap-1">
          {tools.map((tool) => {
            const active = activeTool === tool.id && !isPanMode;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setIsPanMode(false);
                  setActiveTool(tool.id);
                }}
                className={`flex flex-1 min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#FF5A36] text-white'
                    : 'bg-[#FAF8F4] text-[#4B5362]'
                }`}
              >
                {tool.icon}
                <span>{tool.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={cycleBrushSize}
            aria-label="Change brush size"
            className="flex min-h-[44px] min-w-[48px] flex-col items-center justify-center rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] px-2 text-[11px] font-bold text-[#1E2430] cursor-pointer"
          >
            <span
              className={`rounded-full bg-[#1E2430] mb-0.5 ${
                brushSize === 'sm' ? 'h-2 w-2' : brushSize === 'md' ? 'h-3 w-3' : 'h-4 w-4'
              }`}
            />
            <span>{brushSize.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {confirmClear && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2430]/50 p-4 backdrop-blur-xs"
          onClick={() => setConfirmClear(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-[#E8E3DA]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[#1E2430]">Start this page over?</h2>
            <p className="mt-1.5 text-sm text-[#5C6473]">
              This clears your colors back to fresh white paper. You can still tap Undo right after.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="min-h-[44px] rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] text-sm font-semibold text-[#1E2430] hover:bg-[#EFEAE0] cursor-pointer"
              >
                Keep Coloring
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="min-h-[44px] rounded-xl bg-[#D9381E] text-sm font-semibold text-white hover:bg-[#B82D16] cursor-pointer"
              >
                Clear Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
