import React from "react";

function GenreChart({ genres }) {
  if (!genres || genres.length === 0) return null;

  const colors = [
    "#6c63ff", "#ff6584", "#43d9ad", "#f7b731",
    "#fd9644", "#26de81", "#2bcbba", "#eb3b5a",
  ];

  return (
    <div className="genre-chart">
      <h3 className="genre-chart-title">🎭 Your Genre Taste</h3>
      <div className="genre-bars">
        {genres.slice(0, 6).map((g, i) => (
          <div key={g.genre} className="genre-row">
            <span className="genre-name">{g.genre}</span>
            <div className="genre-bar-track">
              <div
                className="genre-bar-fill"
                style={{
                  width: `${g.percentage}%`,
                  background: colors[i % colors.length],
                }}
              />
            </div>
            <span className="genre-pct">{g.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GenreChart;
