import { useEffect, useState } from "react";
import axios from "./axios";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/signup", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

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
        {/* LEFT FORM */}
        <form onSubmit={handleSignup}>
          <h2>Create Account</h2>
          <p className="subtitle">Join us to start your career journey</p>

          <div className="input-group">
            <input
              placeholder="Full Name"
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

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
              type="tel"
              placeholder="Phone Number"
              required
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
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

          <button type="submit">Create Account</button>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <div id="googleBtn"></div>
        </form>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <h2>Welcome!</h2>
          <p>Already have an account? Log in to continue where you left off.</p>

          <Link to="/login">
            <button className="panel-btn">Sign In</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
