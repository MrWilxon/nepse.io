"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldAlert, ChevronDown, RefreshCw } from "lucide-react";

function useAdblockDetector() {
  const [detected, setDetected] = useState(false);
  const [loading, setLoading] = useState(true);

  const detect = useCallback(() => {
    setLoading(true);
    setDetected(false);

    // Method 1: Bait element detection
    // Create an element that adblockers typically target
    const bait = document.createElement("div");
    bait.className = "pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links text-ad-links";
    bait.style.cssText = "width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;";
    bait.setAttribute("data-ad-client", "ca-pub-test");
    bait.setAttribute("data-ad-slot", "1234567890");
    document.body.appendChild(bait);

    // Method 2: Try to create a fake ad request via Google Ads script
    let googleAdsBlocked = false;
    
    setTimeout(() => {
      let adblockDetected = false;

      // Check if bait was removed or hidden by adblocker
      if (!document.body.contains(bait)) {
        adblockDetected = true;
      } else {
        const style = window.getComputedStyle(bait);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0" ||
          bait.offsetHeight === 0 ||
          bait.offsetWidth === 0
        ) {
          adblockDetected = true;
        }
      }

      // Clean up bait
      if (bait.parentNode) {
        bait.parentNode.removeChild(bait);
      }

      // Method 2: Check if Google Ads script actually loaded
      if (!adblockDetected) {
        const adsbygoogle = (window as any).adsbygoogle;
        if (!adsbygoogle || !Array.isArray(adsbygoogle)) {
          // Script didn't load - could be adblocker
          // But give it more time, might just be slow
          googleAdsBlocked = true;
        }
      }

      // Method 3: Try to push an ad and see if it fails
      if (!adblockDetected && googleAdsBlocked) {
        // If the script array exists but push fails, adblocker might be interfering
        try {
          const adsbygoogle = (window as any).adsbygoogle;
          if (adsbygoogle && Array.isArray(adsbygoogle)) {
            // Try a test push
            const testEl = document.createElement("ins");
            testEl.className = "adsbygoogle";
            testEl.style.display = "none";
            document.body.appendChild(testEl);
            
            try {
              adsbygoogle.push({});
              // If push succeeded, ads might be working
            } catch {
              adblockDetected = true;
            } finally {
              if (testEl.parentNode) {
                testEl.parentNode.removeChild(testEl);
              }
            }
          }
        } catch {
          // Error during check
        }
      }

      setDetected(adblockDetected);
      setLoading(false);
    }, 3000); // Wait 3 seconds for everything to load
  }, []);

  useEffect(() => {
    // Wait for page to fully load before checking
    const timer = setTimeout(detect, 3500);
    return () => clearTimeout(timer);
  }, [detect]);

  const recheck = useCallback(() => {
    setLoading(true);
    // Give time for adblocker changes to take effect
    setTimeout(detect, 1000);
  }, [detect]);

  return { detected, loading, recheck };
}

const adblockerInstructions = [
  {
    name: "uBlock Origin",
    steps: [
      "Click the uBlock Origin icon in your browser toolbar",
      'Click the large blue power button to disable for this site',
      "The icon will turn gray indicating it's disabled",
      'Refresh this page or click "I\'ve Disabled It" below',
    ],
  },
  {
    name: "AdBlock Plus",
    steps: [
      "Click the AdBlock Plus icon in your browser toolbar",
      'Toggle the "Enabled on this site" switch to OFF',
      "The icon will change to indicate it's disabled",
      'Refresh this page or click "I\'ve Disabled It" below',
    ],
  },
  {
    name: "AdGuard",
    steps: [
      "Click the AdGuard icon in your browser toolbar",
      'Click "Pause protection" or disable for this website',
      "Wait for the page to reload",
      'Click "I\'ve Disabled It" below to verify',
    ],
  },
  {
    name: "Brave Shields",
    steps: [
      "Click the lion icon (Brave Shields) in the address bar",
      'Toggle "Shields down for this site"',
      "The page will reload automatically",
      'Click "I\'ve Disabled It" below to verify',
    ],
  },
];

export function AdblockDetector() {
  const { detected, loading, recheck } = useAdblockDetector();
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (loading || !detected) return null;

  const handleRecheck = () => {
    setChecking(true);
    recheck();
    setTimeout(() => setChecking(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-[var(--bg-card)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-500/10 px-6 py-8 text-center border-b border-red-500/20">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Adblocker Detected
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            We noticed you&apos;re using an adblocker on NEPSE.io
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              <strong>NEPSE.io is a free platform</strong> supported by advertising. 
              Ads help us keep the platform running and continue providing free stock market 
              analytics for the Nepal investment community.
            </p>
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            Please disable your adblocker for this site to continue using NEPSE.io. 
            Here&apos;s how:
          </p>

          {/* Instructions Accordion */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {adblockerInstructions.map((item) => (
              <div
                key={item.name}
                className="rounded-lg border border-[var(--border-primary)] overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedGuide(
                      expandedGuide === item.name ? null : item.name
                    )
                  }
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span>{item.name}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${
                      expandedGuide === item.name ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedGuide === item.name && (
                  <div className="px-3 pb-3 border-t border-[var(--border-primary)]">
                    <ol className="mt-2 space-y-1">
                      {item.steps.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[11px] text-[var(--text-muted)]"
                        >
                          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[var(--bg-input)] text-[var(--text-dim)] flex items-center justify-center text-[9px] font-bold">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-page)]">
          <button
            onClick={handleRecheck}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--accent-text)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {checking ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                I&apos;ve Disabled My Adblocker
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[10px] text-[var(--text-muted)]">
            You may need to refresh the page after disabling your adblocker
          </p>
        </div>
      </div>
    </div>
  );
}
