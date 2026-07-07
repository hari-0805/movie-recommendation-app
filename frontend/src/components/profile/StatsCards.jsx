import React, { useEffect, useState } from "react";
import { getProfileStats } from "../../api/movieApi";

const STAT_META = [
  { key: "watched_count",   label: "Movies Watched", icon: "" },
  { key: "favorites_count", label: "Favorites",      icon: "❤️" },
  { key: "watchlist_count", label: "Watchlist",      icon: "" },
  { key: "reviews_count",   label: "Reviews",        icon: "✍️" },
];

function AnimatedCount({ target }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const duration = 900;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{display}</span>;
}

function StatsCards() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfileStats()
      .then(setStats)
      .catch(() => setStats({ watched_count: 0, favorites_count: 0, watchlist_count: 0, reviews_count: 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="stats-grid">
      {STAT_META.map((s) => (
        <div key={s.key} className="stat-card stat-card-skeleton" />
      ))}
    </div>
  );

  return (
    <div className="stats-grid">
      {STAT_META.map((s) => (
        <div key={s.key} className="stat-card">
          <span className="stat-icon">{s.icon}</span>
          <span className="stat-count">
            <AnimatedCount target={stats?.[s.key] ?? 0} />
          </span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
