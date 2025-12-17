"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WarehouseListPage() {
  const [attr, setAttr] = useState<any>();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    const load = async () => {
      await axios.post(`/api/telemetry/attribute`, {
        token,
        deviceId: (await import("@/lib/config")).config.deviceId,
        keys: ["ware_house_1","material_1","ware_house_2","material_2"].join(","),
      }).then((resp) => setAttr(resp.data)).catch(() => {});
    };
    load();
  }, []);

  const getVal = (key: string) => {
    const item = Object.values(attr || {}).find((x: any) => x.key === key);
    return item?.value ?? "";
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Nhà Kho</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 grid-cols-1">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Nhà kho 1</h3>
            <p className="text-sm">Tên: {getVal("ware_house_1")}</p>
            <p className="text-sm">Vật liệu: {getVal("material_1")}</p>
            <div className="mt-4 flex gap-2">
              <Link href="/warehouse/1"><Button>Chi tiết</Button></Link>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Nhà kho 2</h3>
            <p className="text-sm">Tên: {getVal("ware_house_2")}</p>
            <p className="text-sm">Vật liệu: {getVal("material_2")}</p>
            <div className="mt-4 flex gap-2">
              <Link href="/warehouse/2"><Button>Chi tiết</Button></Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
