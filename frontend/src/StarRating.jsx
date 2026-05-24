import React from "react";
function StarRating({ rating }) {
  
  const ratingOutOf5 = parseFloat(rating) / 2;
  const totalStars = 5;
  const stars = [];

  for (let i = 1; i <= totalStars; i++) {
    if (i <= Math.floor(ratingOutOf5)) {
      stars.push(<span key={i} className="star full">★</span>);
    } else if (i === Math.ceil(ratingOutOf5) && ratingOutOf5 % 1 !== 0) {
      stars.push(<span key={i} className="star half">★</span>);
    } else {
      stars.push(<span key={i} className="star empty">★</span>);
    }
  }

  return (
    <div className="star-row">
      {stars}
      <span className="rating-number">{rating}/10</span>
    </div>
  );
}

export default StarRating;
