import { useState, useEffect } from "react";
import axios from "./axios";
import "./Dashboard.css";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    cgpa: "",
    interests: "",
    certificates: "",
    skills: "",
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await axios.get("/auth/me");
      setUser(res.data);
      setFormData({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        gender: res.data.gender || "",
        cgpa: res.data.cgpa || "",
        interests: res.data.interests ? res.data.interests.join(", ") : "",
        certificates: res.data.certificates ? res.data.certificates.join(", ") : "",
        skills: res.data.skills ? res.data.skills.join(", ") : "",
      });
    } catch (err) {
      console.log("Error fetching user data", err);
    }
  };

  const validate = () => {
    let newErrors = {};
    let isValid = true;
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!formData.name?.trim() || !nameRegex.test(formData.name)) {
      newErrors.name = "Name must contain only letters and spaces.";
      isValid = false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }
    const phoneRegex = /^\d+$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Phone must contain only numbers.";
      isValid = false;
    }
    if (!formData.gender) {
      newErrors.gender = "Please select a gender.";
      isValid = false;
    }
    const cgpaVal = parseFloat(formData.cgpa);
    if (!formData.cgpa || isNaN(cgpaVal) || cgpaVal < 1 || cgpaVal > 10) {
      newErrors.cgpa = "CGPA must be between 1 and 10.";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    const payload = {
      ...formData,
      interests: formData.interests.split(",").map((s) => s.trim()).filter(Boolean),
      certificates: formData.certificates.split(",").map((s) => s.trim()).filter(Boolean),
      skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
      cgpa: parseFloat(formData.cgpa)
    };
    try {
      await axios.post("/api/user/preprocess", payload);
      setUser({ ...formData, skills: payload.skills });
      setStatus("success");
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Submit Error:", error);
      setStatus("error");
      alert("Failed to save data.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // --- Graph Data Prep ---
  // 1. Radar Data (Mocked categories for demo)
  const skillsCount = formData.skills ? formData.skills.split(",").filter(Boolean).length : 0;
  const certsCount = formData.certificates ? formData.certificates.split(",").filter(Boolean).length : 0;
  const interestCount = formData.interests ? formData.interests.split(",").filter(Boolean).length : 0;

  const radarData = [
    { subject: 'Skills', A: skillsCount * 20, fullMark: 100 }, // Scale up for visual
    { subject: 'Certifications', A: certsCount * 20, fullMark: 100 },
    { subject: 'Interests', A: interestCount * 10, fullMark: 100 },
    { subject: 'CGPA', A: (parseFloat(formData.cgpa) || 0) * 10, fullMark: 100 },
    { subject: 'Experience', A: 40, fullMark: 100 }, // Mock
    { subject: 'Activity', A: 60, fullMark: 100 }, // Mock
  ];

  // 2. Linear Bar Data (CGPA)
  const cgpaData = [
    { name: 'Your CGPA', score: parseFloat(formData.cgpa) || 0, max: 10 }
  ];

  // 3. Radial Bar (Profile Completeness)
  const calculateCompleteness = () => {
    let filled = 0;
    let total = 8; // name, email, phone, gender, cgpa, interests, certs, skills
    if (formData.name) filled++;
    if (formData.email) filled++;
    if (formData.phone) filled++;
    if (formData.gender) filled++;
    if (formData.cgpa) filled++;
    if (formData.interests) filled++;
    if (formData.certificates) filled++;
    if (formData.skills) filled++;
    return (filled / total) * 100;
  };

  const radialData = [
    { name: 'Completeness', value: calculateCompleteness(), fill: '#ff69b4' }
  ];

  return (
    <div className="dash-container">
      <div className="profile-card">
        <h2>User Profile</h2>

        <div className="profile-header">
          <div className="avatar">
            {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <h3>{formData.name || "User Name"}</h3>
            <p>{formData.email || "user@example.com"}</p>
          </div>
          {!isEditing && (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          /* EDIT FORM (Same as before) */
          <form onSubmit={handleSubmit} className="edit-form">
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={errors.name ? "error-input" : ""} />
              {errors.name && <span className="error-msg">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={errors.email ? "error-input" : ""} />
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>
            <div className="form-row">
              <div className="form-group half">
                <label>Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={errors.phone ? "error-input" : ""} />
                {errors.phone && <span className="error-msg">{errors.phone}</span>}
              </div>
              <div className="form-group half">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={errors.gender ? "error-input" : ""}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="error-msg">{errors.gender}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>CGPA</label>
              <input type="number" step="0.1" name="cgpa" value={formData.cgpa} onChange={handleChange} className={errors.cgpa ? "error-input" : ""} />
              {errors.cgpa && <span className="error-msg">{errors.cgpa}</span>}
            </div>
            <div className="form-group">
              <label>Interests (comma separated)</label>
              <input type="text" name="interests" value={formData.interests} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Certificates (comma separated)</label>
              <input type="text" name="certificates" value={formData.certificates} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Skills (comma separated)</label>
              <input type="text" name="skills" value={formData.skills} onChange={handleChange} />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={status === "submitting"}>
                {status === "submitting" ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* VIEW MODE + GRAPHS */
          <>
            <div className="profile-details">
              <div className="detail-row">
                <strong>Phone:</strong> <span>{formData.phone || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Gender:</strong> <span>{formData.gender || "N/A"}</span>
              </div>
              <div className="detail-row">
                <strong>Degree:</strong> <span>{user?.degree || "B.Tech"}</span>
              </div>
              <div className="detail-row">
                <strong>CGPA:</strong> <span>{formData.cgpa || "N/A"}</span>
              </div>

              <div className="detail-section">
                <strong>Skills:</strong>
                <div className="skills-container-view">
                  {formData.skills ? formData.skills.split(",").filter(Boolean).map((skill, i) => (
                    <span key={i} className="skill-chip">{skill.trim()}</span>
                  )) : <span className="no-data">No skills added</span>}
                </div>
              </div>
            </div>

            {/* METRICS SECTION */}
            <div className="metrics-section">
              <h3>Profile Metrics</h3>
              <div className="charts-grid">

                {/* CHART 1: RADAR */}
                <div className="chart-item">
                  <h4>Skill Balance</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#ffe0f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="User" dataKey="A" stroke="#ff69b4" fill="#ff69b4" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* CHART 2: RADIAL BAR (COMPLETENESS) */}
                <div className="chart-item">
                  <h4>Profile Strength</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart innerRadius="10%" outerRadius="80%" barSize={10} data={radialData}>
                      <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="progress-label">
                        {Math.round(radialData[0].value)}%
                      </text>
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>
          </>
        )}

        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

export default Dashboard;