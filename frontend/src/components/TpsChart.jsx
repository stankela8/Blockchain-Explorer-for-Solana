import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TpsChart = () => {
  const [labels, setLabels] = useState([]);
  const [tpsData, setTpsData] = useState([]);

  useEffect(() => {
    const intervalMs = 3000;

    const fetchStats = async () => {
      try {
        const resp = await fetch("http://127.0.0.1:8000/api/basic-stats/");
        const data = await resp.json();

        const label = `slot ${data.current_slot}`;

        setLabels((prev) => [...prev.slice(-20), label]);
        setTpsData((prev) => [...prev.slice(-20), data.tps]);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    fetchStats();
    const id = setInterval(fetchStats, intervalMs);
    return () => clearInterval(id);
  }, []);

  const chartData = {
  labels,
  datasets: [
    {
      label: "TPS",
      data: tpsData,
      borderColor: "rgba(45, 212, 191, 1)",
      backgroundColor: "rgba(45, 212, 191, 0.25)",
      tension: 0.3,
      pointRadius: 2,
    },
  ],
};

  const minTps =
    tpsData.length > 0 ? Math.min(...tpsData).toFixed(1) : null;
  const maxTps =
    tpsData.length > 0 ? Math.max(...tpsData).toFixed(1) : null;

  const subtitle =
    minTps && maxTps
      ? `Last ${tpsData.length} samples – min ${minTps}, max ${maxTps} tx/s`
      : "";

      
   const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
  legend: { position: "top", labels: { color: "#e5e7eb" } },
  title: {
    display: true,
    text: subtitle
      ? ["Solana TPS (devnet)", subtitle]
      : "Solana TPS (devnet)",
    color: "#e5e7eb",
  },
},

    scales: {
      x: {
        title: { display: true, text: "Slot", color: "#9ca3af" },
        ticks: { color: "#6b7280" },
      },
      y: {
        title: { display: true, text: "TPS", color: "#9ca3af" },
        beginAtZero: true,
        suggestedMax: 200,
        ticks: { color: "#6b7280" },
        grid: { color: "rgba(55, 65, 81, 0.4)" },
      },
    },
  };

  return (
    <div
      style={{
        background: "#020617",
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
        border: "1px solid rgba(55, 65, 81, 0.8)",
        height: "320px",
      }}
    >
      <Line data={chartData} options={options} />
    </div>
  );
};

export default TpsChart;
