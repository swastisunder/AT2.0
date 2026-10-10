import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";

export default function Health() {
  const [uptime, setUptime] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/health")
      .then((res) => {
        setUptime(res.data.data.uptime);
      })
      .catch(() => setUptime("Unavailable"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Server Health</h1>
      <p>Uptime: {loading ? "Loading..." : uptime}</p>
    </div>
  );
}
