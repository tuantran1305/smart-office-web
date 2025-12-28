import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { Loader } from "lucide-react";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TbEntity } from "thingsboard-api-client";

interface TelemetryTableProps {
  entityId: string;
  entityType: TbEntity;
  keys: string; // "1" or "2" (JSON series)
  startTs: number;
  endTs: number;
}

// Format timeseries where the value is JSON string {temp,hum,bat}
const formattedData = (raw: any, key: string) => {
  const series = raw?.data?.[key] ?? raw?.[key] ?? [];
  const rows = (series as any[]).map((p: any, idx: number) => {
    let obj: any = p.value;
    if (typeof obj === "string") { try { obj = JSON.parse(obj); } catch {} }
    return {
      idx,
      temp: obj?.temp ?? null,
      hum: obj?.hum ?? null,
      bat: obj?.bat ?? null,
      ts: moment(p.ts).format("HH:mm:ss DD-MM-YYYY"),
    };
  });
  return rows;
};

const TelemetryTable = ({
  entityId,
  entityType,
  keys,
  startTs,
  endTs,
}: TelemetryTableProps) => {
  const [dataFormatTable, setDataFormatTable] = useState() as any;
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "idx",
      header: "",
      cell: ({ row }) => (
        <p className="text-center">{parseInt(row.getValue("idx")) + 1}</p>
      ),
    },
    {
      accessorKey: "temp",
      header: "Nhiệt độ (°C)",
    },
    {
      accessorKey: "hum",
      header: "Độ ẩm (%)",
    },
    {
      accessorKey: "bat",
      header: "Pin (%)",
    },
    {
      accessorKey: "ts",
      header: "Thời gian cập nhật",
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
    const getData = async () => {
      setLoading(true);
      const resp = await axios.post(`/api/telemetry/timeseries`, {
        token,
        entityId,
        entityType,
        keys,
        startTs,
        endTs,
      });
      const formatData = formattedData(resp.data, keys);
      setDataFormatTable(formatData);
      setLoading(false);
    };
    getData();
  }, [endTs, entityId, entityType, keys, startTs]);

  return (
    <div className="container mx-0 lg:mx-auto px-0">
      {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
      {dataFormatTable != null && (
        <DataTable columns={columns} data={dataFormatTable} />
      )}
    </div>
  );
};

export default TelemetryTable;
