import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "./axios";
import "./login.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  // Google Login
  const handleGoogleResponse = async (resp) => {
    try {
      const res = await axios.post("/auth/google-login", {
        token: resp.credential,
      });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch {
      alert("Google login failed");
    }
  };

  useEffect(() => {
    const loadGoogleButton = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large", width: "100%" }
        );
      } else {
        setTimeout(loadGoogleButton, 100);
      }
    };

    loadGoogleButton();
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* LEFT SIDE - LOGIN FORM */}
        <form onSubmit={handleLogin}>
          <h2>Welcome Back</h2>
          <p className="subtitle">Enter your details to access your account</p>

          <div className="input-group">
            <input
              type="email"
              placeholder="Email Address"
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              required
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit">Sign In</button>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <div id="googleBtn"></div>
        </form>

        {/* RIGHT SIDE - WELCOME PANEL */}
        <div className="right-panel">
          <h2>Hello, Friend!</h2>
          <p>Don't have an account yet? Sign up now and start your journey with us.</p>
          <Link to="/signup">
            <button className="panel-btn">Sign Up</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;