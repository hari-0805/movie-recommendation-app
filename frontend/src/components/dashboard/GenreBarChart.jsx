import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const COLORS = ["#6200EA", "#eb3b5a", "#26de81", "#f7b731", "#2bcbba"];

function GenreBarChart({ data, loading }) {
  if (loading) return <div className="db-chart-skeleton" />;

  if (!data || data.length === 0) {
    return (
      <div className="db-empty-chart">
        <p></p>
        <p>No genre data yet.</p>
        <p>Mark some movies as watched to see your top genres.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="genre" tick={{ fontSize: 12, fill: "var(--muted)" }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
        <Tooltip
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
          labelStyle={{ color: "var(--text)", fontWeight: 700 }}
          itemStyle={{ color: "var(--text)" }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default GenreBarChart;
