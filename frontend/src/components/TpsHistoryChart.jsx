import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TpsHistoryChart = () => {
  const [labels, setLabels] = useState([]);
  const [dataPoints, setDataPoints] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await fetch("http://127.0.0.1:8000/api/basic-stats/");
        const data = await resp.json();

        const series = data.tps_series || [];
        const reversed = [...series].reverse(); // najstariji lijevo

        setLabels(reversed.map((s) => `slot ${s.slot}`));
        setDataPoints(reversed.map((s) => s.tps));
      } catch (err) {
        console.error("Failed to fetch TPS history", err);
      }
    };

    fetchStats();
    const id = setInterval(fetchStats, 3000);
    return () => clearInterval(id);
  }, []);

  const chartData = {
  labels,
  datasets: [
    {
      label: "TPS per sample",
      data: dataPoints,
      backgroundColor: "rgba(129, 140, 248, 0.6)",   // indigo
      borderColor: "rgba(129, 140, 248, 1)",
      borderWidth: 1,
    },
  ],
};

  const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top", labels: { color: "#e5e7eb" } },
    title: {
  display: true,
  text: [
    "TPS – recent performance samples",
    "Each bar = aggregated TPS over ~1s window",
  ],
  color: "#e5e7eb",
},
tooltip: {
    callbacks: {
      label: (ctx) => {
        const value = ctx.parsed.y.toFixed(1);
        const label = ctx.label || "";
        return `${label}: ${value} tx/s`;
      },
    },
  },
  },
  scales: {
    x: {
      title: { display: true, text: "Sample / slot", color: "#9ca3af" },
      ticks: { color: "#6b7280" },
    },
    y: {
      title: { display: true, text: "TPS", color: "#9ca3af" },
      beginAtZero: true,
      suggestedMax: 150,
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
      height: "260px",
    }}
  >
    <Bar data={chartData} options={options} />
  </div>
);

};

export default TpsHistoryChart;
