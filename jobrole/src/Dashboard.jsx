import { useState, useEffect } from "react";
import axios from "./axios";
import "./Dashboard.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
  Radar, RadarChart, PolarGrid, PolarRadiusAxis
} from 'recharts';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", gender: "", cgpa: "",
    interests: "", certificates: "", skills: "", degree: "", ug_specialization: "",
    aspiringRole: ""
  });
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5, helpful: "Yes", confidenceAccuracy: "Medium", comment: "",
    aspiringRole: ""
  });
  const [status, setStatus] = useState("");

  const handleMouseMove = (e) => {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;

    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  };

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
        degree: u.degree || "", ug_specialization: u.ug_specialization || "",
        aspiringRole: u.aspiringRole || ""
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
      // Auto-popup removed as requested
    } catch (err) {
      console.error(err);
      setStatus("error");
      alert("Error processing profile. Please check console.");
    }
  };

  const getSkillData = () => {
    const skills = user?.skills || [];
    if (skills.length === 0) return [
      { subject: 'Coding', A: 0, fullMark: 100 },
      { subject: 'Design', A: 0, fullMark: 100 },
      { subject: 'Logic', A: 0, fullMark: 100 },
      { subject: 'Database', A: 0, fullMark: 100 },
      { subject: 'Cloud', A: 0, fullMark: 100 },
    ];
    // Mocking radar data based on user skills for visual effect
    return [
      { subject: 'Technical', A: Math.min(100, skills.length * 20), fullMark: 100 },
      { subject: 'Specialized', A: skills.some(s => s.toLowerCase().includes('python') || s.toLowerCase().includes('java')) ? 85 : 40, fullMark: 100 },
      { subject: 'UI/UX', A: skills.some(s => s.toLowerCase().includes('css') || s.toLowerCase().includes('react')) ? 90 : 30, fullMark: 100 },
      { subject: 'Backend', A: skills.some(s => s.toLowerCase().includes('node') || s.toLowerCase().includes('sql')) ? 95 : 50, fullMark: 100 },
      { subject: 'Strategy', A: user?.cgpa > 8 ? 80 : 50, fullMark: 100 },
    ];
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
            <div className="glass-input-group">
              <label>Aspiring Role (What role do you want?)</label>
              <input className="glass-input" name="aspiringRole" value={formData.aspiringRole} onChange={handleChange} placeholder="e.g. Senior Software Engineer" />
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
        <div className="bento-card card-profile" onMouseMove={handleMouseMove}>
          <button className="update-trigger" onClick={() => setIsEditing(true)}>Edit Profile</button>
          <div className="profile-main">
            <div className="avatar-large">{formData.name ? formData.name[0] : 'U'}</div>
            <div className="user-meta">
              <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '2px' }}>Welcome back,</p>
              <h2>{formData.name || "Set Name"}</h2>
              <p>{formData.email}</p>
              <p style={{ color: '#00f2fe', marginTop: '10px', fontWeight: 600 }}>{user?.degree || "No Degree"} • {user?.ug_specialization || "No Specialization"}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Profile Strength */}
        <div className="bento-card card-strength" onMouseMove={handleMouseMove}>
          <div className="card-header-flex">
            <h3>Profile Strength</h3>
            <span className="status-badge">LIVE</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={10} data={radialData} startAngle={90} endAngle={450}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={5} fill="#ff1493" />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="progress-label">
                {Math.round(radialData[0].value)}%
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Card 3: Education Context */}
        <div className="bento-card card-education" onMouseMove={handleMouseMove}>
          <h3>Academic Score</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span className="cgpa-display">{user?.cgpa || '0.0'}</span>
            <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Current CGPA</p>
          </div>
        </div>

        {/* Card 4: Radar Chart - Skill Distribution */}
        <div className="bento-card card-radar" onMouseMove={handleMouseMove}>
          <h3>Core Distribution</h3>
          <ResponsiveContainer width="100%" height="85%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getSkillData()}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#fff', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Skills" dataKey="A" stroke="#ff1493" fill="#ff1493" fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Card 5: Skill Tags */}
        <div className="bento-card card-skills" onMouseMove={handleMouseMove}>
          <h3>Key Competencies</h3>
          <div className="skills-flex" style={{ marginTop: '10px' }}>
            {user?.skills?.length > 0 ? user.skills.map((s, i) => (
              <span key={i} className="skill-tag">{s}</span>
            )) : <p style={{ opacity: 0.3 }}>No skills defined yet.</p>}
          </div>
        </div>

        {/* Card 6: Role Probabilities */}
        <div className="bento-card card-graph" onMouseMove={handleMouseMove}>
          <h3>Career Path Logic</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={barData} layout="vertical" margin={{ left: -20, top: 10 }}>
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

        {/* Card 7: Detailed Recommendations */}
        <div className="bento-card card-recommendations" onMouseMove={handleMouseMove}>
          <div className="card-header-flex">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <h3>Top Career Recommendations</h3>
              <button
                className="btn-primary"
                style={{ fontSize: '0.7rem', padding: '5px 10px', width: 'fit-content', border: '1px solid #00f2fe', background: 'rgba(0, 242, 254, 0.1)', color: '#00f2fe' }}
                onClick={() => {
                  setFeedbackData(prev => ({ ...prev, aspiringRole: formData.aspiringRole }));
                  setShowFeedback(true);
                }}
              >
                Help us improve this prediction 🚀
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>AI-Powered Insights</p>
          </div>
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

      {showFeedback && (
        <div className="feedback-overlay">
          <div className="feedback-modal bento-card" style={{ maxWidth: '500px', margin: '0 auto', background: '#1a1a1a', border: '1px solid #ff1493', padding: '30px', position: 'relative', zIndex: 1000 }}>
            <h3>How was your prediction?</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '20px' }}>Your feedback helps us retrain our AI for better accuracy.</p>

            <div className="glass-input-group">
              <label>Experience Rating (1-5)</label>
              <input
                type="range"
                min="1"
                max="5"
                value={feedbackData.rating}
                onChange={(e) => setFeedbackData({ ...feedbackData, rating: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#ff1493' }}
              />
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#ff1493', marginTop: '5px' }}>{feedbackData.rating} ⭐</div>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="glass-input-group" style={{ flex: 1 }}>
                <label>Was it helpful?</label>
                <select className="glass-input" value={feedbackData.helpful} onChange={(e) => setFeedbackData({ ...feedbackData, helpful: e.target.value })}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="glass-input-group">
                <label>Corrected / Target Role</label>
                <input
                  className="glass-input"
                  placeholder="What was the actual role you expected?"
                  value={feedbackData.aspiringRole}
                  onChange={(e) => setFeedbackData({ ...feedbackData, aspiringRole: e.target.value })}
                />
              </div>

              <div className="glass-input-group">
                <label>Accuracy</label>
                <select className="glass-input" value={feedbackData.confidenceAccuracy} onChange={(e) => setFeedbackData({ ...feedbackData, confidenceAccuracy: e.target.value })}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="glass-input-group">
              <label>Optional Comments</label>
              <textarea className="glass-input" value={feedbackData.comment} onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })} rows="2" />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={async () => {
                try {
                  await axios.post("/api/user/feedback", feedbackData);
                  setShowFeedback(false);
                  alert("Thank you for your feedback!");
                } catch (err) {
                  console.error(err);
                  if (err.response?.status === 403) {
                    alert(err.response.data.message || "You can submit at most three feedbacks a week.");
                    setShowFeedback(false);
                  } else {
                    alert("Failed to submit feedback. Please try again.");
                  }
                }
              }}>Submit Feedback</button>
              <button className="btn-primary" style={{ flex: 0.5, background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowFeedback(false)}>Skip</button>
            </div>
          </div>
        </div>
      )}

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