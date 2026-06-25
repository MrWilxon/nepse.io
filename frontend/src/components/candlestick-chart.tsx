"use client";

import { useEffect, useRef, memo } from "react";
import { createChart, type IChartApi } from "lightweight-charts";

interface CandlestickData {
  date: string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
  sma20?: number | null;
  sma50?: number | null;
  ema12?: number | null;
  ema26?: number | null;
  bbUpper?: number | null;
  bbMiddle?: number | null;
  bbLower?: number | null;
}

interface Props {
  data: CandlestickData[];
  chartType: "candlestick" | "line";
  indicator: string;
  height?: number;
}

function CandlestickChartComponent({ data, chartType, indicator, height = 450 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(75, 85, 99, 0.15)" },
        horzLines: { color: "rgba(75, 85, 99, 0.15)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "rgba(75, 85, 99, 0.4)", style: 2 },
        horzLine: { color: "rgba(75, 85, 99, 0.4)", style: 2 },
      },
      timeScale: {
        borderColor: "rgba(75, 85, 99, 0.3)",
        timeVisible: false,
        rightOffset: 5,
      },
      rightPriceScale: {
        borderColor: "rgba(75, 85, 99, 0.3)",
      },
    });

    chartRef.current = chart;

    const candleData = data
      .filter((d) => d.open != null && d.high != null && d.low != null && d.close != null)
      .map((d) => ({
        time: d.date as string,
        open: d.open!,
        high: d.high!,
        low: d.low!,
        close: d.close!,
      }));

    if (chartType === "candlestick") {
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#16a34a",
        downColor: "#dc2626",
        borderDownColor: "#dc2626",
        borderUpColor: "#16a34a",
        wickDownColor: "#dc2626",
        wickUpColor: "#16a34a",
      });
      candleSeries.setData(candleData);
    } else {
      const lineSeries = chart.addLineSeries({
        color: "#16a34a",
        lineWidth: 2,
        crosshairMarkerVisible: true,
        priceLineVisible: false,
      });
      lineSeries.setData(data.filter((d) => d.close != null).map((d) => ({ time: d.date as string, value: d.close! })));
    }

    // Volume
    const volumeData = data.map((d) => ({
      time: d.date as string,
      value: d.volume ?? 0,
      color: d.close != null && d.open != null
        ? (d.close >= d.open ? "rgba(22, 163, 74, 0.3)" : "rgba(220, 38, 38, 0.3)")
        : "rgba(148, 163, 184, 0.3)",
    }));
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" as const },
      priceScaleId: "volume",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(volumeData);

    // Indicators
    if (indicator === "sma") {
      const sma20Data = data.filter((d) => d.sma20 != null).map((d) => ({ time: d.date as string, value: d.sma20! }));
      const sma50Data = data.filter((d) => d.sma50 != null).map((d) => ({ time: d.date as string, value: d.sma50! }));
      if (sma20Data.length > 0) {
        const s = chart.addLineSeries({ color: "#f59e0b", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(sma20Data);
      }
      if (sma50Data.length > 0) {
        const s = chart.addLineSeries({ color: "#8b5cf6", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(sma50Data);
      }
    } else if (indicator === "ema") {
      const ema12Data = data.filter((d) => d.ema12 != null).map((d) => ({ time: d.date as string, value: d.ema12! }));
      const ema26Data = data.filter((d) => d.ema26 != null).map((d) => ({ time: d.date as string, value: d.ema26! }));
      if (ema12Data.length > 0) {
        const s = chart.addLineSeries({ color: "#06b6d4", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(ema12Data);
      }
      if (ema26Data.length > 0) {
        const s = chart.addLineSeries({ color: "#ec4899", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(ema26Data);
      }
    } else if (indicator === "bb") {
      const bbUpper = data.filter((d) => d.bbUpper != null).map((d) => ({ time: d.date as string, value: d.bbUpper! }));
      const bbMiddle = data.filter((d) => d.bbMiddle != null).map((d) => ({ time: d.date as string, value: d.bbMiddle! }));
      const bbLower = data.filter((d) => d.bbLower != null).map((d) => ({ time: d.date as string, value: d.bbLower! }));
      if (bbUpper.length > 0) {
        const s = chart.addLineSeries({ color: "#8b5cf6", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
        s.setData(bbUpper);
      }
      if (bbMiddle.length > 0) {
        const s = chart.addLineSeries({ color: "#8b5cf6", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(bbMiddle);
      }
      if (bbLower.length > 0) {
        const s = chart.addLineSeries({ color: "#8b5cf6", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
        s.setData(bbLower);
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, chartType, indicator, height]);

  return <div ref={containerRef} className="w-full" />;
}

export const CandlestickChart = memo(CandlestickChartComponent);
