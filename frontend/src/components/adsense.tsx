"use client";

import { useEffect, useRef } from "react";

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
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

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
      slot="8787584106"
      format="auto"
      className={className}
      style={{ width: "100%", maxWidth: "728px", height: "90px", margin: "0 auto" }}
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
