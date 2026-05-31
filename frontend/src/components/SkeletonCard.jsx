import React from "react";

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-poster shimmer"></div>
      <div className="skeleton-body">
        <div className="skeleton-line shimmer"></div>
        <div className="skeleton-line short shimmer"></div>
        <div className="skeleton-btn shimmer"></div>
      </div>
    </div>
  );
}

export default SkeletonCard;
