import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCcw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { buildGalleryAngles } from '../utils/fallbackCatalog';

const ZOOM_STEPS = [1, 1.5, 2, 2.5, 3];

export default function SareeImageGallery({ product }) {
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

  // Keyboard navigation in fullscreen or gallery
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

  // Draw hover magnifier loupe into canvas (zero inline styles)
  useEffect(() => {
    const canvas = loupeCanvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !hoverPoint || !hasImage || zoom > 1 || !img.complete || img.naturalWidth === 0) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const magnifierScale = 2.8;
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

  // Draw panned/zoomed view on main or fullscreen canvas when zoom > 1
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
        {/* Desktop Vertical Thumbnails / Mobile Horizontal Strip */}
        <div
          className="flex flex-row gap-2 overflow-x-auto pb-1 sm:w-16 sm:flex-col sm:overflow-visible sm:pb-0 lg:w-20"
          aria-label="Saree viewing angles"
        >
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
                className={`relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-xl border text-left transition sm:w-full ${
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
                <span className="absolute bottom-1 left-1 rounded bg-[#3D1023]/80 px-1.5 py-0.5 text-[9px] font-semibold text-[#FFF9F2]">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Image / Magnifier Stage */}
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
            className={`relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl border border-[#D9A0A9]/50 bg-[#FFF9F2] shadow-sm ${
              hasImage && zoom > 1 ? 'cursor-grab active:cursor-grabbing' : hasImage ? 'cursor-zoom-in' : ''
            }`}
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
                  className={`h-full w-full object-cover object-top ${zoom > 1 ? 'hidden' : 'block'}`}
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
                  {availableCount} of 5 photography angles captured for {product?.name}. We never repeat or reuse mismatched saree photos across slots.
                </p>
                {availableCount > 0 && activeIndex !== firstAvailableIdx && (
                  <button
                    type="button"
                    onClick={() => selectAngle(firstAvailableIdx)}
                    className="mt-4 rounded-full bg-[#641B32] px-4 py-2 text-xs font-semibold text-[#FFF9F2] transition hover:bg-[#3D1023]"
                  >
                    Return to Available View ({angles[firstAvailableIdx]?.label})
                  </button>
                )}
              </div>
            )}

            {/* Angle Indicator Pill */}
            <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#3D1023]/85 px-3 py-1 text-xs font-medium text-[#FFF9F2]">
              {activeIndex + 1} / {angles.length} · {activeAngle?.label}
            </div>

            {/* Top-Right Zoom & Fullscreen Toolbar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-[#D9A0A9]/60 bg-white/95 p-1 shadow-sm"
            >
              {hasImage && (
                <>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                    aria-label="Zoom out"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#641B32] transition hover:bg-[#F5E7E8] disabled:opacity-40"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="min-w-10 text-center text-[11px] font-semibold text-[#3D1023]">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    aria-label="Zoom in"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#641B32] transition hover:bg-[#F5E7E8] disabled:opacity-40"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  {zoom > 1 && (
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      aria-label="Reset zoom"
                      className="flex h-7 items-center gap-1 rounded-full bg-[#F5E7E8] px-2 text-[11px] font-semibold text-[#641B32] hover:bg-[#D9A0A9]/40"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => setFullscreenOpen(true)}
                aria-label="Open fullscreen gallery"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#641B32] text-[#FFF9F2] transition hover:bg-[#3D1023]"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Prev / Next Controls */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectAngle(activeIndex - 1);
              }}
              aria-label="Previous angle"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#D9A0A9]/70 bg-white/95 text-[#641B32] shadow-sm transition hover:bg-[#641B32] hover:text-[#FFF9F2]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                selectAngle(activeIndex + 1);
              }}
              aria-label="Next angle"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#D9A0A9]/70 bg-white/95 text-[#641B32] shadow-sm transition hover:bg-[#641B32] hover:text-[#FFF9F2]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Hover Zari & Weave Loupe Window (Desktop) */}
            {hasImage && zoom === 1 && hoverPoint && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 right-3 hidden overflow-hidden rounded-2xl border-2 border-[#C39A52] bg-[#FFF9F2] shadow-xl lg:block"
              >
                <canvas ref={loupeCanvasRef} width={180} height={180} className="block h-36 w-36" />
                <div className="border-t border-[#D9A0A9]/40 bg-[#3D1023] px-2.5 py-1 text-center text-[10px] font-medium text-[#FFF9F2]">
                  2.8x Zari & Weave Loupe
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#641B32]/80">
            <span className="inline-flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-[#A83F5E]" />
              {hasImage
                ? zoom > 1
                  ? 'Drag image to pan weave & zari details · Click Reset to exit zoom'
                  : 'Hover for 2.8x weave loupe · Click image or + to zoom · Swipe or use arrows for 5 angles'
                : `${availableCount}/5 photography angles uploaded`}
            </span>
            <span className="font-medium text-[#641B32]">
              {availableCount}/5 Angles Complete
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${product?.name} fullscreen gallery`}
          onClick={() => setFullscreenOpen(false)}
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[#220713]/95 p-4 text-[#FFF9F2] sm:p-6"
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
            <div className="flex items-center gap-2">
              {hasImage && (
                <>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                    aria-label="Fullscreen zoom out"
                    className="rounded-full border border-[#D9A0A9]/40 bg-[#3D1023] p-2 text-[#FFF9F2] hover:bg-[#641B32] disabled:opacity-40"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold">{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    aria-label="Fullscreen zoom in"
                    className="rounded-full border border-[#D9A0A9]/40 bg-[#3D1023] p-2 text-[#FFF9F2] hover:bg-[#641B32] disabled:opacity-40"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  {zoom > 1 && (
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      className="rounded-full border border-[#D9A0A9]/40 bg-[#3D1023] px-3 py-1.5 text-xs font-medium hover:bg-[#641B32]"
                    >
                      Reset
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => setFullscreenOpen(false)}
                aria-label="Close fullscreen gallery"
                className="rounded-full bg-[#C39A52] p-2 text-[#3D1023] hover:bg-[#FFF9F2]"
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
            className="relative mx-auto flex my-3 w-full max-w-4xl flex-1 items-center justify-center overflow-hidden"
          >
            <button
              type="button"
              onClick={() => selectAngle(activeIndex - 1)}
              aria-label="Previous fullscreen angle"
              className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#3D1023]/90 text-[#FFF9F2] hover:bg-[#641B32]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {hasImage ? (
              zoom > 1 ? (
                <canvas
                  ref={modalZoomCanvasRef}
                  width={900}
                  height={1200}
                  className="max-h-full max-w-full cursor-grab touch-none rounded-xl object-contain"
                />
              ) : (
                <img
                  src={activeAngle.image_url}
                  alt={activeAngle.alt_text || product?.name}
                  className="max-h-[75vh] max-w-full rounded-xl object-contain"
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
              className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#3D1023]/90 text-[#FFF9F2] hover:bg-[#641B32]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex max-w-2xl items-center gap-2 overflow-x-auto pb-1"
          >
            {angles.map((angle, idx) => (
              <button
                key={angle.key || idx}
                type="button"
                onClick={() => selectAngle(idx)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                  idx === activeIndex
                    ? 'border-[#C39A52] bg-[#C39A52] font-semibold text-[#3D1023]'
                    : 'border-[#D9A0A9]/40 bg-[#3D1023] text-[#FFF9F2]/80 hover:border-[#FFF9F2]'
                }`}
              >
                <span>{idx + 1}.</span>
                <span>{angle.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
