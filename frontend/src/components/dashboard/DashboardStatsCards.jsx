import React, { useEffect, useState } from "react";

const STAT_META = [
  { key: "watched_count",     label: "Movies Watched",      icon: "" },
  { key: "favorites_count",   label: "Favorites",           icon: "❤️" },
  { key: "watchlist_count",   label: "Watchlist",           icon: "" },
  { key: "reviews_count",     label: "Reviews Written",     icon: "✍️" },
  { key: "collections_count", label: "Collections",         icon: "" },
  { key: "total_searches",    label: "Searches Made",       icon: "" },
];

function AnimatedCount({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(cur);
      if (cur >= target) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [target]);
  return <span>{val}</span>;
}

function DashboardStatsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="db-stats-grid">
        {STAT_META.map((s) => (
          <div key={s.key} className="db-stat-card db-stat-skeleton" />
        ))}
      </div>
    );
  }

  const topGenre = stats?._topGenre;

  return (
    <>
      {topGenre && (
        <div className="db-highlight-badge">
           Most Watched Genre: <strong>{topGenre}</strong>
        </div>
      )}
      <div className="db-stats-grid">
        {STAT_META.map((s) => (
          <div key={s.key} className="db-stat-card">
            <span className="db-stat-icon">{s.icon}</span>
            <span className="db-stat-count">
              <AnimatedCount target={stats?.[s.key] ?? 0} />
            </span>
            <span className="db-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default DashboardStatsCards;
