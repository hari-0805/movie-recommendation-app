import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loginUser, registerUser } from "../api/movieApi";

function LoginPage({ onToast }) {
  const { login } = useAuth();
  const [isLogin,  setIsLogin]  = useState(true);
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

 
  function validate() {
    if (!email)    return "Email is required";
    if (!password) return "Password is required";
    if (!isLogin && !username) return "Username is required";
    if (!email.includes("@")) return "Enter a valid email";
    if (password.length < 6)  return "Password must be at least 6 characters";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (!isLogin) {
        await registerUser(username, email, password);
        onToast("Account created successfully!", "success");
      }

      const data = await loginUser(email, password);

   
      login(data.access_token, {
        id:       data.user?.id,
        username: data.user?.username || username || email.split("@")[0],
        email:    data.user?.email    || email,
      });

      onToast("Logged in successfully!", "success");

    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Something went wrong";
      setError(msg);
      onToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

 
  function handleKeyDown(e) {
    if (e.key === "Enter") handleSubmit();
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
          <div className="input-group">
            <label>Username</label>
            <input
              className="auth-input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        <div className="input-group">
          <label>Email</label>
          <input
            className="auth-input"
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            className="auth-input"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          className="auth-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <span className="btn-loading">Please wait...</span>
            : isLogin ? "Login" : "Register"
          }
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

export default LoginPage;
