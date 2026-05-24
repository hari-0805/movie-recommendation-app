import React, { useState } from "react";

const BASE_URL = "http://localhost:8000";

function AuthPage({ onLoginSuccess }) {
  const [isLogin,  setIsLogin]  = useState(true);
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      if (!isLogin) {
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.detail || "Registration failed");
      }

      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.detail || "Login failed");

      localStorage.setItem("token", loginData.access_token);
      onLoginSuccess();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2 className="auth-title"> MovieSearch</h2>
        <p className="auth-subtitle">
          {isLogin ? "Login to your account" : "Create a new account"}
        </p>

        {error && <div className="error-box">⚠️ {error}</div>}

        {!isLogin && (
          <input
            className="auth-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}

        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="auth-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
        </button>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            className="auth-toggle-btn"
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
          >
            {isLogin ? " Register" : " Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
