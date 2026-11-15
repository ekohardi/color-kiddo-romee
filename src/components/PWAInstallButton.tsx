import React, { useState } from 'react';
import { Check, Copy, Download, Share2, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  // Hide completely when already running inside the installed Android/iOS standalone app
  if (isInstalled) {
    return null;
  }

  const appUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'KiRoCo - Kids Romee Color',
          text: 'Color pages and add your own designs on Android!',
          url: appUrl,
        });
      } catch {
        // User cancelled share sheet
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handlePrimaryClick}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#FF5A36] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-[#E84C29] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A36]"
      >
        {isInstallable ? (
          <>
            <Download className="h-4 w-4 shrink-0" />
            <span>Install App</span>
          </>
        ) : (
          <>
            <Smartphone className="h-4 w-4 shrink-0" />
            <span>{isAndroid ? 'Install on Android' : 'Open on Android'}</span>
          </>
        )}
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1E2430]/50 p-0 sm:p-4 backdrop-blur-xs"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#FFFDF9] p-6 shadow-xl border border-[#E8E3DA]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="android-modal-title"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#D8D1C5] sm:hidden" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="android-modal-title" className="text-xl font-bold text-[#1E2430]">
                  Open & Install on Android
                </h2>
                <p className="mt-1 text-sm text-[#5C6473]">
                  Works offline full-screen like a native kids coloring app.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close Android guide"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#5C6473] hover:bg-[#F2EDE4] hover:text-[#1E2430] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isInstallable && (
              <button
                type="button"
                onClick={install}
                className="mt-5 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#FF5A36] px-4 py-3 text-sm font-semibold text-white hover:bg-[#E84C29] active:scale-[0.98] transition-transform cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Install App Now
              </button>
            )}

            <div className="mt-5 rounded-2xl border border-[#E8E3DA] bg-[#FAF8F4] p-4">
              <div className="text-xs font-semibold text-[#5C6473]">App Link</div>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  aria-label="App URL"
                  className="w-full rounded-xl border border-[#E8E3DA] bg-white px-3 py-2 text-xs text-[#1E2430] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-[#E8E3DA] bg-white px-3 py-2 text-xs font-semibold text-[#1E2430] hover:bg-[#F2EDE4] cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-[#26B872]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="mt-2.5 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#E8E3DA] bg-white px-3 py-2 text-xs font-semibold text-[#1E2430] hover:bg-[#F2EDE4] cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  Send Link to Phone
                </button>
              )}
            </div>

            <div className="mt-5 space-y-3 text-sm text-[#3E4654]">
              <div className="font-semibold text-[#1E2430]">
                {isIOS ? 'On iPhone / iPad (Safari):' : 'On Android (Chrome):'}
              </div>
              {isIOS ? (
                <ol className="list-decimal pl-5 space-y-1.5 text-sm">
                  <li>Open this link in Safari on your iPhone or iPad.</li>
                  <li>Tap the <strong>Share</strong> button in the bottom bar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                </ol>
              ) : (
                <ol className="list-decimal pl-5 space-y-1.5 text-sm">
                  <li>Open the link above in <strong>Chrome</strong> on your Android phone or tablet.</li>
                  <li>Tap <strong>Install App</strong> or open Chrome&apos;s <strong>⋮</strong> menu.</li>
                  <li>Tap <strong>Add to Home screen</strong> or <strong>Install app</strong> to launch full-screen offline.</li>
                </ol>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 flex w-full min-h-[44px] items-center justify-center rounded-xl bg-[#EFEAE0] px-4 py-2.5 text-sm font-semibold text-[#1E2430] hover:bg-[#E4DDD0] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
