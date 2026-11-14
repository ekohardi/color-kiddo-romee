import { useEffect, useState } from 'react';
import { BookOpen, ImagePlus, Images, WifiOff } from 'lucide-react';
import { ArtbookGallery } from './components/ArtbookGallery';
import { ColoringStudio } from './components/ColoringStudio';
import { DesignImporter } from './components/DesignImporter';
import { PWAInstallButton } from './components/PWAInstallButton';
import { TemplateLibrary } from './components/TemplateLibrary';
import { STARTER_TEMPLATES } from './data/starterTemplates';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { AppView, ColoringTemplate, SavedArtwork } from './types/coloring';
import {
  deleteCustomDesign,
  deleteSavedArtwork,
  getCustomDesigns,
  getSavedArtworks,
  saveArtwork,
  saveCustomDesign,
} from './utils/storage';

export default function App() {
  const [view, setView] = useState<AppView>('library');
  const [customTemplates, setCustomTemplates] = useState<ColoringTemplate[]>([]);
  const [savedArtworks, setSavedArtworks] = useState<SavedArtwork[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<ColoringTemplate>(STARTER_TEMPLATES[0]);
  const [activeArtwork, setActiveArtwork] = useState<SavedArtwork | null>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    getCustomDesigns().then(setCustomTemplates);
    getSavedArtworks().then(setSavedArtworks);
  }, []);

  const handleSelectTemplate = (template: ColoringTemplate) => {
    setActiveTemplate(template);
    setActiveArtwork(null);
    setView('studio');
  };

  const handleSaveCustomDesign = async (template: ColoringTemplate) => {
    await saveCustomDesign(template);
    setCustomTemplates((prev) => [template, ...prev]);
    setActiveTemplate(template);
    setActiveArtwork(null);
    setView('studio');
  };

  const handleDeleteCustomDesign = async (id: string) => {
    await deleteCustomDesign(id);
    setCustomTemplates((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveArtwork = async (artwork: SavedArtwork) => {
    await saveArtwork(artwork);
    setSavedArtworks((prev) => {
      const filtered = prev.filter((a) => a.id !== artwork.id);
      return [artwork, ...filtered];
    });
  };

  const handleResumeArtwork = (artwork: SavedArtwork) => {
    const matchedTemplate =
      [...customTemplates, ...STARTER_TEMPLATES].find((t) => t.id === artwork.templateId) || {
        id: artwork.templateId,
        title: artwork.title,
        category: 'Saved',
        difficulty: 'Easy' as const,
        source: 'custom' as const,
        lineArtUrl: artwork.lineArtUrl,
        createdAt: artwork.updatedAt,
      };
    setActiveTemplate(matchedTemplate);
    setActiveArtwork(artwork);
    setView('studio');
  };

  const handleDeleteArtwork = async (id: string) => {
    await deleteSavedArtwork(id);
    setSavedArtworks((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAF8F4] text-[#1E2430]">
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (Single-line Nav) — Zone 3 (Primary CTA) */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E8E3DA] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => setView('library')}
          className="text-xl font-bold tracking-tight text-[#1E2430] whitespace-nowrap shrink-0 cursor-pointer"
        >
          KiddoColor
        </button>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5C6473]">
          <button
            type="button"
            onClick={() => setView('library')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              view === 'library'
                ? 'text-[#1E2430] font-semibold underline decoration-[#FF5A36] decoration-2 underline-offset-8'
                : 'hover:text-[#1E2430]'
            }`}
          >
            Coloring Book
          </button>
          <button
            type="button"
            onClick={() => setView('import')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              view === 'import'
                ? 'text-[#1E2430] font-semibold underline decoration-[#FF5A36] decoration-2 underline-offset-8'
                : 'hover:text-[#1E2430]'
            }`}
          >
            Add Design
          </button>
          <button
            type="button"
            onClick={() => setView('artbook')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              view === 'artbook'
                ? 'text-[#1E2430] font-semibold underline decoration-[#FF5A36] decoration-2 underline-offset-8'
                : 'hover:text-[#1E2430]'
            }`}
          >
            My Artbook
          </button>
          <button
            type="button"
            onClick={() => setView('studio')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              view === 'studio'
                ? 'text-[#1E2430] font-semibold underline decoration-[#FF5A36] decoration-2 underline-offset-8'
                : 'hover:text-[#1E2430]'
            }`}
          >
            Studio
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <PWAInstallButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {view === 'library' && (
          <TemplateLibrary
            starterTemplates={STARTER_TEMPLATES}
            customTemplates={customTemplates}
            onSelectTemplate={handleSelectTemplate}
            onOpenImport={() => setView('import')}
            onDeleteCustom={handleDeleteCustomDesign}
          />
        )}

        {view === 'import' && (
          <DesignImporter
            onSaveAndColor={handleSaveCustomDesign}
            onCancel={() => setView('library')}
          />
        )}

        {view === 'artbook' && (
          <ArtbookGallery
            artworks={savedArtworks}
            onResumeArtwork={handleResumeArtwork}
            onDeleteArtwork={handleDeleteArtwork}
            onGoToLibrary={() => setView('library')}
          />
        )}

        {view === 'studio' && (
          <ColoringStudio
            template={activeTemplate}
            existingArtwork={activeArtwork}
            onSaveArtwork={handleSaveArtwork}
            onBack={() => setView('library')}
          />
        )}
      </div>

      {/* Mobile Bottom Tab Bar (hidden while inside ColoringStudio so canvas gets full thumb dock) */}
      {view !== 'studio' && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E3DA] pb-safe"
        >
          <div className="grid grid-cols-3 h-16 items-center">
            <button
              type="button"
              onClick={() => setView('library')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                view === 'library' ? 'text-[#FF5A36]' : 'text-[#5C6473]'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span className="mt-1 text-[11px] font-semibold">Pages</span>
            </button>
            <button
              type="button"
              onClick={() => setView('import')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                view === 'import' ? 'text-[#FF5A36]' : 'text-[#5C6473]'
              }`}
            >
              <ImagePlus className="h-5 w-5" />
              <span className="mt-1 text-[11px] font-semibold">Add Design</span>
            </button>
            <button
              type="button"
              onClick={() => setView('artbook')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                view === 'artbook' ? 'text-[#FF5A36]' : 'text-[#5C6473]'
              }`}
            >
              <Images className="h-5 w-5" />
              <span className="mt-1 text-[11px] font-semibold">Artbook</span>
            </button>
          </div>
        </nav>
      )}

      {/* Offline Mode Toast */}
      {!isOnline && (
        <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#1E2430] px-3.5 py-2 text-xs font-medium text-white shadow-lg">
          <WifiOff className="h-3.5 w-3.5 text-[#FFD22E]" />
          <span>Offline Mode — Your pages and drawings still work</span>
        </div>
      )}
    </div>
  );
}
