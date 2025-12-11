// import { useEffect, useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import axios from "./axios";

// function Login() {
//   const [form, setForm] = useState({ email: "", password: "" });
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.post("/auth/login", form);
//       localStorage.setItem("token", res.data.token);
//       navigate("/dashboard");
//     } catch (err) {
//       alert(err.response?.data?.message || "Login failed");
//     }
//   };

//   // Google Login
//   const handleGoogleResponse = async (resp) => {
//     try {
//       const res = await axios.post("/auth/google-login", {
//         token: resp.credential,
//       });
//       localStorage.setItem("token", res.data.token);
//       navigate("/dashboard");
//     } catch {
//       alert("Google login failed");
//     }
//   };

//   useEffect(() => {
//       console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
//     const loadGoogleButton = () => {
//       if (window.google) {
//         window.google.accounts.id.initialize({
//           client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
//           callback: handleGoogleResponse,
//         });

//         window.google.accounts.id.renderButton(
//           document.getElementById("googleBtn"),
//           { theme: "outline", size: "large" }
//         );
//       } else {
//         setTimeout(loadGoogleButton, 100);
//       }
//     };

//     loadGoogleButton();
//   }, []);

//   return (
//     <div style={{ maxWidth: 400, margin: "0 auto", padding: 20 }}>
//       <form onSubmit={handleLogin}>
//         <h2>Login</h2>

//         <input
//           style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
//           placeholder="Email"
//           onChange={(e) => setForm({ ...form, email: e.target.value })}
//         />

//         <input
//           type="password"
//           style={{ display: "block", width: "100%", marginBottom: 10, padding: 8 }}
//           placeholder="Password"
//           onChange={(e) => setForm({ ...form, password: e.target.value })}
//         />

//         <button type="submit" style={{ width: "100%", padding: 10, marginBottom: 10 }}>
//           Login
//         </button>
//       </form>

//       {/* Google Login */}
//       <div style={{ marginTop: 20, textAlign: "center" }}>
//         <div id="googleBtn"></div>
//       </div>

//       {/* Signup link */}
//       <p style={{ textAlign: "center", marginTop: 15 }}>
//         Don't have an account?{" "}
//         <Link to="/signup" style={{ color: "blue", textDecoration: "underline" }}>
//           Signup
//         </Link>
//       </p>
//     </div>
//   );
// }

// export default Login;
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "./axios";

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
    console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
    const loadGoogleButton = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { theme: "outline", size: "large" }
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
          <h2>Login</h2>

          <input
            placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button type="submit">
            Login
          </button>

          {/* Google Login */}
          <div id="googleBtn" ></div>

          {/* Hidden signup text */}
          <p style={{ display: "none" }}>
            Don't have an account? <Link to="/signup">Signup</Link>
          </p>
        </form>

        {/* RIGHT SIDE - WELCOME PANEL */}
        <div className="right-panel">
          <h2>Welcome back</h2>
          <p>Don't have an account yet? </p>
          <Link to="/signup">
            <button className="panel-btn">Sign Up</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;