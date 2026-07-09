import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDashboardStats,
  getDashboardGenres,
  getDashboardMonthly,
  getDashboardRecent,
} from "../api/movieApi";
import DashboardStatsCards from "../components/dashboard/DashboardStatsCards";
import GenreBarChart       from "../components/dashboard/GenreBarChart";
import MonthlyChart        from "../components/dashboard/MonthlyChart";
import RecentActivity      from "../components/dashboard/RecentActivity";
import { useAuth }         from "../context/AuthContext";

function DashboardPage({ onViewDetails, onToast }) {
  const { user } = useAuth();

  const [stats,   setStats]   = useState(null);
  const [genres,  setGenres]  = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [recent,  setRecent]  = useState(null);

  const [loadingStats,   setLoadingStats]   = useState(true);
  const [loadingGenres,  setLoadingGenres]  = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [loadingRecent,  setLoadingRecent]  = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => onToast?.("Failed to load stats", "error"))
      .finally(() => setLoadingStats(false));

    getDashboardGenres()
      .then((data) => setGenres(data))
      .catch(() => {})
      .finally(() => setLoadingGenres(false));

    getDashboardMonthly()
      .then(setMonthly)
      .catch(() => {})
      .finally(() => setLoadingMonthly(false));

    getDashboardRecent()
      .then(setRecent)
      .catch(() => {})
      .finally(() => setLoadingRecent(false));
  }, []);

  // Inject top genre into stats for the badge
  const statsWithGenre = stats
    ? { ...stats, _topGenre: genres[0]?.genre || null }
    : null;

  const watchedCount   = stats?.watched_count   ?? 0;
  const watchlistCount = stats?.watchlist_count  ?? 0;

  // Motivational message
  function getMotivation() {
    if (!watchedCount) return "Start your movie journey — mark your first movie as watched!";
    if (watchedCount < 5)  return `Great start! You've watched ${watchedCount} movie${watchedCount > 1 ? "s" : ""} so far.`;
    if (watchedCount < 20) return `You're on a roll! ${watchedCount} movies watched.`;
    if (watchedCount < 50) return `Impressive! ${watchedCount} movies watched. You're a real cinephile!`;
    return `Legendary! ${watchedCount} movies watched. You're a true movie buff! `;
  }

  return (
    <div className="dashboard-page">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title"> Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, <strong>{user?.username}</strong>!</p>
          <p className="dashboard-motivation">{getMotivation()}</p>
        </div>
        <Link to="/" className="compare-back-link">← Back to Search</Link>
      </div>

      {/* Stats Cards */}
      <section className="db-section">
        <DashboardStatsCards stats={statsWithGenre} loading={loadingStats} />
      </section>

      {/* Charts */}
      <section className="db-section">
        <h2 className="db-section-title"> Your Movie Insights</h2>
        <div className="db-charts-row">
          <div className="db-chart-panel">
            <h3 className="db-chart-title">Top 5 Genres</h3>
            <GenreBarChart data={genres} loading={loadingGenres} />
          </div>
          <div className="db-chart-panel db-chart-panel-double">
            <MonthlyChart
              monthly={monthly}
              watchedCount={watchedCount}
              watchlistCount={watchlistCount}
              loading={loadingMonthly}
            />
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="db-section">
        <h2 className="db-section-title"> Recent Activity</h2>
        <RecentActivity
          data={recent}
          loading={loadingRecent}
          onViewDetails={onViewDetails}
        />
      </section>

    </div>
  );
}

export default DashboardPage;
