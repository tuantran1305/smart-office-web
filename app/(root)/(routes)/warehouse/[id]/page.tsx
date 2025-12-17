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
import { ThermometerSun, Droplet, BatteryFull, DoorOpen, User, Lightbulb, DoorClosed } from "lucide-react";
import { config } from "@/lib/config";
import { TbEntity } from "thingsboard-api-client";

const { deviceId, tbServer } = config;

const formatAttribute = (data: any) => {
  const booleanKeys = new Set(["light_state_1","door_state_1","light_state_2","door_state_2"]);
  const numberKeys = new Set(["air_temp","latitude_1","longitude_1","latitude_2","longitude_2"]);
  const format: Record<string, any> = {};
  Object.values(data).forEach((item: any) => {
    const key = item["key"]; const val = item["value"];
    if (booleanKeys.has(key)) {
      format[key] = val === true || val === "true" || val === 1 || val === "1";
    } else if (numberKeys.has(key)) {
      const n = typeof val === "number" ? val : parseFloat(val);
      format[key] = Number.isFinite(n) ? n : val;
    } else {
      format[key] = val;
    }
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

  const latestKeys = id === "1"
    ? ["temp_1","hum_1","bat_1","door_1","detect_1","light_state_1","door_state_1"].join(",")
    : ["temp_2","hum_2","bat_2","light_state_2","door_state_2"].join(",");

  const attrKeys = id === "1"
    ? ["ware_house_1","latitude_1","longitude_1","material_1","air_temp","air_fan","air_mode","light_state_1","door_state_1"].join(",")
    : ["ware_house_2","latitude_2","longitude_2","material_2","air_temp","air_fan","air_mode","light_state_2","door_state_2"].join(",");

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
        if (!prev) return prev;
        const upd = (key: string) => obj?.[key] ? [{ ts: obj[key][0][0], value: obj[key][0][1] }] : (prev as any)[key];
        if (id === "1") {
          return { ...prev,
            temp_1: upd("temp_1"), hum_1: upd("hum_1"), bat_1: upd("bat_1"),
            door_1: upd("door_1"), detect_1: upd("detect_1"), light_state_1: upd("light_state_1"), door_state_1: upd("door_state_1"),
          };
        } else {
          return { ...prev,
            temp_2: upd("temp_2"), hum_2: upd("hum_2"), bat_2: upd("bat_2"),
            light_state_2: upd("light_state_2"), door_state_2: upd("door_state_2"),
          };
        }
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
  const table = useMemo(() => (
    <TelemetryTable entityId={deviceId} entityType={TbEntity.DEVICE} keys={latestKeys} startTs={0} endTs={now} />
  ), [now, latestKeys]);

  const is1 = id === "1";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Chi tiết Nhà kho {id}</h2>
        <Link href="/warehouse"><Button variant="secondary">Quay lại danh sách</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông số kho {id}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 grid-cols-1">
          {is1 ? (
            <>
              <LatestTelemetryCard title="Nhiệt độ" icon={<ThermometerSun className="h-8 w-8 text-red-500" />} data={latestData?.["temp_1"]?.[0]} loading={loading} unit="°C" />
              <LatestTelemetryCard title="Độ ẩm" icon={<Droplet className="h-8 w-8 text-blue-500" />} data={latestData?.["hum_1"]?.[0]} loading={loading} unit="%" />
              <LatestTelemetryCard title="Pin" icon={<BatteryFull className="h-8 w-8 text-green-500" />} data={latestData?.["bat_1"]?.[0]} loading={loading} unit="%" />
              <LatestTelemetryCard title="Cửa" icon={<DoorOpen className="h-8 w-8 text-orange-500" />} data={latestData?.["door_1"]?.[0]} loading={loading} />
              <LatestTelemetryCard title="Hiện diện" icon={<User className="h-8 w-8 text-gray-700" />} data={latestData?.["detect_1"]?.[0]} loading={loading} />
              <LatestTelemetryCard title="Đèn" icon={<Lightbulb className="h-8 w-8 text-yellow-500" />} data={latestData?.["light_state_1"]?.[0]} loading={loading} isBoolean booleanArr={["Bật","Tắt"]} />
              <LatestTelemetryCard title="Trạng thái cửa" icon={<DoorClosed className="h-8 w-8 text-slate-500" />} data={latestData?.["door_state_1"]?.[0]} loading={loading} isBoolean booleanArr={["Mở","Đóng"]} />
            </>
          ) : (
            <>
              <LatestTelemetryCard title="Nhiệt độ" icon={<ThermometerSun className="h-8 w-8 text-red-500" />} data={latestData?.["temp_2"]?.[0]} loading={loading} unit="°C" />
              <LatestTelemetryCard title="Độ ẩm" icon={<Droplet className="h-8 w-8 text-blue-500" />} data={latestData?.["hum_2"]?.[0]} loading={loading} unit="%" />
              <LatestTelemetryCard title="Pin" icon={<BatteryFull className="h-8 w-8 text-green-500" />} data={latestData?.["bat_2"]?.[0]} loading={loading} unit="%" />
              {attribute?.["light_state_2"] !== undefined && (
                <LatestTelemetryCard title="Đèn" icon={<Lightbulb className="h-8 w-8 text-yellow-500" />} data={{ value: attribute?.["light_state_2"] }} loading={loading} isBoolean booleanArr={["Bật","Tắt"]} />
              )}
              {attribute?.["door_state_2"] !== undefined && (
                <LatestTelemetryCard title="Trạng thái cửa" icon={<DoorClosed className="h-8 w-8 text-slate-500" />} data={{ value: attribute?.["door_state_2"] }} loading={loading} isBoolean booleanArr={["Mở","Đóng"]} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cấu hình máy lạnh & điều khiển</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3 grid-cols-1">
          <div className="flex flex-col gap-2">
            <Label>air_temp (°C)</Label>
            <Input type="number" value={attribute?.["air_temp"] ?? ""} onChange={(e) => setAttribute((a:any) => ({ ...a, air_temp: parseInt(e.target.value) }))} />
            <Button onClick={() => saveAttr({ air_temp: parseInt(attribute?.["air_temp"] ?? 0) }, "Đã đặt nhiệt độ")}>Lưu</Button>
          </div>
          <div className="flex flex-col gap-2">
            <Label>air_fan</Label>
            <Select value={(attribute?.["air_fan"] ?? "").toString()} onValueChange={(v) => setAttribute((a:any) => ({ ...a, air_fan: parseInt(v) }))}>
              <SelectTrigger><SelectValue placeholder="Chọn tốc độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">low (1)</SelectItem>
                <SelectItem value="2">medium (2)</SelectItem>
                <SelectItem value="3">high (3)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => saveAttr({ air_fan: parseInt(attribute?.["air_fan"] ?? 1) }, "Đã đặt tốc độ quạt")}>Lưu</Button>
          </div>
          <div className="flex flex-col gap-2">
            <Label>air_mode</Label>
            <Select value={(attribute?.["air_mode"] ?? "").toString()} onValueChange={(v) => setAttribute((a:any) => ({ ...a, air_mode: parseInt(v) }))}>
              <SelectTrigger><SelectValue placeholder="Chọn chế độ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">cool</SelectItem>
                <SelectItem value="2">dry</SelectItem>
                <SelectItem value="3">fan</SelectItem>
                <SelectItem value="4">auto</SelectItem>
                <SelectItem value="5">heat</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => saveAttr({ air_mode: parseInt(attribute?.["air_mode"] ?? 1) }, "Đã đặt chế độ")}>Lưu</Button>
          </div>

          {/* Toggle light/door per warehouse if attribute exists */}
          {is1 ? (
            <>
              <div className="flex flex-col gap-2">
                <Label>Đèn kho 1 (light_state_1)</Label>
                <Button onClick={() => saveAttr({ light_state_1: !attribute?.["light_state_1"] }, "Đã cập nhật đèn")}>{attribute?.["light_state_1"] ? "Tắt" : "Bật"}</Button>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Cửa kho 1 (door_state_1)</Label>
                <Button onClick={() => saveAttr({ door_state_1: !attribute?.["door_state_1"] }, "Đã cập nhật cửa")}>{attribute?.["door_state_1"] ? "Đóng" : "Mở"}</Button>
              </div>
            </>
          ) : (
            <>
              {attribute?.["light_state_2"] !== undefined && (
                <div className="flex flex-col gap-2">
                  <Label>Đèn kho 2 (light_state_2)</Label>
                  <Button onClick={() => saveAttr({ light_state_2: !attribute?.["light_state_2"] }, "Đã cập nhật đèn")}>{attribute?.["light_state_2"] ? "Tắt" : "Bật"}</Button>
                </div>
              )}
              {attribute?.["door_state_2"] !== undefined && (
                <div className="flex flex-col gap-2">
                  <Label>Cửa kho 2 (door_state_2)</Label>
                  <Button onClick={() => saveAttr({ door_state_2: !attribute?.["door_state_2"] }, "Đã cập nhật cửa")}>{attribute?.["door_state_2"] ? "Đóng" : "Mở"}</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin Nhà kho {id}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {is1 ? (
            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
              <div>
                <Label>Tên</Label>
                <Input value={attribute?.["ware_house_1"] ?? ""} onChange={(e) => setAttribute((a:any) => ({ ...a, ware_house_1: e.target.value }))} />
              </div>
              <div>
                <Label>Vật liệu bảo quản</Label>
                <Input value={attribute?.["material_1"] ?? ""} onChange={(e) => setAttribute((a:any) => ({ ...a, material_1: e.target.value }))} />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input type="number" value={attribute?.["latitude_1"] ?? ""} onChange={(e) => setAttribute((a:any) => ({ ...a, latitude_1: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input type="number" value={attribute?.["longitude_1"] ?? ""} onChange={(e) => setAttribute((a:any) => ({ ...a, longitude_1: parseFloat(e.target.value) }))} />
              </div>
              <Button onClick={() => saveAttr({ ware_house_1: attribute?.["ware_house_1"], material_1: attribute?.["material_1"], latitude_1: attribute?.["latitude_1"], longitude_1: attribute?.["longitude_1"] }, "Đã lưu kho 1")}>Lưu kho 1</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
              <div>
                <Label>Tên</Label>
                <Input value={attribute?.["ware_house_2"] ?? ""} onChange={(e) => setAttribute((a:any) => ({ ...a, ware_house_2: e.target.value }))} />
              </div>
              <div>
                <Label>Vật liệu bảo quản</Label>
                <Input value={attribute?.["material_2"] ?? ""} onChange={(e) => setAttribute((a:any) => ({ ...a, material_2: e.target.value }))} />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input type="number" value={attribute?.["latitude_2"] ?? ""} onChange={(e) => setAttribute((a:any) => ({ ...a, latitude_2: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input type="number" value={attribute?.["longitude_2"] ?? ""} onChange={(e) => setAttribute((a:any) => ({ ...a, longitude_2: parseFloat(e.target.value) }))} />
              </div>
              <Button onClick={() => saveAttr({ ware_house_2: attribute?.["ware_house_2"], material_2: attribute?.["material_2"], latitude_2: attribute?.["latitude_2"], longitude_2: attribute?.["longitude_2"] }, "Đã lưu kho 2")}>Lưu kho 2</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bảng dữ liệu */}
      {table}
    </div>
  );
}
