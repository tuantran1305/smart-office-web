"use client";

import React, { useEffect, useState } from "react";
import { thingsboard } from "@/lib/tbClient";
import { TbEntity } from "thingsboard-api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";

interface SeriesPoint { ts: number; value: number }
interface Props {
  token: string;
  entityId: string;
  startTs: number;
  endTs: number;
  refreshMs?: number; // optional polling interval
}

// Fetch four series and render in a single canvas with tooltip on hover
const TelemetryMultiChart: React.FC<Props> = ({ token, entityId, startTs, endTs, refreshMs = 60000 }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ air_temp: SeriesPoint[]; air_hum: SeriesPoint[]; lux: SeriesPoint[]; soil_moist: SeriesPoint[] }>({ air_temp: [], air_hum: [], lux: [], soil_moist: [] });

  useEffect(() => {
    let mounted = true;
    let timer: any;
    const run = async () => {
      try {
        setLoading(true);
        const resp: any = await thingsboard.telemetry().getTimeseries(
          token,
          { entityId, entityType: TbEntity.DEVICE },
          {
            keys: "air_temp,air_hum,lux,soil_moist",
            startTs,
            endTs,
            interval: 60000,
            limit: 10000,
            useStrictDataTypes: false,
          }
        );
        if (!mounted) return;
        const toSeries = (arr?: any[]) => (arr || []).map((it: any) => ({ ts: it.ts, value: parseFloat(it.value) }));
        setData({
          air_temp: toSeries(resp?.data?.air_temp ?? resp?.air_temp),
          air_hum: toSeries(resp?.data?.air_hum ?? resp?.air_hum),
          lux: toSeries(resp?.data?.lux ?? resp?.lux),
          soil_moist: toSeries(resp?.data?.soil_moist ?? resp?.soil_moist),
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    if (refreshMs && refreshMs > 0) {
      timer = setInterval(run, refreshMs);
    }
    return () => { mounted = false; if (timer) clearInterval(timer); };
  }, [token, entityId, startTs, endTs, refreshMs]);

  // Simple canvas-based multi-line chart with hover tooltip
  const [hover, setHover] = useState<{ x: number; ts?: number; values?: Record<string, number> } | null>(null);
  const padding = { left: 40, right: 10, top: 10, bottom: 20 };
  const width = 800; const height = 300;

  const allPoints = [...data.air_temp, ...data.air_hum, ...data.lux, ...data.soil_moist];
  const minTs = startTs; const maxTs = endTs;
  const minVal = Math.min(...allPoints.map(p => p.value).concat([0]));
  const maxVal = Math.max(...allPoints.map(p => p.value).concat([100]));

  const xScale = React.useCallback((ts: number) => padding.left + (ts - minTs) / (maxTs - minTs) * (width - padding.left - padding.right), [padding.left, padding.right, minTs, maxTs, width]);
  const yScale = React.useCallback((v: number) => height - padding.bottom - (v - minVal) / (maxVal - minVal) * (height - padding.top - padding.bottom), [height, padding.bottom, padding.top, minVal, maxVal]);

  const colors = React.useMemo<Record<string, string>>(() => ({ air_temp: "#ef4444", air_hum: "#3b82f6", lux: "#f59e0b", soil_moist: "#10b981" }), []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ts = minTs + (x - padding.left) / (width - padding.left - padding.right) * (maxTs - minTs);
    const nearest = (arr: SeriesPoint[]) => arr.reduce((prev, cur) => Math.abs(cur.ts - ts) < Math.abs(prev.ts - ts) ? cur : prev, arr[0] || { ts: minTs, value: 0 });
    setHover({ x, ts, values: {
      air_temp: nearest(data.air_temp)?.value || 0,
      air_hum: nearest(data.air_hum)?.value || 0,
      lux: nearest(data.lux)?.value || 0,
      soil_moist: nearest(data.soil_moist)?.value || 0,
    }});
  };

  useEffect(() => {
    const canvas = document.getElementById("multiChartCanvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    const drawSeries = (arr: SeriesPoint[], color: string) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      arr.forEach((p, i) => {
        const x = xScale(p.ts);
        const y = yScale(p.value);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };
    drawSeries(data.air_temp, colors.air_temp);
    drawSeries(data.air_hum, colors.air_hum);
    drawSeries(data.lux, colors.lux);
    drawSeries(data.soil_moist, colors.soil_moist);

    if (hover?.x) {
      ctx.strokeStyle = "#999";
      ctx.beginPath();
      ctx.moveTo(hover.x, padding.top);
      ctx.lineTo(hover.x, height - padding.bottom);
      ctx.stroke();
    }
  }, [data, hover, colors, padding.top, padding.bottom, width, height, xScale, yScale]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biểu đồ tổng hợp: Nhiệt độ / Độ ẩm / Ánh sáng / Độ ẩm đất</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
        <div className="relative">
          <canvas id="multiChartCanvas" width={width} height={height} onMouseMove={handleMouseMove} />
          {hover?.values && (
            <div className="absolute top-2 left-2 bg-white/90 rounded-md shadow-sm text-xs p-2 space-y-1">
              <div style={{ color: colors.air_temp }}>Temp: {hover.values.air_temp.toFixed(2)} °C</div>
              <div style={{ color: colors.air_hum }}>Hum: {hover.values.air_hum.toFixed(2)} %</div>
              <div style={{ color: colors.lux }}>Lux: {hover.values.lux.toFixed(2)} lx</div>
              <div style={{ color: colors.soil_moist }}>Soil: {hover.values.soil_moist.toFixed(2)} %</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TelemetryMultiChart;