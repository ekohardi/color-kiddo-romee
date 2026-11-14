import React from 'react';
import { Download, Palette, Trash2 } from 'lucide-react';
import { SavedArtwork } from '../types/coloring';

interface ArtbookGalleryProps {
  artworks: SavedArtwork[];
  onResumeArtwork: (artwork: SavedArtwork) => void;
  onDeleteArtwork: (id: string) => void;
  onGoToLibrary: () => void;
}

export const ArtbookGallery: React.FC<ArtbookGalleryProps> = ({
  artworks,
  onResumeArtwork,
  onDeleteArtwork,
  onGoToLibrary,
}) => {
  const handleDownload = (art: SavedArtwork) => {
    const link = document.createElement('a');
    link.href = art.previewDataUrl;
    const safeName = art.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'artwork';
    link.download = `${safeName}.png`;
    link.click();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[#E8E3DA]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1E2430] text-balance">
            My Artbook
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#5C6473]">
            Saved drawings stay on this device so you can keep coloring offline or download them anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToLibrary}
          className="min-h-[44px] rounded-xl bg-[#FF5A36] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#E84C29] whitespace-nowrap shrink-0 cursor-pointer"
        >
          New Coloring Page
        </button>
      </div>

      {artworks.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-[#E8E3DA] bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF2EE] text-[#FF5A36]">
            <Palette className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#1E2430]">
            No saved drawings yet
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[#5C6473]">
            Pick any coloring page or upload your own design, then tap Save while coloring to keep it in your Artbook.
          </p>
          <button
            type="button"
            onClick={onGoToLibrary}
            className="mt-6 min-h-[48px] rounded-xl bg-[#1E2430] px-6 py-3 text-sm font-semibold text-white hover:bg-[#31394A] cursor-pointer"
          >
            Browse Coloring Pages
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {artworks.map((art) => (
            <div
              key={art.id}
              className="flex flex-col rounded-2xl border border-[#E8E3DA] bg-white overflow-hidden"
            >
              <button
                type="button"
                onClick={() => onResumeArtwork(art)}
                className="aspect-square w-full bg-white p-4 border-b border-[#F2EDE4] flex items-center justify-center cursor-pointer hover:bg-[#FFFDF9]"
              >
                <img
                  src={art.previewDataUrl}
                  alt={art.title}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </button>

              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#1E2430] truncate">
                    {art.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#5C6473]">
                    Saved {new Date(art.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onResumeArtwork(art)}
                    className="min-h-[44px] rounded-xl bg-[#EFEAE0] px-3.5 py-2 text-xs font-semibold text-[#1E2430] hover:bg-[#E4DDD0] cursor-pointer"
                  >
                    Color
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(art)}
                    aria-label={`Download ${art.title}`}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E8E3DA] text-[#1E2430] hover:bg-[#FAF8F4] cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteArtwork(art.id)}
                    aria-label={`Delete ${art.title}`}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E8E3DA] text-[#5C6473] hover:bg-[#FFF0EB] hover:text-[#D9381E] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
