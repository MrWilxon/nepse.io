"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseProps {
  slot: string;
  format?: "auto" | "fluid" | "horizontal" | "vertical" | "rectangle";
  layout?: "in-article" | "in-feed" | "display";
  layoutKey?: string;
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

export function AdSense({
  slot,
  format = "auto",
  layout,
  layoutKey,
  style,
  className = "",
  responsive = true,
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !adRef.current) return;

    const el = adRef.current;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      const ro = new ResizeObserver(() => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          ro.disconnect();
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (e) {
            console.error("AdSense push error:", e);
          }
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }

    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [mounted]);

  const insStyle: React.CSSProperties = {
    display: "block",
    ...style,
  };

  if (layout === "in-article") {
    insStyle.textAlign = "center";
  }

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={insStyle}
        data-ad-client="ca-pub-9798460762666960"
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

export function LeaderboardAd({ className = "" }: { className?: string }) {
  return (
    <AdSense
      slot="3590052334"
      format="auto"
      className={className}
      style={{ display: "block" }}
    />
  );
}

export function InFeedAd({ className = "" }: { className?: string }) {
  return (
    <AdSense
      slot="9099987983"
      format="fluid"
      layout="in-feed"
      layoutKey="-hw-7+2w-11-86"
      className={className}
    />
  );
}

export function InArticleAd({ className = "" }: { className?: string }) {
  return (
    <AdSense
      slot="6393932041"
      format="fluid"
      layout="in-article"
      className={className}
    />
  );
}
