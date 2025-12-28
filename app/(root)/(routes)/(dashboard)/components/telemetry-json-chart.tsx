import axios from "axios";
import { Loader } from "lucide-react";
import moment from "moment";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Chart } from "react-google-charts";
import { TbEntity } from "thingsboard-api-client";

interface Props {
  entityId: string;
  entityType: TbEntity;
  keyId: string; // "1" or "2"
  field: "temp" | "hum" | "bat";
  label: string;
  startTs: number;
  endTs: number;
}

const TelemetryJsonChart = ({ entityId, entityType, keyId, field, label, startTs, endTs }: Props) => {
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    const getData = async () => {
      setLoading(true);
      const resp = await axios.post(`/api/telemetry/timeseries`, { token, entityId, entityType, keys: keyId, startTs, endTs });
      const series = resp.data?.data?.[keyId] ?? resp.data?.[keyId] ?? [];
      const points = (series as any[]).map((p) => {
        let v: any = p.value; if (typeof v === "string") { try { v = JSON.parse(v); } catch {} }
        return [moment(p.ts).format("HH:mm DD-MM-YYYY"), parseFloat((v?.[field] ?? 0).toString())];
      }).sort();
      setData([["Thời gian", label], ...points]);
      setLoading(false);
    };
    getData();
  }, [entityId, entityType, keyId, field, label, startTs, endTs, router]);

  const options = { title: label, curveType: "function", legend: { position: "bottom" } };

  return (
    <div className="container mx-0 lg:mx-auto px-0">
      {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
      {data && <Chart chartType="LineChart" width="100%" height="300px" data={data} options={options} />}
    </div>
  );
};

export default TelemetryJsonChart;
