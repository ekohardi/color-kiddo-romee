import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, RotateCcw, SlidersHorizontal, Upload, Wand2 } from 'lucide-react';
import { ColoringTemplate } from '../types/coloring';
import {
  ConversionMode,
  convertImageToColoringPage,
  loadImageFromFile,
} from '../utils/lineArtProcessor';

interface DesignImporterProps {
  onSaveAndColor: (template: ColoringTemplate) => Promise<void>;
  onCancel: () => void;
}

export const DesignImporter: React.FC<DesignImporterProps> = ({
  onSaveAndColor,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string>('');
  const [convertedUrl, setConvertedUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [mode, setMode] = useState<ConversionMode>('sketch');
  const [sensitivity, setSensitivity] = useState<number>(58);
  const [boldLines, setBoldLines] = useState<boolean>(true);
  const [invert, setInvert] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Re-run client-side line-art extraction whenever options change
  useEffect(() => {
    if (!sourceImage) return;
    try {
      const result = convertImageToColoringPage(sourceImage, {
        mode,
        sensitivity,
        boldLines,
        invert,
      });
      setConvertedUrl(result);
      setErrorMsg('');
    } catch {
      setErrorMsg('Could not process this image. Please try another PNG, JPG, or SVG.');
    }
  }, [sourceImage, mode, sensitivity, boldLines, invert]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please choose an image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    setErrorMsg('');
    try {
      const img = await loadImageFromFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSourcePreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);

      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
      setTitle(baseName ? baseName.slice(0, 40) : 'My Custom Design');
      setSourceImage(img);
    } catch {
      setErrorMsg('Unable to open that image. Try another file from your device.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleSave = async () => {
    if (!convertedUrl || isSaving) return;
    setIsSaving(true);
    try {
      const newTemplate: ColoringTemplate = {
        id: `custom-${Date.now()}`,
        title: title.trim() || 'My Custom Design',
        category: 'My Designs',
        difficulty: 'Easy',
        source: 'custom',
        lineArtUrl: convertedUrl,
        createdAt: Date.now(),
      };
      await onSaveAndColor(newTemplate);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetFile = () => {
    setSourceImage(null);
    setSourcePreviewUrl('');
    setConvertedUrl('');
    setTitle('');
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2430] text-balance">
            Add Your Own Design
          </h1>
          <p className="mt-1 text-sm sm:text-base text-[#5C6473]">
            Upload any sketch, illustration, or photo from your design and turn it into a coloring page.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] rounded-xl border border-[#E8E3DA] bg-white px-4 py-2 text-sm font-semibold text-[#1E2430] hover:bg-[#F2EDE4] cursor-pointer"
        >
          Back to Book
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!sourceImage ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 sm:p-16 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-[#FF5A36] bg-[#FFF2EE]'
              : 'border-[#D5CFC3] bg-white hover:border-[#FF5A36] hover:bg-[#FFFDF9]'
          }`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF2EE] text-[#FF5A36]">
            <ImagePlus className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#1E2430]">
            Choose an image model from your device
          </h2>
          <p className="mt-2 max-w-md text-sm text-[#5C6473]">
            Supports PNG, JPG, WEBP, and SVG. Works with black-and-white drawings or full-color designs.
          </p>
          <span className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#FF5A36] px-6 py-3 text-sm font-semibold text-white shadow-sm">
            <Upload className="h-4 w-4" />
            Select Design Image
          </span>
          {errorMsg && (
            <p className="mt-4 text-sm font-medium text-[#D9381E]">{errorMsg}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main Preview Area */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-[#E8E3DA] bg-white p-4">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold text-[#5C6473]">
                <span>Original Design</span>
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="inline-flex items-center gap-1 text-[#FF5A36] hover:underline cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Change Image
                </button>
              </div>
              <div className="aspect-square w-full overflow-hidden rounded-2xl border border-[#EFEAE0] bg-[#FAF8F4] flex items-center justify-center p-3">
                {sourcePreviewUrl && (
                  <img
                    src={sourcePreviewUrl}
                    alt="Original uploaded design"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E8E3DA] bg-white p-4">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold text-[#5C6473]">
                <span>Coloring Page Preview</span>
                <span>1024 × 1024</span>
              </div>
              <div className="aspect-square w-full overflow-hidden rounded-2xl border border-[#EFEAE0] bg-white flex items-center justify-center p-2">
                {convertedUrl ? (
                  <img
                    src={convertedUrl}
                    alt="Converted coloring outline preview"
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-xs text-[#5C6473]">Converting outlines...</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-5 rounded-3xl border border-[#E8E3DA] bg-white p-5 sm:p-6 space-y-5">
            <div>
              <label htmlFor="design-title" className="block text-sm font-semibold text-[#1E2430]">
                Page Title
              </label>
              <input
                id="design-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., My Dragon Drawing"
                maxLength={48}
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] px-3.5 py-2 text-sm text-[#1E2430] focus:border-[#FF5A36] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-[#1E2430] mb-2">
                Source Image Type
              </div>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#FAF8F4] p-1 border border-[#E8E3DA]">
                <button
                  type="button"
                  onClick={() => setMode('sketch')}
                  className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'sketch'
                      ? 'bg-white text-[#1E2430] shadow-xs border border-[#E8E3DA]'
                      : 'text-[#5C6473] hover:text-[#1E2430]'
                  }`}
                >
                  Line Art / Sketch
                </button>
                <button
                  type="button"
                  onClick={() => setMode('photo')}
                  className={`min-h-[44px] rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'photo'
                      ? 'bg-white text-[#1E2430] shadow-xs border border-[#E8E3DA]'
                      : 'text-[#5C6473] hover:text-[#1E2430]'
                  }`}
                >
                  Color Design / Photo
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[#5C6473]">
                {mode === 'sketch'
                  ? 'Best for black-and-white drawings, SVG models, and clean sketches.'
                  : 'Extracts outer contours from colorful illustrations or photos.'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm font-semibold text-[#1E2430]">
                <span className="inline-flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-[#5C6473]" />
                  Line Detail
                </span>
                <span className="tabular-nums text-xs text-[#5C6473]">{sensitivity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="mt-2 w-full accent-[#FF5A36] h-2 cursor-pointer"
                aria-label="Line detail sensitivity"
              />
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <label className="flex min-h-[44px] items-center justify-between rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] px-3.5 py-2 cursor-pointer">
                <span className="text-sm font-medium text-[#1E2430]">
                  Bold Kid-Friendly Outlines
                </span>
                <input
                  type="checkbox"
                  checked={boldLines}
                  onChange={(e) => setBoldLines(e.target.checked)}
                  className="h-5 w-5 accent-[#FF5A36] rounded cursor-pointer"
                />
              </label>

              <label className="flex min-h-[44px] items-center justify-between rounded-xl border border-[#E8E3DA] bg-[#FAF8F4] px-3.5 py-2 cursor-pointer">
                <span className="text-sm font-medium text-[#1E2430]">
                  Invert Dark Background
                </span>
                <input
                  type="checkbox"
                  checked={invert}
                  onChange={(e) => setInvert(e.target.checked)}
                  className="h-5 w-5 accent-[#FF5A36] rounded cursor-pointer"
                />
              </label>
            </div>

            {errorMsg && (
              <p className="text-sm font-medium text-[#D9381E]">{errorMsg}</p>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!convertedUrl || isSaving}
              className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#FF5A36] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#E84C29] active:scale-[0.98] disabled:opacity-50 transition-transform cursor-pointer"
            >
              <Wand2 className="h-4 w-4" />
              <span>{isSaving ? 'Adding to Coloring Book...' : 'Save & Start Coloring'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
