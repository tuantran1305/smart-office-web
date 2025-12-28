"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import useWebSocket from "react-use-websocket";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LatestTelemetryCard from "../../(dashboard)/components/latest-telemetry-card";
import TelemetryTable from "../../(dashboard)/components/telemetry-table";
import TelemetryJsonChart from "../../(dashboard)/components/telemetry-json-chart";
import { ThermometerSun, Droplet, BatteryFull, Lightbulb } from "lucide-react";
import { config } from "@/lib/config";
import { TbEntity } from "thingsboard-api-client";

const { deviceId, tbServer } = config;

const formatAttribute = (data: any) => {
  const format: Record<string, any> = {};
  Object.values(data).forEach((item: any) => {
    format[item.key] = item.value;
  });
  return format;
};

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "1";

  const [loading, setLoading] = useState(false);
  const [latestData, setLatestData] = useState<any>();
  const [attribute, setAttribute] = useState<any>();
  const [socketUrl, setSocketUrl] = useState("");

  const latestKeys = id === "1" ? ["1","10"].join(",") : "2"; // include PZEM key 10 for kho 1

  const attrKeys = [id, `set-${id}`].join(",");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
    setSocketUrl(`${protocol}://${tbServer}/api/ws/plugins/telemetry?token=${token}`);
  }, []);

  const { getWebSocket } = useWebSocket(socketUrl !== "" ? socketUrl : null, {
    onOpen: () => {
      const object = { tsSubCmds: [{ entityType: "DEVICE", entityId: deviceId, scope: "LATEST_TELEMETRY", cmdId: 21 }], historyCmds: [], attrSubCmds: [] };
      getWebSocket().send(JSON.stringify(object));
    },
    onMessage: (event) => {
      const obj = JSON.parse(event.data).data;
      setLatestData((prev: any) => {
        const keys = id === "1" ? ["1","10"] : ["2"];
        let next = { ...(prev || {}) } as any;
        keys.forEach((k) => {
          if (obj?.[k]) {
            const ts = obj[k][0][0];
            const valRaw = obj[k][0][1];
            let value: any = valRaw;
            if (typeof valRaw === "string") { try { value = JSON.parse(valRaw); } catch {} }
            next[k] = [{ ts, value }];
          }
        });
        return next;
      });
    },
    onError: () => setSocketUrl(""),
    onClose: () => {},
  }) as any;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    const loadLatest = async () => {
      setLoading(true);
      await axios.post(`/api/telemetry/latest`, { token, deviceId, keys: latestKeys })
        .then((resp) => setLatestData(resp.data))
        .catch((err) => { console.error(err); toast.error("Lỗi lấy dữ liệu kho"); })
        .finally(() => setLoading(false));
    };
    loadLatest();
  }, [id]);

  const refreshAttr = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    setLoading(true);
    await axios.post(`/api/telemetry/attribute`, { token, deviceId, keys: attrKeys })
      .then((resp) => setAttribute(formatAttribute(resp.data)))
      .catch((err) => { console.error(err); toast.error("Lỗi lấy thuộc tính"); })
      .finally(() => setLoading(false));
  }, [attrKeys]);

  useEffect(() => { refreshAttr(); }, [refreshAttr]);

  const saveAttr = useCallback(async (payload: Record<string, any>, successMsg = "Lưu thành công") => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    await axios.post(`/api/telemetry/attribute/save`, { token, deviceId, payload: { ...attribute, ...payload } })
      .then(() => { toast.success(successMsg); refreshAttr(); })
      .catch((err) => { console.error(err); toast.error("Không thể lưu"); });
  }, [attribute, refreshAttr]);

  const now = Date.now();
  const start24h = now - 24 * 60 * 60 * 1000;
  const tableKeys = id; // only base sensor key for table
  const table = useMemo(() => (
    <TelemetryTable entityId={deviceId} entityType={TbEntity.DEVICE} keys={tableKeys} startTs={0} endTs={now} />
  ), [now, tableKeys]);

  const is1 = id === "1";

  const sensor = useMemo(() => {
    const pack = latestData?.[id]?.[0];
    let val = pack?.value;
    if (typeof val === "string") {
      try { val = JSON.parse(val); } catch {}
    }
    return { ts: pack?.ts, ...val } as any;
  }, [latestData, id]);

  const pzem = useMemo(() => {
    if (id !== "1") return null;
    const pack = latestData?.["10"]?.[0];
    let val = pack?.value;
    if (typeof val === "string") { try { val = JSON.parse(val); } catch {} }
    return { ts: pack?.ts, ...val } as any;
  }, [latestData, id]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Chi tiết Nhà kho {id}</h2>
        <Link href="/warehouse"><Button variant="secondary">Quay lại danh sách</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông số cảm biến kho {id}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 grid-cols-1">
          <LatestTelemetryCard title="Nhiệt độ" icon={<ThermometerSun className="h-8 w-8 text-red-500" />} data={{ ts: sensor?.ts, value: sensor?.temp }} loading={loading} unit="°C" />
          <LatestTelemetryCard title="Độ ẩm" icon={<Droplet className="h-8 w-8 text-blue-500" />} data={{ ts: sensor?.ts, value: sensor?.hum }} loading={loading} unit="%" />
          <LatestTelemetryCard title="Pin" icon={<BatteryFull className="h-8 w-8 text-green-500" />} data={{ ts: sensor?.ts, value: sensor?.bat }} loading={loading} unit="%" />
        </CardContent>
      </Card>

      {is1 && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cảm biến PZEM (Kho 1)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4 grid-cols-1">
            <LatestTelemetryCard title="Điện áp" icon={<ThermometerSun className="h-8 w-8 text-slate-600" />} data={{ ts: pzem?.ts, value: pzem?.voltage }} loading={loading} unit=" V" />
            <LatestTelemetryCard title="Dòng điện" icon={<Droplet className="h-8 w-8 text-slate-600" />} data={{ ts: pzem?.ts, value: pzem?.current }} loading={loading} unit=" A" />
            <LatestTelemetryCard title="Công suất" icon={<BatteryFull className="h-8 w-8 text-slate-600" />} data={{ ts: pzem?.ts, value: pzem?.power }} loading={loading} unit=" W" />
            <LatestTelemetryCard title="Điện năng" icon={<Lightbulb className="h-8 w-8 text-slate-600" />} data={{ ts: pzem?.ts, value: pzem?.energy }} loading={loading} unit=" kWh" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình thiết bị kho {id}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3 grid-cols-1">
          <div className="flex flex-col gap-2">
            <Label>Nhiệt độ đặt (temp)</Label>
            <Input type="number" value={attribute?.[`set-${id}`]?.temp ?? ""}
              onChange={(e) => setAttribute((a:any) => ({ ...a, [`set-${id}`]: { ...(a?.[`set-${id}`]||{}), temp: parseFloat(e.target.value) } }))} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Chế độ (mode)</Label>
            <Select value={(attribute?.[`set-${id}`]?.mode ?? "").toString()}
              onValueChange={(v) => setAttribute((a:any) => ({ ...a, [`set-${id}`]: { ...(a?.[`set-${id}`]||{}), mode: parseInt(v) } }))}>
              <SelectTrigger><SelectValue placeholder="Chọn chế độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tốc độ quạt (fan)</Label>
            <Select value={(attribute?.[`set-${id}`]?.fan ?? "").toString()}
              onValueChange={(v) => setAttribute((a:any) => ({ ...a, [`set-${id}`]: { ...(a?.[`set-${id}`]||{}), fan: parseInt(v) } }))}>
              <SelectTrigger><SelectValue placeholder="Chọn tốc độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Đèn (light)</Label>
            <Button onClick={() => setAttribute((a:any) => ({ ...a, [`set-${id}`]: { ...(a?.[`set-${id}`]||{}), light: !(a?.[`set-${id}`]?.light) } }))}>
              {(attribute?.[`set-${id}`]?.light ? "Tắt" : "Bật")}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Cửa (door)</Label>
            <Button onClick={() => setAttribute((a:any) => ({ ...a, [`set-${id}`]: { ...(a?.[`set-${id}`]||{}), door: !(a?.[`set-${id}`]?.door) } }))}>
              {(attribute?.[`set-${id}`]?.door ? "Đóng" : "Mở")}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Nguồn (power)</Label>
            <Button onClick={() => setAttribute((a:any) => ({ ...a, [`set-${id}`]: { ...(a?.[`set-${id}`]||{}), power: !(a?.[`set-${id}`]?.power) } }))}>
              {(attribute?.[`set-${id}`]?.power ? "Tắt" : "Bật")}
            </Button>
          </div>
          <div className="flex items-end">
            <Button onClick={() => saveAttr({ [`set-${id}`]: attribute?.[`set-${id}`] }, "Đã lưu cấu hình")}>Lưu cấu hình</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin Nhà kho {id}</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 grid-cols-1 gap-3">
          <div>
            <Label>Tên (name)</Label>
            <Input value={attribute?.[id]?.name ?? ""}
              onChange={(e) => setAttribute((a:any) => ({ ...a, [id]: { ...(a?.[id] || {}), name: e.target.value } }))} />
          </div>
          <div>
            <Label>Vật liệu (marterial)</Label>
            <Input value={attribute?.[id]?.marterial ?? ""}
              onChange={(e) => setAttribute((a:any) => ({ ...a, [id]: { ...(a?.[id] || {}), marterial: e.target.value } }))} />
          </div>
          <div>
            <Label>Latitude</Label>
            <Input type="number" value={attribute?.[id]?.latitude ?? ""}
              onChange={(e) => setAttribute((a:any) => ({ ...a, [id]: { ...(a?.[id] || {}), latitude: parseFloat(e.target.value) } }))} />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input type="number" value={attribute?.[id]?.longitude ?? ""}
              onChange={(e) => setAttribute((a:any) => ({ ...a, [id]: { ...(a?.[id] || {}), longitude: parseFloat(e.target.value) } }))} />
          </div>
          <div className="col-span-full">
            <Button onClick={() => saveAttr({ [id]: attribute?.[id] }, "Đã lưu thông tin kho")}>Lưu thông tin kho</Button>
          </div>
        </CardContent>
      </Card>

      {/* Bảng dữ liệu */}
      {table}

      {/* Biểu đồ Temp & Hum */}
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ nhiệt độ</CardTitle>
        </CardHeader>
        <CardContent>
          <TelemetryJsonChart entityId={deviceId} entityType={TbEntity.DEVICE} keyId={id} field="temp" label={`Temp kho ${id}`} startTs={start24h} endTs={now} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ độ ẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <TelemetryJsonChart entityId={deviceId} entityType={TbEntity.DEVICE} keyId={id} field="hum" label={`Hum kho ${id}`} startTs={start24h} endTs={now} />
        </CardContent>
      </Card>
    </div>
  );
}
