import React from "react";

const COLORS = [
  "#6c63ff", "#eb3b5a", "#26de81", "#f7b731",
  "#fd9644", "#2bcbba", "#a55eea", "#45aaf2",
];

function GenreChart({ genres }) {
  if (!genres || genres.length === 0) return null;

  return (
    <div className="genre-chips-wrap">
      <span className="genre-chips-label">🎭 Your Genre Taste</span>
      <div className="genre-chips">
        {genres.slice(0, 8).map((g, i) => (
          <div
            key={g.genre}
            className="genre-chip"
            style={{
              background: COLORS[i % COLORS.length] + "18",
              border: `1px solid ${COLORS[i % COLORS.length]}44`,
              color: COLORS[i % COLORS.length],
            }}
          >
            <span className="genre-chip-name">{g.genre}</span>
            <span className="genre-chip-pct">{g.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GenreChart;
