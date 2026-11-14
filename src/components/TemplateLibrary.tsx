import React, { useMemo, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { ColoringTemplate } from '../types/coloring';

interface TemplateLibraryProps {
  starterTemplates: ColoringTemplate[];
  customTemplates: ColoringTemplate[];
  onSelectTemplate: (template: ColoringTemplate) => void;
  onOpenImport: () => void;
  onDeleteCustom: (id: string) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  starterTemplates,
  customTemplates,
  onSelectTemplate,
  onOpenImport,
  onDeleteCustom,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const allTemplates = useMemo(
    () => [...customTemplates, ...starterTemplates],
    [customTemplates, starterTemplates]
  );

  const categories = useMemo(() => {
    const base = ['All'];
    if (customTemplates.length > 0) base.push('My Designs');
    const starterCats = Array.from(new Set(starterTemplates.map((t) => t.category)));
    return [...base, ...starterCats];
  }, [customTemplates.length, starterTemplates]);

  const visibleTemplates = useMemo(() => {
    if (selectedCategory === 'All') return allTemplates;
    if (selectedCategory === 'My Designs') return customTemplates;
    return allTemplates.filter((t) => t.category === selectedCategory);
  }, [allTemplates, customTemplates, selectedCategory]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12">
      {/* Studio Welcome & Custom Design Callout */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E8E3DA]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E2430] text-balance">
            Pick a Coloring Page
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#5C6473]">
            Tap any drawing to start coloring with crayons, rainbow brushes, and tap-to-fill, or upload an image model from your own design.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenImport}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#1E2430] px-5 py-3 text-sm font-semibold text-white hover:bg-[#31394A] active:scale-[0.98] transition-transform whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ImagePlus className="h-4 w-4" />
          <span>Add From Your Design</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="mt-5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#FF5A36] text-white'
                  : 'bg-[#EFEAE0] text-[#4B5362] hover:bg-[#E4DDD0] hover:text-[#1E2430]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Coloring Pages Grid */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Quick Add Design Tile */}
        <button
          type="button"
          onClick={onOpenImport}
          className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D5CFC3] bg-[#FFFDF9] p-5 text-center transition-colors hover:border-[#FF5A36] hover:bg-[#FFF5F2] cursor-pointer aspect-[4/5]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0EB] text-[#FF5A36] transition-transform group-hover:scale-105">
            <ImagePlus className="h-7 w-7" />
          </div>
          <span className="mt-4 text-sm sm:text-base font-bold text-[#1E2430]">
            Add Your Design
          </span>
          <span className="mt-1 text-xs text-[#5C6473]">
            Upload PNG, JPG, or SVG
          </span>
        </button>

        {visibleTemplates.map((template) => (
          <div
            key={template.id}
            className="group relative flex flex-col rounded-2xl border border-[#E8E3DA] bg-white overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => onSelectTemplate(template)}
              className="flex flex-1 flex-col text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FF5A36]"
            >
              <div className="aspect-square w-full bg-white p-4 flex items-center justify-center border-b border-[#F2EDE4]">
                <img
                  src={template.lineArtUrl}
                  alt={template.title}
                  className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-3.5 sm:p-4">
                <h3 className="text-sm sm:text-base font-bold text-[#1E2430] truncate">
                  {template.title}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#5C6473]">
                  <span>{template.source === 'custom' ? 'Your Design' : template.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{template.difficulty}</span>
                </div>
              </div>
            </button>

            {template.source === 'custom' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCustom(template.id);
                }}
                aria-label={`Delete ${template.title}`}
                className="absolute top-2 right-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white/90 text-[#5C6473] border border-[#E8E3DA] hover:bg-[#FFF0EB] hover:text-[#D9381E] cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
