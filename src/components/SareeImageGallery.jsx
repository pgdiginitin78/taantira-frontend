import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  Move,
  RotateCcw,
  Share2,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { buildGalleryAngles } from '../utils/galleryAngles';

const ZOOM_STEPS = [1, 1.5, 2, 2.5, 3];
const ZOOM_PRESETS = [
  { scale: 1, label: '1×' },
  { scale: 1.5, label: '1.5×' },
  { scale: 2, label: '2×' },
  { scale: 3, label: '3×' },
];

export default function SareeImageGallery({
  product,
  wishlisted = false,
  onToggleWishlist,
  onShare,
}) {
  const angles = product?.gallery_angles?.length ? product.gallery_angles : buildGalleryAngles(product);
  const availableCount = angles.filter((a) => a.status === 'available' && a.image_url).length;
  const firstAvailableIdx = Math.max(0, angles.findIndex((a) => a.status === 'available' && a.image_url));

  const [activeIndex, setActiveIndex] = useState(firstAvailableIdx);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0.5, y: 0.5 });
  const [hoverPoint, setHoverPoint] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [failedUrls, setFailedUrls] = useState({});

  const imgRef = useRef(null);
  const loupeCanvasRef = useRef(null);
  const zoomCanvasRef = useRef(null);
  const modalZoomCanvasRef = useRef(null);
  const dragStartRef = useRef(null);
  const touchStartXRef = useRef(null);
  const pinchStartRef = useRef(null);
  const lastTapRef = useRef(0);

  const activeAngle = angles[activeIndex] || angles[0];
  const hasImage = Boolean(activeAngle?.image_url) && !failedUrls[activeAngle?.image_url];

  const selectAngle = useCallback(
    (nextIndex) => {
      const clamped = ((nextIndex % angles.length) + angles.length) % angles.length;
      setActiveIndex(clamped);
      setZoom(1);
      setPan({ x: 0.5, y: 0.5 });
      setHoverPoint(null);
    },
    [angles.length]
  );

  const setZoomPreset = useCallback(
    (scale) => {
      if (!hasImage) return;
      setZoom(scale);
      if (scale <= 1) {
        setPan({ x: 0.5, y: 0.5 });
      }
    },
    [hasImage]
  );

  const handleZoomIn = useCallback(() => {
    if (!hasImage) return;
    setZoom((prev) => {
      const next = ZOOM_STEPS.find((s) => s > prev);
      return next || ZOOM_STEPS[ZOOM_STEPS.length - 1];
    });
  }, [hasImage]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const lower = [...ZOOM_STEPS].reverse().find((s) => s < prev);
      const next = lower || 1;
      if (next === 1) setPan({ x: 0.5, y: 0.5 });
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0.5, y: 0.5 });
    setHoverPoint(null);
  }, []);

  useEffect(() => {
    if (!fullscreenOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFullscreenOpen(false);
      } else if (e.key === 'ArrowRight') {
        selectAngle(activeIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        selectAngle(activeIndex - 1);
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreenOpen, activeIndex, selectAngle, handleZoomIn, handleZoomOut]);

  useEffect(() => {
    const canvas = loupeCanvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !hoverPoint || !hasImage || zoom > 1 || !img.complete || img.naturalWidth === 0) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const magnifierScale = 3.2;
    const cropWidth = img.naturalWidth / magnifierScale;
    const cropHeight = img.naturalHeight / magnifierScale;
    const centerX = hoverPoint.x * img.naturalWidth;
    const centerY = hoverPoint.y * img.naturalHeight;
    const sx = Math.max(0, Math.min(img.naturalWidth - cropWidth, centerX - cropWidth / 2));
    const sy = Math.max(0, Math.min(img.naturalHeight - cropHeight, centerY - cropHeight / 2));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  }, [hoverPoint, hasImage, zoom, activeAngle?.image_url]);

  const drawZoomedCanvas = useCallback(
    (canvas) => {
      const img = imgRef.current;
      if (!canvas || !img || !hasImage || zoom <= 1 || !img.complete || img.naturalWidth === 0) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const viewW = img.naturalWidth / zoom;
      const viewH = img.naturalHeight / zoom;
      const sx = Math.max(0, Math.min(img.naturalWidth - viewW, pan.x * img.naturalWidth - viewW / 2));
      const sy = Math.max(0, Math.min(img.naturalHeight - viewH, pan.y * img.naturalHeight - viewH / 2));

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, viewW, viewH, 0, 0, canvas.width, canvas.height);
    },
    [hasImage, zoom, pan]
  );

  useEffect(() => {
    drawZoomedCanvas(zoomCanvasRef.current);
    if (fullscreenOpen) {
      drawZoomedCanvas(modalZoomCanvasRef.current);
    }
  }, [drawZoomedCanvas, fullscreenOpen, activeAngle?.image_url]);

  const handleMouseMove = (e) => {
    if (!hasImage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setHoverPoint({ x, y });
  };

  const handlePointerDown = (e) => {
    if (!hasImage || zoom <= 1) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragStartRef.current || zoom <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dx = (e.clientX - dragStartRef.current.x) / rect.width;
    const dy = (e.clientY - dragStartRef.current.y) / rect.height;
    setPan({
      x: Math.max(0, Math.min(1, dragStartRef.current.panX - dx / zoom)),
      y: Math.max(0, Math.min(1, dragStartRef.current.panY - dy / zoom)),
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleViewerClick = () => {
    if (!hasImage || isDragging) return;
    if (zoom === 1) {
      setZoom(2);
      if (hoverPoint) setPan(hoverPoint);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2 && hasImage) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartRef.current = { dist: Math.hypot(dx, dy), zoom };
      return;
    }
    if (e.touches.length === 1) {
      const now = Date.now();
      if (hasImage && now - lastTapRef.current < 280) {
        setZoom((z) => (z > 1 ? 1 : 2));
        setPan({ x: 0.5, y: 0.5 });
      }
      lastTapRef.current = now;
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchStartRef.current && hasImage) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scaleRatio = dist / Math.max(1, pinchStartRef.current.dist);
      const next = Math.max(1, Math.min(3, Number((pinchStartRef.current.zoom * scaleRatio).toFixed(2))));
      setZoom(next);
    }
  };

  const handleTouchEnd = (e) => {
    pinchStartRef.current = null;
    if (zoom === 1 && touchStartXRef.current !== null && e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
      if (Math.abs(deltaX) > 48) {
        selectAngle(deltaX < 0 ? activeIndex + 1 : activeIndex - 1);
      }
    }
    touchStartXRef.current = null;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <div className="flex flex-row items-center gap-2 overflow-x-auto pb-1 sm:w-16 sm:flex-col sm:overflow-visible sm:pb-0 lg:w-20">
          {angles.map((angle, idx) => {
            const isSelected = idx === activeIndex;
            const thumbAvailable = angle.status === 'available' && angle.image_url && !failedUrls[angle.image_url];
            return (
              <button
                key={angle.key || idx}
                type="button"
                onClick={() => selectAngle(idx)}
                data-angle-thumb={angle.key}
                aria-label={`${angle.label} (${thumbAvailable ? 'Available' : 'Image needed'})`}
                className={`relative aspect-[3/4] w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border text-left transition sm:w-full ${
                  isSelected
                    ? 'border-[#641B32] ring-2 ring-[#641B32]/40'
                    : 'border-[#D9A0A9]/60 bg-[#FFF9F2] opacity-85 hover:opacity-100'
                }`}
              >
                {thumbAvailable ? (
                  <img
                    src={angle.image_url}
                    alt={angle.alt_text || angle.label}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-[#F5E7E8]/60 p-1 text-center">
                    <Camera className="h-3.5 w-3.5 text-[#A83F5E]" />
                    <span className="mt-1 text-[9px] font-semibold leading-tight text-[#641B32]">
                      {angle.label.split(' ')[0]}
                    </span>
                    <span className="text-[8px] text-[#A83F5E]">Pending</span>
                  </div>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => selectAngle(activeIndex + 1)}
            aria-label="Next saree angle thumbnail"
            className="hidden h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#D9A0A9]/60 bg-white text-[#641B32] shadow-sm hover:bg-[#F5E7E8] sm:inline-flex"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1">
          <div
            data-testid="gallery-main-stage"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverPoint(null)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleViewerClick}
            className={`relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl border border-[#D9A0A9]/45 bg-[#FFF9F2] shadow-sm transition-shadow duration-300 ${
              zoom > 1 ? 'ring-2 ring-[#C39A52]/60 shadow-lg' : ''
            } ${hasImage && zoom > 1 ? 'cursor-grab active:cursor-grabbing' : hasImage ? 'cursor-zoom-in' : ''}`}
          >
            {hasImage ? (
              <>
                <img
                  ref={imgRef}
                  src={activeAngle.image_url}
                  alt={activeAngle.alt_text || product?.name}
                  onError={() =>
                    setFailedUrls((prev) => ({
                      ...prev,
                      [activeAngle.image_url]: true,
                    }))
                  }
                  className={`h-full w-full object-cover object-top transition-transform duration-300 ${
                    zoom > 1 ? 'hidden' : 'block'
                  }`}
                />
                {zoom > 1 && (
                  <canvas
                    ref={zoomCanvasRef}
                    width={900}
                    height={1200}
                    aria-label="Zoomed saree detail view"
                    className="h-full w-full touch-none object-cover"
                  />
                )}
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#FFF9F2] via-[#F5E7E8]/50 to-[#F5E7E8] p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D9A0A9] bg-white text-[#641B32] shadow-sm">
                  <Camera className="h-7 w-7" />
                </div>
                <span className="mt-4 rounded-full border border-[#C39A52] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#641B32]">
                  Angle {activeAngle?.angleNumber} of 5 · Image Needed
                </span>
                <h3 className="mt-3 font-serif text-xl font-semibold text-[#3D1023]">
                  {activeAngle?.label}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-[#641B32]/80">
                  {activeAngle?.desc}
                </p>
                <p className="mt-4 text-xs text-[#A83F5E]">
                  {availableCount} of 5 photography angles captured for {product?.name}.
                </p>
                {availableCount > 0 && activeIndex !== firstAvailableIdx && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAngle(firstAvailableIdx);
                    }}
                    className="mt-4 cursor-pointer rounded-full bg-[#641B32] px-4 py-2 text-xs font-semibold text-[#FFF9F2] transition hover:bg-[#3D1023]"
                  >
                    Return to Available View ({angles[firstAvailableIdx]?.label})
                  </button>
                )}
              </div>
            )}

            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#220713]/75 px-3 py-1 text-[11px] font-medium text-[#FFF9F2] backdrop-blur-md">
              <span>{activeIndex + 1} / {angles.length}</span>
              <span className="text-[#C39A52]">·</span>
              <span className="max-w-36 truncate">{activeAngle?.label}</span>
            </div>

            {hasImage && zoom > 1 && (
              <div
                data-testid="zoom-hud-banner"
                onClick={(e) => e.stopPropagation()}
                className="absolute left-1/2 top-12 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#C39A52]/60 bg-[#220713]/85 px-3.5 py-1.5 text-[11px] font-semibold text-[#FFF9F2] shadow-xl backdrop-blur-md"
              >
                <Move className="h-3.5 w-3.5 text-[#C39A52]" />
                <span className="whitespace-nowrap">Drag to inspect weave · {Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="cursor-pointer rounded-full bg-[#C39A52] px-2 py-0.5 text-[10px] font-bold text-[#3D1023] hover:bg-[#FFF9F2]"
                >
                  Reset
                </button>
              </div>
            )}

            {hasImage && zoom === 1 && !hoverPoint && (
              <div className="pointer-events-none absolute right-14 top-3 hidden items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-[#641B32] shadow-sm backdrop-blur-md lg:inline-flex">
                <Sparkles className="h-3 w-3 text-[#C39A52]" />
                Hover to inspect zari
              </div>
            )}

            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-3 top-3 flex flex-col gap-2"
            >
              {onToggleWishlist && (
                <button
                  type="button"
                  onClick={onToggleWishlist}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border shadow-md backdrop-blur-md transition ${
                    wishlisted
                      ? 'border-[#641B32] bg-[#641B32] text-[#FFF9F2] ring-2 ring-[#C39A52]/60'
                      : 'border-[#D9A0A9]/50 bg-white/90 text-[#3D1023] hover:bg-[#F5E7E8]'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${wishlisted ? 'fill-current' : ''}`} />
                </button>
              )}
              {onShare && (
                <button
                  type="button"
                  onClick={onShare}
                  aria-label="Share saree link"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#D9A0A9]/50 bg-white/90 text-[#3D1023] shadow-md backdrop-blur-md transition hover:bg-[#F5E7E8]"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setFullscreenOpen(true)}
                aria-label="Open fullscreen gallery"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#D9A0A9]/50 bg-white/90 text-[#3D1023] shadow-md backdrop-blur-md transition hover:bg-[#641B32] hover:text-[#FFF9F2]"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectAngle(activeIndex - 1);
              }}
              aria-label="Previous angle"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#3D1023] shadow-md backdrop-blur-md transition hover:bg-[#641B32] hover:text-[#FFF9F2]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectAngle(activeIndex + 1);
              }}
              aria-label="Next angle"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#3D1023] shadow-md backdrop-blur-md transition hover:bg-[#641B32] hover:text-[#FFF9F2]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {hasImage && (
              <div
                onClick={(e) => e.stopPropagation()}
                data-testid="zoom-studio-dock"
                className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#C39A52]/50 bg-[#220713]/85 px-2 py-1 text-[#FFF9F2] shadow-2xl backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  aria-label="Zoom out"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center gap-0.5 rounded-full bg-white/10 p-0.5">
                  {ZOOM_PRESETS.map((preset) => {
                    const active = Math.abs(zoom - preset.scale) < 0.05;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setZoomPreset(preset.scale)}
                        data-testid={`zoom-preset-${preset.label}`}
                        className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                          active
                            ? 'bg-[#C39A52] text-[#3D1023] shadow-sm'
                            : 'text-[#FFF9F2]/80 hover:bg-white/15 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  aria-label="Zoom in"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>

                {zoom > 1 && (
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    aria-label="Reset zoom"
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#C39A52]/50 text-[#C39A52] transition hover:bg-[#C39A52] hover:text-[#3D1023]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {hasImage && zoom === 1 && hoverPoint && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-16 left-3 hidden flex-col items-center gap-1.5 rounded-3xl border border-[#C39A52]/70 bg-[#220713]/90 p-2 shadow-2xl backdrop-blur-xl lg:flex"
              >
                <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-[#C39A52] ring-2 ring-white/30">
                  <canvas ref={loupeCanvasRef} width={180} height={180} className="block h-full w-full" />
                  <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#C39A52]/40" />
                  <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#C39A52]/40" />
                </div>
                <div className="flex items-center gap-1.5 px-2 text-[10px] font-semibold tracking-wider text-[#FFF9F2]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C39A52]" />
                  <span>3.2× WEAVE MACRO</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {fullscreenOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${product?.name} fullscreen gallery`}
          onClick={() => setFullscreenOpen(false)}
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[#18040C]/95 p-4 text-[#FFF9F2] backdrop-blur-md sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-[#C39A52]">
                {activeIndex + 1} / {angles.length} · {activeAngle?.label}
              </p>
              <h2 className="font-serif text-lg font-semibold text-[#FFF9F2]">{product?.name}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasImage && (
                <div className="flex items-center gap-1 rounded-full border border-[#C39A52]/40 bg-[#3D1023]/90 p-1">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                    aria-label="Fullscreen zoom out"
                    className="cursor-pointer rounded-full p-1.5 text-[#FFF9F2] hover:bg-[#641B32] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  {ZOOM_PRESETS.map((preset) => {
                    const active = Math.abs(zoom - preset.scale) < 0.05;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setZoomPreset(preset.scale)}
                        className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                          active
                            ? 'bg-[#C39A52] text-[#3D1023]'
                            : 'text-[#FFF9F2]/80 hover:bg-[#641B32]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    aria-label="Fullscreen zoom in"
                    className="cursor-pointer rounded-full p-1.5 text-[#FFF9F2] hover:bg-[#641B32] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setFullscreenOpen(false)}
                aria-label="Close fullscreen gallery"
                className="cursor-pointer rounded-full bg-[#C39A52] p-2 text-[#3D1023] hover:bg-[#FFF9F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative mx-auto my-3 flex w-full max-w-4xl flex-1 items-center justify-center overflow-hidden"
          >
            <button
              type="button"
              onClick={() => selectAngle(activeIndex - 1)}
              aria-label="Previous fullscreen angle"
              className="absolute left-2 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#3D1023]/90 text-[#FFF9F2] hover:bg-[#641B32]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {hasImage ? (
              zoom > 1 ? (
                <canvas
                  ref={modalZoomCanvasRef}
                  width={900}
                  height={1200}
                  className="max-h-full max-w-full cursor-grab touch-none rounded-2xl border border-[#C39A52]/40 object-contain"
                />
              ) : (
                <img
                  src={activeAngle.image_url}
                  alt={activeAngle.alt_text || product?.name}
                  className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl"
                />
              )
            ) : (
              <div className="flex max-w-md flex-col items-center rounded-2xl border border-[#D9A0A9]/40 bg-[#3D1023] p-8 text-center">
                <Camera className="h-10 w-10 text-[#C39A52]" />
                <p className="mt-3 font-serif text-xl font-semibold">{activeAngle?.label}</p>
                <p className="mt-2 text-sm text-[#FFF9F2]/80">{activeAngle?.desc}</p>
                <span className="mt-4 rounded-full bg-[#641B32] px-3 py-1 text-xs font-semibold">
                  Image Needed ({availableCount}/5 Uploaded)
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => selectAngle(activeIndex + 1)}
              aria-label="Next fullscreen angle"
              className="absolute right-2 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#3D1023]/90 text-[#FFF9F2] hover:bg-[#641B32]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex max-w-2xl items-center gap-2 overflow-x-auto pb-1"
          >
            {angles.map((angle, idx) => {
              const thumbAvailable = angle.status === 'available' && angle.image_url && !failedUrls[angle.image_url];
              return (
                <button
                  key={angle.key || idx}
                  type="button"
                  onClick={() => selectAngle(idx)}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                    idx === activeIndex
                      ? 'border-[#C39A52] bg-[#C39A52] font-semibold text-[#3D1023]'
                      : 'border-[#D9A0A9]/40 bg-[#3D1023] text-[#FFF9F2]/80 hover:border-[#FFF9F2]'
                  }`}
                >
                  {thumbAvailable && (
                    <img
                      src={angle.image_url}
                      alt={angle.label}
                      className="h-5 w-4 rounded object-cover object-top"
                    />
                  )}
                  <span>{idx + 1}. {angle.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
