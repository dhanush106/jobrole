import { useState, useEffect } from "react";
import axios from "./axios";
import "./admin.css";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';

function Admin() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [analytics, setAnalytics] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [feedback, setFeedback] = useState([]);
    const [status, setStatus] = useState("");
    const [expandedUser, setExpandedUser] = useState(null);

    useEffect(() => {
        fetchAnalytics();
        fetchMetrics();
        fetchFeedback();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get("/api/admin/analytics");
            setAnalytics(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchMetrics = async () => {
        try {
            const res = await axios.get("/api/admin/metrics");
            setMetrics(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchFeedback = async () => {
        try {
            const res = await axios.get("/api/admin/feedback");
            setFeedback(res.data);
        } catch (err) { console.error(err); }
    };

    const handleRetrain = async () => {
        setStatus("retraining");
        try {
            await axios.post("/api/admin/retrain", {});
            setStatus("success");
            alert("Model retrained successfully!");
            fetchMetrics(); // Refresh performance panel
        } catch (err) {
            console.error(err);
            setStatus("error");
            alert(err.response?.data?.message || "Retraining failed");
        }
    };

    // Group feedback by user for the monitoring tab (Phase 8)
    const groupedFeedback = feedback.reduce((acc, f) => {
        const userId = f.userId?._id || "unknown";
        if (!acc[userId]) acc[userId] = {
            name: f.userId?.name || "Anonymous",
            entries: [],
            feedbackCount: 0
        };
        acc[userId].entries.push(f);
        acc[userId].feedbackCount++;
        return acc;
    }, {});

    const pieData = [
        { name: 'Helpful', value: analytics?.helpfulPercentage || 0 },
        { name: 'Not Helpful', value: 100 - (analytics?.helpfulPercentage || 0) }
    ];
    const COLORS = ['#8d4aff', '#ff4d4d'];

    return (
        <div className="admin-container">
            <nav className="admin-nav">
                <h1>Admin Control Terminal</h1>
                <div className="tab-group">
                    <button className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>Analytics</button>
                    <button className={`tab-btn ${activeTab === "monitoring" ? "active" : ""}`} onClick={() => setActiveTab("monitoring")}>User Monitoring</button>
                </div>
                <button className="logout-btn" onClick={() => { localStorage.removeItem("adminToken"); window.location.href = "/login"; }}>Logout</button>
            </nav>

            <div className="admin-layout">
                <div className="main-content">
                    {activeTab === "dashboard" ? (
                        <div className="bento-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
                                <div className="bento-card">
                                    <h3>System Overview</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                                        <div className="stat-box">
                                            <span className="stat-val">{analytics?.totalUsers}</span>
                                            <p>Total Users</p>
                                        </div>
                                        <div className="stat-box">
                                            <span className="stat-val">{analytics?.feedbackCount}</span>
                                            <p>Feedbacks</p>
                                        </div>
                                        <div className="stat-box">
                                            <span className="stat-val">{analytics?.helpfulPercentage}%</span>
                                            <p>Satisfaction</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bento-card">
                                    <h3>Satisfaction Mix</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bento-card">
                                <h3>Usage Metrics: Registered Users</h3>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '20px' }}>Full list of members using the platform (Analytics Grid)</p>
                                <table className="user-table">
                                    <thead style={{ fontSize: '0.8rem', opacity: 0.5 }}>
                                        <tr>
                                            <th>Name</th>
                                            <th>Aspiring Role</th>
                                            <th>Feedbacks</th>
                                            <th>Latest Pred.</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics?.userMonitoringGrid?.map((u) => (
                                            <tr key={u._id || u.email} className="user-row">
                                                <td style={{ fontWeight: '600' }}>{u.name}</td>
                                                <td style={{ color: '#ff8bd1' }}>{u.aspiringRole || "N/A"}</td>
                                                <td>{u.feedbackCount || 0}</td>
                                                <td style={{ fontSize: '0.9rem' }}>{u.latestPrediction || "None"}</td>
                                                <td>
                                                    <span className={`status-tag ${u.feedbackCount > 2 ? 'status-unhappy' : 'status-good'}`}>
                                                        {u.feedbackCount > 2 ? "MONITOR" : "NORMAL"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bento-card">
                                <h3>Retraining eligible data flagged</h3>
                                <div className="retrain-banner">
                                    <div>
                                        <p>Process stored feedback corrections into the main model to improve accuracy.</p>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Trained on: {metrics?.trainedOnDataCount} entries</p>
                                    </div>
                                    <button className="btn-retrain" onClick={handleRetrain} disabled={status === "retraining"}>
                                        {status === "retraining" ? "Processing..." : "Trigger Model Retrain"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bento-card" style={{ padding: '30px' }}>
                            <h3>User-Wise Feedback Monitoring</h3>
                            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '25px' }}>Click on a user name to expand their detailed feedback history (Phase 8)</p>

                            {Object.keys(groupedFeedback).length > 0 ? Object.entries(groupedFeedback).map(([id, user]) => (
                                <div key={id} className="user-group">
                                    <div className="user-header" onClick={() => setExpandedUser(expandedUser === id ? null : id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00f2fe' }}>{user.name[0]}</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user.name}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{user.feedbackCount} Feedbacks</span>
                                            <span style={{ transform: expandedUser === id ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}>▼</span>
                                        </div>
                                    </div>

                                    {expandedUser === id && (
                                        <div className="user-sublist">
                                            {user.entries.map((f) => (
                                                <div key={f._id} className={`feedback-node ${f.rating <= 2 ? 'low-satisfaction' : ''}`}>
                                                    <div className="node-grid">
                                                        <div>
                                                            <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>PREDICTED</p>
                                                            <div style={{ fontWeight: 'bold' }}>{f.predictedRole}</div>
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>UAL / ASPIRING</p>
                                                            <div style={{ fontWeight: 'bold', color: '#ff8bd1' }}>{f.aspiringRole}</div>
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>CONFIDENCE</p>
                                                            <div style={{ fontWeight: 'bold' }}>{f.confidenceScore}%</div>
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>RATING</p>
                                                            <div style={{ fontWeight: 'bold' }}>{f.rating} ⭐</div>
                                                        </div>
                                                    </div>
                                                    {f.comment && (
                                                        <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                                            "{f.comment}"
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.3 }}>No user feedback recorded yet.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Fixed ML Performance Panel */}
                <div className="performance-panel">
                    <div className="panel-card">
                        <h3>Model Performance</h3>
                        <p style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '20px' }}>Version: {metrics?.modelVersion || "1.0.0"}</p>

                        <div className="metric-row">
                            <span>Accuracy</span>
                            <span className="metric-val">{(metrics?.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <div className="metric-row">
                            <span>Precision</span>
                            <span className="metric-val">{(metrics?.precision * 100).toFixed(1)}%</span>
                        </div>
                        <div className="metric-row">
                            <span>Recall</span>
                            <span className="metric-val">{(metrics?.recall * 100).toFixed(1)}%</span>
                        </div>
                        <div className="metric-row">
                            <span>F1 Score</span>
                            <span className="metric-val">{(metrics?.f1Score * 100).toFixed(1)}</span>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <p style={{ fontSize: '0.8rem', marginBottom: '10px' }}>Confidence Distribution</p>
                            <div style={{ display: 'flex', gap: '5px', height: '10px' }}>
                                <div style={{ flex: 6, background: '#00f2fe', borderRadius: '4px' }}></div>
                                <div style={{ flex: 3, background: '#8d4aff', borderRadius: '4px' }}></div>
                                <div style={{ flex: 1, background: '#ff4d4d', borderRadius: '4px' }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', marginTop: '5px', opacity: 0.5 }}>
                                <span>High</span>
                                <span>Med</span>
                                <span>Low</span>
                            </div>
                        </div>
                    </div>

                    <div className="panel-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <h3>Feedback Trend</h3>
                        <ResponsiveContainer width="100%" height={100}>
                            <LineChart data={[
                                { n: 1, v: 40 }, { n: 2, v: 30 }, { n: 3, v: 60 }, { n: 4, v: 55 }, { n: 5, v: 80 }
                            ]}>
                                <Line type="monotone" dataKey="v" stroke="#8d4aff" strokeWidth={3} dot={false} />
                                <Tooltip />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;
