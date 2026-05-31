import React from "react";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { loggedIn } = useAuth();


  if (!loggedIn) {
    return (
      <div className="protected-screen">
        <div className="protected-box">
          <h2> Login Required</h2>
          <p>Please login to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
