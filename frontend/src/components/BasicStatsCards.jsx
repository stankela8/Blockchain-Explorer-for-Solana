import React, { useEffect, useState } from "react";

const BasicStatsCards = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await fetch("http://127.0.0.1:8000/api/basic-stats/");
        const data = await resp.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };

    fetchStats();
    const id = setInterval(fetchStats, 3000);
    return () => clearInterval(id);
  }, []);

  if (!stats) {
    return <div style={{ color: "white" }}>Loading basic stats…</div>;
  }

  const formatSol = (v) =>
    v.toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <Card title="Current TPS" value={stats.tps?.toFixed(2)} suffix=" tx/s" />
      <Card
        title="Total Supply"
        value={formatSol(stats.total_supply_sol)}
        suffix=" SOL"
      />
      <Card
        title="Circulating"
        value={formatSol(stats.circulating_supply_sol)}
        suffix=" SOL"
      />
      <Card
        title="Non-circulating"
        value={formatSol(stats.non_circulating_supply_sol)}
        suffix=" SOL"
      />
      <Card title="Epoch" value={stats.epoch} />
      <Card title="Current Slot" value={stats.current_slot} />
    </div>
  );
};

const Card = ({ title, value, suffix }) => (
  <div
    style={{
      background: "#151822",
      padding: "1rem 1.5rem",
      borderRadius: "8px",
      minWidth: "180px",
    }}
  >
    <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{title}</div>
    <div style={{ color: "white", fontSize: "1.2rem", marginTop: "0.25rem" }}>
      {value}
      {suffix && (
        <span style={{ color: "#6b7280", marginLeft: "0.25rem" }}>
          {suffix}
        </span>
      )}
    </div>
  </div>
);

export default BasicStatsCards;
