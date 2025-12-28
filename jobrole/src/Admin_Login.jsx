import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./axios";
import "./admin.css";

function Admin_Login() {
    const [code, setCode] = useState(new Array(7).fill(""));
    const [error, setError] = useState("");
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    const handleChange = (element, index) => {
        if (isNaN(element.value) && element.value !== "" && !/^[a-zA-Z]$/.test(element.value)) return false;

        const newCode = [...code];
        newCode[index] = element.value.toUpperCase();
        setCode(newCode);

        // Focus next input
        if (element.value !== "" && index < 6) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const secretCode = code.join("");
        if (secretCode.length !== 7) {
            setError("Please enter all 7 characters");
            return;
        }

        try {
            console.log("Attempting Admin Login with code:", secretCode);
            const res = await axios.post("/api/admin/login", { secretCode });
            console.log("Login Success:", res.data);
            localStorage.setItem("adminToken", res.data.token);
            navigate("/admin");
        } catch (err) {
            console.error("Admin Login Error Details:", {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
                config: err.config // Add request config for more context
            });
            setError(err.response?.data?.message || err.response?.data?.error || "Connection Error: Check if server is running on port 3000");
            setCode(new Array(7).fill(""));
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        }
    };

    return (
        <div className="auth-page admin-login-page">
            <div className="admin-login-card">
                <div className="admin-header">
                    <div className="lock-icon">🔒</div>
                    <h2>Admin Authentication</h2>
                    <p>Please enter the 7-character security code to access the terminal.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="code-container">
                        {code.map((data, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                className="code-box"
                                value={data}
                                ref={(el) => (inputRefs.current[index] = el)}
                                onChange={(e) => handleChange(e.target, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                            />
                        ))}
                    </div>

                    {error && <p className="error-msg">{error}</p>}

                    <button type="submit" className="admin-submit-btn">
                        Verify Identity
                    </button>

                    <button type="button" className="back-link" onClick={() => navigate("/login")}>
                        ← Back to User Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Admin_Login;
