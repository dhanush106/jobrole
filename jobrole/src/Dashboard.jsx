import { useState, useEffect } from "react";
import axios from "./axios";
import "./Dashboard.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", gender: "", cgpa: "",
    interests: "", certificates: "", skills: "", degree: "", ug_specialization: ""
  });
  const [status, setStatus] = useState("");

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    try {
      const res = await axios.get("/auth/me");
      const u = res.data;
      setUser(u);
      setFormData({
        name: u.name || "", email: u.email || "", phone: u.phone || "",
        gender: u.gender || "", cgpa: u.cgpa || "",
        interests: u.interests ? u.interests.join(", ") : "",
        certificates: u.certificates ? u.certificates.join(", ") : "",
        skills: u.skills ? u.skills.join(", ") : "",
        degree: u.degree || "", ug_specialization: u.ug_specialization || ""
      });
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    const payload = {
      ...formData,
      interests: formData.interests.split(",").map(s => s.trim()).filter(Boolean),
      certificates: formData.certificates.split(",").map(s => s.trim()).filter(Boolean),
      skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
      cgpa: parseFloat(formData.cgpa)
    };
    try {
      const res = await axios.post("/api/user/preprocess", payload);
      setUser(prev => ({ ...prev, ...payload, recommendations: res.data.data.recommendations }));
      setStatus("success");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  // --- Visual Data ---
  const recommendations = user?.recommendations || [];
  const barData = recommendations.slice(0, 5).map(r => ({ name: r.role, val: r.confidence }));

  const calculateCompleteness = () => {
    const fields = ['name', 'cgpa', 'skills', 'degree', 'ug_specialization'];
    let filled = 0;
    fields.forEach(f => { if (formData[f]) filled++; });
    return (filled / fields.length) * 100;
  };

  const radialData = [{ name: 'L1', value: calculateCompleteness(), fill: '#ff1493' }];

  if (isEditing) {
    return (
      <div className="dash-container">
        <div className="bento-card" style={{ maxWidth: '600px', width: '100%' }}>
          <h3>Update Your Profile</h3>
          <form onSubmit={handleSubmit} className="glass-form">
            <div className="glass-input-group">
              <label>Full Name</label>
              <input className="glass-input" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="glass-input-group" style={{ flex: 1 }}>
                <label>Degree</label>
                <input className="glass-input" name="degree" value={formData.degree} onChange={handleChange} />
              </div>
              <div className="glass-input-group" style={{ flex: 1 }}>
                <label>Specialization</label>
                <input className="glass-input" name="ug_specialization" value={formData.ug_specialization} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="glass-input-group" style={{ flex: 1 }}>
                <label>Gender</label>
                <select className="glass-input" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="glass-input-group" style={{ flex: 1 }}>
                <label>CGPA</label>
                <input className="glass-input" type="number" step="0.1" name="cgpa" value={formData.cgpa} onChange={handleChange} />
              </div>
            </div>
            <div className="glass-input-group">
              <label>Skills (comma separated)</label>
              <textarea className="glass-input" name="skills" value={formData.skills} onChange={handleChange} rows="3" />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                {status === "submitting" ? "Processing..." : "Analyze Profile"}
              </button>
              <button type="button" className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }} onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-container">
      <div className="bento-grid">

        {/* Card 1: Profile Header */}
        <div className="bento-card card-profile">
          <button className="update-trigger" onClick={() => setIsEditing(true)}>Edit</button>
          <div className="profile-main">
            <div className="avatar-large">{formData.name ? formData.name[0] : 'U'}</div>
            <div className="user-meta">
              <h2>{formData.name || "Set Name"}</h2>
              <p>{formData.email}</p>
              <p style={{ color: '#00f2fe' }}>{user?.degree} • {user?.ug_specialization}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Profile Strength */}
        <div className="bento-card card-strength">
          <h3>Profile Strength</h3>
          <ResponsiveContainer width="100%" height={140}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={10} data={radialData} startAngle={90} endAngle={450}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={5} />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="progress-label">
                {Math.round(radialData[0].value)}%
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Card 3: Education Context */}
        <div className="bento-card card-education">
          <h3>Performance</h3>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#00f2fe' }}>{user?.cgpa || '0.0'}</span>
            <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Current CGPA</p>
          </div>
        </div>

        {/* Card 4: Skill Tags */}
        <div className="bento-card card-skills">
          <h3>Key Competencies</h3>
          <div className="skills-flex">
            {user?.skills?.length > 0 ? user.skills.map((s, i) => (
              <span key={i} className="skill-tag">{s}</span>
            )) : <p style={{ opacity: 0.3 }}>No skills defined</p>}
          </div>
        </div>

        {/* Card 5: Role Probabilities */}
        <div className="bento-card card-graph">
          <h3>Career Path Logic</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} layout="vertical" margin={{ left: -20 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fill: '#fff', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1a1a1a', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="val" fill="url(#colorBar)" radius={[0, 10, 10, 0]} barSize={12}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff1493" />
                    <stop offset="100%" stopColor="#00f2fe" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Card 6: Detailed Recommendations */}
        <div className="bento-card card-recommendations">
          <h3>Top Career Recommendations</h3>
          <div className="rec-grid">
            {recommendations.length > 0 ? recommendations.map((r, i) => (
              <div key={i} className="career-path-card">
                <div className="path-header">
                  <span className="path-role">{r.role}</span>
                  <span className="path-conf">{r.confidence}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: `linear-gradient(90deg, #ff1493, #00f2fe)`, width: `${r.confidence}%` }}></div>
                </div>
                {r.missing_skills?.length > 0 && (
                  <div className="missing-box">
                    <p>Suggested Skillsets</p>
                    {r.missing_skills.map((ms, mi) => (
                      <span key={mi} className="ms-chip">{ms}</span>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px', opacity: 0.3 }}>
                Analyze your profile to generate path recommendations.
              </div>
            )}
          </div>
        </div>

      </div>

      <button
        onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
        style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'rgba(255,20,147,0.1)', color: '#ff1493', border: '1px solid #ff1493', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer' }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;