import { useState } from "react";
import axios from "./axios";
import { Link } from "react-router-dom";
import "./login.css";

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/auth/signup", form);
      localStorage.setItem("token", res.data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-page">  {/* <-- FIXED outer wrapper */}

      <div className="auth-container"> {/* centered card */}

        {/* LEFT FORM */}
        <form onSubmit={handleSignup}>
          <h2>Create Account</h2>

          <input
            placeholder="Full Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button type="submit">Signup</button>

          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <h2>Welcome!</h2>
          <p>Already registered?</p>

          <Link to="/login">
            <button className="panel-btn">Login</button>
          </Link>
        </div>

      </div>

    </div>
  );
}

export default Signup;
