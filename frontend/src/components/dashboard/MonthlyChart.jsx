import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#6200EA", "#26de81"];

function MonthlyChart({ monthly, watchedCount, watchlistCount, loading }) {
  if (loading) return <div className="db-chart-skeleton" />;

  const hasMonthly = monthly && monthly.some((m) => m.count > 0);
  const pieData = [
    { name: "Watched",   value: watchedCount   || 0 },
    { name: "Watchlist", value: watchlistCount  || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="db-monthly-wrap">
      {/* Line chart */}
      <div className="db-chart-block">
        <h4 className="db-chart-title">Movies Watched — Last 6 Months</h4>
        {!hasMonthly ? (
          <div className="db-empty-chart">
            <p></p>
            <p>No activity in the last 6 months.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
                labelStyle={{ color: "var(--text)", fontWeight: 700 }}
                itemStyle={{ color: "var(--text)" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6200EA"
                strokeWidth={2.5}
                dot={{ fill: "#6200EA", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart */}
      <div className="db-chart-block">
        <h4 className="db-chart-title">Watchlist vs Watched</h4>
        {pieData.length === 0 ? (
          <div className="db-empty-chart">
            <p></p>
            <p>No data yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
                itemStyle={{ color: "var(--text)" }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 13, color: "var(--text)" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default MonthlyChart;
