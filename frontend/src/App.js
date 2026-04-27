import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

const API = "resqchain-production.up.railway.app";
const LOCATIONS = ["Warehouse","Zone_A","Zone_B","Zone_C","Zone_D","Hospital","Market"];

function ArcReactor({ size = 120, alert = false }) {
  return (
    <div className="arc-reactor" style={{ width: size, height: size }}>
      <div className={`arc-ring arc-ring-1 ${alert ? "arc-alert" : ""}`}></div>
      <div className={`arc-ring arc-ring-2 ${alert ? "arc-alert" : ""}`}></div>
      <div className={`arc-ring arc-ring-3 ${alert ? "arc-alert" : ""}`}></div>
      <div className={`arc-core ${alert ? "arc-core-alert" : ""}`}>
        <div className="arc-inner"></div>
      </div>
    </div>
  );
}

function HudPanel({ title, children, accent, className = "" }) {
  return (
    <div className={`hud-panel ${accent ? "hud-panel--" + accent : ""} ${className}`}>
      <div className="hud-panel-header">
        <span className="hud-panel-dot"></span>
        <span className="hud-panel-title">{title}</span>
        <div className="hud-panel-line"></div>
        <span className="hud-panel-corner">◢</span>
      </div>
      <div className="hud-panel-body">{children}</div>
    </div>
  );
}

function StatHud({ label, value, unit, accent }) {
  return (
    <div className={`stat-hud ${accent ? "stat-hud--" + accent : ""}`}>
      <div className="stat-hud-ring">
        <svg viewBox="0 0 60 60" className="stat-hud-svg">
          <circle cx="30" cy="30" r="26" className="stat-ring-bg" />
          <circle cx="30" cy="30" r="26" className={`stat-ring-fill ${accent ? "stat-ring-" + accent : ""}`}
            strokeDasharray="163" strokeDashoffset="40" />
        </svg>
        <div className="stat-hud-val">
          <span className="stat-hud-num">{value}</span>
          {unit && <span className="stat-hud-unit">{unit}</span>}
        </div>
      </div>
      <div className="stat-hud-label">{label}</div>
    </div>
  );
}

function ScanLine() {
  return <div className="scan-line"></div>;
}

function BootSequence({ onDone }) {
  const [lines, setLines] = useState([]);
  const bootLines = [
    "JARVIS SYSTEM INITIALIZING...",
    "Loading ResQChain v2.0.7...",
    "Connecting to FastAPI backend...",
    "Google Gemini AI module: ONLINE",
    "Dijkstra routing engine: READY",
    "Disruption sensors: ACTIVE",
    "Priority queue: INITIALIZED",
    "All systems nominal. Welcome.",
  ];
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < bootLines.length) {
        setLines(prev => [...prev, bootLines[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(onDone, 600);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="boot-screen">
      <ArcReactor size={160} />
      <div className="boot-log">
        {lines.map((l, i) => (
          <div key={i} className="boot-line">
            <span className="boot-chevron">&gt;</span> {l}
          </div>
        ))}
        {lines.length < bootLines.length && <div className="boot-cursor">█</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [deliveries, setDeliveries] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [route, setRoute] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [logEntries, setLogEntries] = useState([]);

  const [item, setItem] = useState("");
  const [destination, setDestination] = useState("");
  const [requesterType, setRequesterType] = useState("hospital");
  const [routeStart, setRouteStart] = useState("Warehouse");
  const [routeEnd, setRouteEnd] = useState("Hospital");
  const [zone, setZone] = useState("Zone_A");
  const [disruptionType, setDisruptionType] = useState("flood");
  const [severity, setSeverity] = useState(1);
  const [aiZone, setAiZone] = useState("Zone_B");
  const [aiWeather, setAiWeather] = useState("heavy rain");
  const [aiTraffic, setAiTraffic] = useState("high");

  const addLog = (msg, type = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogEntries(prev => [{msg, type, time}, ...prev].slice(0, 20));
  };

  useEffect(() => {
    fetchDeliveries();
    fetchDisruptions();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await axios.get(`${API}/delivery/all`);
      setDeliveries(res.data.deliveries);
    } catch (e) {}
  };

  const fetchDisruptions = async () => {
    try {
      const res = await axios.get(`${API}/disruption/active`);
      setDisruptions(res.data.disruptions);
    } catch (e) {}
  };

  const createDelivery = async () => {
    if (!item || !destination) return toast.warning("INCOMPLETE INPUT — Fill all fields");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/delivery/request`, { item, destination, requester_type: requesterType });
      toast.success(`DELIVERY LOGGED — ${res.data.delivery.priority.label}`);
      addLog(`New delivery: ${item} → ${destination}`, "success");
      setItem(""); setDestination("");
      fetchDeliveries();
    } catch (e) { toast.error("SYSTEM ERROR — Delivery failed"); }
    setLoading(false);
  };

  const findRoute = async () => {
    setScanActive(true);
    setLoading(true);
    try {
      const res = await axios.get(`${API}/route/find?start=${routeStart}&end=${routeEnd}`);
      setRoute(res.data);
      toast.success("ROUTE CALCULATED — Path optimal");
      addLog(`Route: ${routeStart} → ${routeEnd} (cost: ${res.data.total_cost})`, "info");
    } catch (e) { toast.error("ROUTING ERROR"); }
    setTimeout(() => setScanActive(false), 2000);
    setLoading(false);
  };

  const reportDisruption = async () => {
    try {
      await axios.post(`${API}/disruption/report`, { zone, type: disruptionType, severity: parseInt(severity) });
      toast.warning(`ALERT — Disruption logged in ${zone}`);
      addLog(`Disruption: ${disruptionType} in ${zone} (sev ${severity})`, "danger");
      fetchDisruptions();
    } catch (e) { toast.error("ALERT SYSTEM ERROR"); }
  };

  const resolveDisruption = async (id, z) => {
    try {
      await axios.delete(`${API}/disruption/resolve/${id}`);
      toast.success("RESOLVED — Zone cleared");
      addLog(`Disruption resolved in ${z}`, "success");
      fetchDisruptions();
    } catch (e) { toast.error("RESOLVE FAILED"); }
  };

  const runAI = async () => {
    setLoading(true);
    setAiResult(null);
    addLog(`Gemini AI analyzing ${aiZone}...`, "ai");
    try {
      const res = await axios.get(`${API}/ai/predict-disruption?zone=${aiZone}&weather=${aiWeather}&traffic=${aiTraffic}`);
      setAiResult(res.data);
      toast.success("ANALYSIS COMPLETE — Gemini responded");
      addLog(`AI result: ${res.data.ai_analysis?.risk_level || "N/A"} risk in ${aiZone}`, "ai");
    } catch (e) { toast.error("GEMINI OFFLINE — Check API key"); }
    setLoading(false);
  };

  const tabs = [
    { id: "dashboard", label: "Overview", icon: "⬡" },
    { id: "delivery", label: "Deliveries", icon: "◈" },
    { id: "routing", label: "Routing", icon: "⟁" },
    { id: "disruptions", label: "Disruptions", icon: "⚠" },
    { id: "ai", label: "Gemini AI", icon: "✦" },
  ];

  const highPriority = deliveries.filter(d => d.priority.level === 1).length;
  const isAlert = disruptions.length > 0;

  if (!booted) return <BootSequence onDone={() => setBooted(true)} />;

  return (
    <div className="jarvis-app">
      <ToastContainer position="top-right" theme="dark" toastClassName="jarvis-toast" />
      <ScanLine />

      {/* TOP HUD BAR */}
      <header className="jarvis-header">
        <div className="header-left">
          <img src="/resqchain-logo.jpeg" alt="ResQChain Logo" style={{width:"56px",height:"56px",borderRadius:"10px",objectFit:"cover",border:"1px solid rgba(0,212,255,0.3)",boxShadow:"0 0 12px rgba(0,212,255,0.2)"}} />
          <div className="header-title-block">
            <h1 className="header-title">RESQCHAIN</h1>
            <p className="header-sub">EMERGENCY LOGISTICS INTELLIGENCE SYSTEM</p>
          </div>
        </div>
        <div className="header-center">
          {tabs.map(t => (
            <button key={t.id}
              className={`nav-tab ${activeTab === t.id ? "nav-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}>
              <span className="nav-tab-icon">{t.icon}</span>
              <span className="nav-tab-label">{t.label}</span>
              {t.id === "disruptions" && disruptions.length > 0 &&
                <span className="nav-tab-badge">{disruptions.length}</span>}
            </button>
          ))}
        </div>
        <div className="header-right">
          <div className={`system-status ${isAlert ? "status-alert" : "status-ok"}`}>
            <div className="status-pulse"></div>
            <span>{isAlert ? `${disruptions.length} ALERT${disruptions.length > 1 ? "S" : ""}` : "ALL CLEAR"}</span>
          </div>
          <div className="header-time">{clock}</div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="jarvis-body">

        {/* LEFT SIDEBAR */}
        <aside className="jarvis-sidebar">
          <ArcReactor size={100} alert={isAlert} />
          <div className="sidebar-stats">
            <StatHud label="DELIVERIES" value={deliveries.length} accent="" />
            <StatHud label="ALERTS" value={disruptions.length} accent={isAlert ? "danger" : ""} />
            <StatHud label="PRIORITY" value={highPriority} accent={highPriority > 0 ? "warning" : ""} />
          </div>
          <div className="sidebar-log">
            <div className="log-title">SYSTEM LOG</div>
            {logEntries.length === 0 && <div className="log-empty">No events yet</div>}
            {logEntries.map((e, i) => (
              <div key={i} className={`log-entry log-${e.type}`}>
                <span className="log-time">{e.time}</span>
                <span className="log-msg">{e.msg}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN PANEL */}
        <main className="jarvis-main">

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="dashboard-grid">
              <HudPanel title="SYSTEM STATUS" className="panel-wide">
                <div className="status-grid">
                  <div className="status-item">
                    <span className="status-dot-green"></span>
                    <span>FastAPI Backend</span>
                    <span className="status-val">ONLINE</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot-green"></span>
                    <span>Dijkstra Engine</span>
                    <span className="status-val">READY</span>
                  </div>
                  <div className="status-item">
                    <span className={`status-dot-${isAlert ? "red" : "green"}`}></span>
                    <span>Zone Sensors</span>
                    <span className="status-val">{isAlert ? "ALERT" : "CLEAR"}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot-blue"></span>
                    <span>Gemini AI</span>
                    <span className="status-val">STANDBY</span>
                  </div>
                </div>
              </HudPanel>

              <HudPanel title="RECENT DELIVERIES">
                {deliveries.length === 0
                  ? <p className="hud-empty">NO ACTIVE DELIVERIES</p>
                  : deliveries.slice(0, 6).map(d => (
                    <div key={d.id} className="hud-list-row">
                      <span className={`pr-badge pr-${d.priority.level}`}>{d.priority.label}</span>
                      <div className="hud-list-info">
                        <span className="hud-list-main">{d.item}</span>
                        <span className="hud-list-sub">→ {d.destination}</span>
                      </div>
                      <span className="hud-list-status">{d.status}</span>
                    </div>
                  ))}
              </HudPanel>

              <HudPanel title="ACTIVE DISRUPTIONS" accent={isAlert ? "danger" : ""}>
                {disruptions.length === 0
                  ? <div className="all-clear-hud">
                      <div className="clear-ring">✓</div>
                      <p>ALL ZONES CLEAR</p>
                    </div>
                  : disruptions.map(d => (
                    <div key={d.id} className="hud-list-row">
                      <span className={`sev-badge sev-${d.severity}`}>{d.severity_label}</span>
                      <div className="hud-list-info">
                        <span className="hud-list-main">{d.zone}</span>
                        <span className="hud-list-sub">{d.type} · {d.reported_at}</span>
                      </div>
                    </div>
                  ))}
              </HudPanel>

              <HudPanel title="CITY ZONE MAP">
                <div className="mini-map">
                  {LOCATIONS.map(loc => {
                    const disrupted = disruptions.some(d => d.zone === loc);
                    return (
                      <div key={loc} className={`mini-node ${disrupted ? "mini-node--alert" : ""}`}>
                        <div className="mini-dot"></div>
                        <span>{loc.replace("_", " ")}</span>
                        {disrupted && <span className="mini-alert-badge">!</span>}
                      </div>
                    );
                  })}
                </div>
              </HudPanel>
            </div>
          )}

          {/* DELIVERIES */}
          {activeTab === "delivery" && (
            <div className="two-panel">
              <HudPanel title="NEW DELIVERY REQUEST">
                <div className="hud-form">
                  <div className="hud-field">
                    <label className="hud-label">ITEM DESIGNATION</label>
                    <input className="hud-input" placeholder="e.g. Oxygen Cylinder" value={item} onChange={e => setItem(e.target.value)} />
                  </div>
                  <div className="hud-field">
                    <label className="hud-label">TARGET DESTINATION</label>
                    <input className="hud-input" placeholder="e.g. City Hospital" value={destination} onChange={e => setDestination(e.target.value)} />
                  </div>
                  <div className="hud-field">
                    <label className="hud-label">REQUESTER CLASSIFICATION</label>
                    <select className="hud-input" value={requesterType} onChange={e => setRequesterType(e.target.value)}>
                      <option value="hospital">HOSPITAL — Priority Alpha</option>
                      <option value="grocery">GROCERY — Priority Beta</option>
                      <option value="general">GENERAL — Priority Gamma</option>
                    </select>
                  </div>
                  <button className="hud-btn hud-btn--primary" onClick={createDelivery} disabled={loading}>
                    <span className="btn-icon">◈</span> DISPATCH DELIVERY
                  </button>
                </div>
              </HudPanel>
              <HudPanel title="DELIVERY MANIFEST">
                {deliveries.length === 0
                  ? <p className="hud-empty">NO DELIVERIES LOGGED</p>
                  : deliveries.map(d => (
                    <div key={d.id} className="delivery-hud-card">
                      <div className="dhc-top">
                        <span className={`pr-badge pr-${d.priority.level}`}>{d.priority.label}</span>
                        <span className="dhc-id">#{String(d.id).padStart(4, "0")}</span>
                        <span className="dhc-status">{d.status}</span>
                      </div>
                      <div className="dhc-item">{d.item}</div>
                      <div className="dhc-dest">TARGET: {d.destination}</div>
                      <div className="dhc-time">{d.created_at}</div>
                    </div>
                  ))}
              </HudPanel>
            </div>
          )}

          {/* ROUTING */}
          {activeTab === "routing" && (
            <div className="two-panel">
              <HudPanel title="ROUTE OPTIMIZER — DIJKSTRA ENGINE">
                <div className="hud-form">
                  <div className="hud-field">
                    <label className="hud-label">ORIGIN NODE</label>
                    <select className="hud-input" value={routeStart} onChange={e => setRouteStart(e.target.value)}>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="hud-field">
                    <label className="hud-label">DESTINATION NODE</label>
                    <select className="hud-input" value={routeEnd} onChange={e => setRouteEnd(e.target.value)}>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <button className="hud-btn hud-btn--primary" onClick={findRoute} disabled={loading}>
                    <span className="btn-icon">⟁</span> {loading ? "CALCULATING..." : "COMPUTE OPTIMAL ROUTE"}
                  </button>
                </div>
                {route && (
                  <div className="route-hud">
                    <div className="route-hud-label">OPTIMAL PATH COMPUTED</div>
                    <div className="route-path-hud">
                      {route.optimal_path.map((stop, i) => (
                        <React.Fragment key={i}>
                          <div className="route-node-hud">{stop.replace("_", " ")}</div>
                          {i < route.optimal_path.length - 1 &&
                            <div className="route-arrow-hud">▶</div>}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="route-cost-hud">
                      RISK-ADJUSTED COST: <span className="route-cost-val">{route.total_cost}</span>
                    </div>
                  </div>
                )}
              </HudPanel>

              <HudPanel title="TACTICAL ZONE MAP" className={scanActive ? "panel-scanning" : ""}>
                <div className="tac-map">
                  <div className="tac-map-grid"></div>
                  {LOCATIONS.map(loc => {
                    const onRoute = route?.optimal_path.includes(loc);
                    const disrupted = disruptions.some(d => d.zone === loc);
                    return (
                      <div key={loc} className={`tac-node ${onRoute ? "tac-node--route" : ""} ${disrupted ? "tac-node--alert" : ""}`}>
                        <div className="tac-dot"></div>
                        <span className="tac-label">{loc.replace("_", " ")}</span>
                        {disrupted && <div className="tac-alert-ring"></div>}
                      </div>
                    );
                  })}
                  {scanActive && <div className="tac-scan-beam"></div>}
                </div>
                <div className="tac-legend">
                  <span className="tac-legend-item tac-lg-route">▶ ON ROUTE</span>
                  <span className="tac-legend-item tac-lg-alert">▶ DISRUPTED</span>
                  <span className="tac-legend-item tac-lg-clear">▶ CLEAR</span>
                </div>
              </HudPanel>
            </div>
          )}

          {/* DISRUPTIONS */}
          {activeTab === "disruptions" && (
            <div className="two-panel">
              <HudPanel title="REPORT ZONE DISRUPTION" accent="danger">
                <div className="hud-form">
                  <div className="hud-field">
                    <label className="hud-label">AFFECTED ZONE</label>
                    <select className="hud-input" value={zone} onChange={e => setZone(e.target.value)}>
                      {["Zone_A","Zone_B","Zone_C","Zone_D"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="hud-field">
                    <label className="hud-label">DISRUPTION TYPE</label>
                    <select className="hud-input" value={disruptionType} onChange={e => setDisruptionType(e.target.value)}>
                      <option value="flood">FLOOD — Natural Disaster</option>
                      <option value="traffic">TRAFFIC — Road Congestion</option>
                      <option value="blockage">BLOCKAGE — Road Closed</option>
                    </select>
                  </div>
                  <div className="hud-field">
                    <label className="hud-label">SEVERITY LEVEL</label>
                    <select className="hud-input" value={severity} onChange={e => setSeverity(e.target.value)}>
                      <option value={1}>LEVEL 1 — Low</option>
                      <option value={2}>LEVEL 2 — Medium</option>
                      <option value={3}>LEVEL 3 — Critical</option>
                    </select>
                  </div>
                  <button className="hud-btn hud-btn--danger" onClick={reportDisruption}>
                    <span className="btn-icon">⚠</span> BROADCAST ALERT
                  </button>
                </div>
              </HudPanel>

              <HudPanel title="ACTIVE THREAT MATRIX" accent={isAlert ? "danger" : ""}>
                {disruptions.length === 0
                  ? <div className="all-clear-hud">
                      <div className="clear-ring">✓</div>
                      <p>ALL ZONES NOMINAL</p>
                    </div>
                  : disruptions.map(d => (
                    <div key={d.id} className="threat-card">
                      <div className="threat-top">
                        <span className={`sev-badge sev-${d.severity}`}>{d.severity_label}</span>
                        <span className="threat-id">THREAT-{String(d.id).padStart(3,"0")}</span>
                        <button className="resolve-hud-btn" onClick={() => resolveDisruption(d.id, d.zone)}>
                          RESOLVE
                        </button>
                      </div>
                      <div className="threat-zone">{d.zone}</div>
                      <div className="threat-details">{d.type.toUpperCase()} · {d.reported_at}</div>
                      <div className="threat-bar">
                        <div className="threat-bar-fill" style={{width: `${d.severity * 33}%`}}></div>
                      </div>
                    </div>
                  ))}
              </HudPanel>
            </div>
          )}

          {/* AI */}
          {activeTab === "ai" && (
            <div className="ai-layout">
              <HudPanel title="GEMINI AI — DISRUPTION PREDICTOR" accent="ai" className="ai-input-panel">
                <div className="ai-reactor-row">
                  <ArcReactor size={80} />
                  <div className="ai-intro">
                    <div className="ai-intro-title">GOOGLE GEMINI 2.0</div>
                    <div className="ai-intro-sub">Neural disruption analysis engine. Feed zone parameters to receive AI-generated risk assessment and tactical recommendations.</div>
                  </div>
                </div>
                <div className="hud-form" style={{marginTop: "16px"}}>
                  <div className="hud-field">
                    <label className="hud-label">TARGET ZONE</label>
                    <select className="hud-input" value={aiZone} onChange={e => setAiZone(e.target.value)}>
                      {["Zone_A","Zone_B","Zone_C","Zone_D"].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="hud-field">
                    <label className="hud-label">WEATHER CONDITION</label>
                    <input className="hud-input" value={aiWeather} onChange={e => setAiWeather(e.target.value)} placeholder="e.g. heavy rain" />
                  </div>
                  <div className="hud-field">
                    <label className="hud-label">TRAFFIC LEVEL</label>
                    <select className="hud-input" value={aiTraffic} onChange={e => setAiTraffic(e.target.value)}>
                      <option value="low">LOW — Minimal congestion</option>
                      <option value="moderate">MODERATE — Normal flow</option>
                      <option value="high">HIGH — Heavy congestion</option>
                      <option value="critical">CRITICAL — Gridlock</option>
                    </select>
                  </div>
                  <button className="hud-btn hud-btn--ai" onClick={runAI} disabled={loading}>
                    <span className="btn-icon">✦</span>
                    {loading ? "GEMINI PROCESSING..." : "INITIATE AI ANALYSIS"}
                  </button>
                </div>
              </HudPanel>

              <HudPanel title="AI THREAT ASSESSMENT" accent="ai" className="ai-output-panel">
                {!aiResult ? (
                  <div className="ai-waiting">
                    <ArcReactor size={70} />
                    <p className="ai-waiting-text">AWAITING ANALYSIS INPUT</p>
                    <p className="ai-waiting-sub">Configure parameters and initiate scan</p>
                  </div>
                ) : aiResult.error ? (
                  <div className="ai-error-hud">
                    <div className="ai-error-title">GEMINI OFFLINE</div>
                    <div className="ai-error-msg">{aiResult.error.slice(0, 120)}...</div>
                    <div className="ai-error-hint">Check API quota or key validity</div>
                  </div>
                ) : (
                  <div className="ai-result-hud">
                    <div className="ai-result-zone">
                      ZONE: {aiResult.zone} · WEATHER: {aiResult.weather} · TRAFFIC: {aiResult.traffic}
                    </div>
                    {aiResult.ai_analysis?.risk_level && (
                      <div className="ai-risk-hud">
                        <div className="ai-risk-reactor">
                          <ArcReactor size={60} alert={aiResult.ai_analysis.risk_level !== "Low"} />
                        </div>
                        <div>
                          <div className="ai-risk-label">RISK ASSESSMENT</div>
                          <div className="ai-risk-value">{aiResult.ai_analysis.risk_level}</div>
                        </div>
                      </div>
                    )}
                    {aiResult.ai_analysis?.prediction && (
                      <div className="ai-block">
                        <div className="ai-block-title">PREDICTION</div>
                        <div className="ai-block-text">{aiResult.ai_analysis.prediction}</div>
                      </div>
                    )}
                    {aiResult.ai_analysis?.recommendation && (
                      <div className="ai-block ai-block--green">
                        <div className="ai-block-title">RECOMMENDATION</div>
                        <div className="ai-block-text">{aiResult.ai_analysis.recommendation}</div>
                      </div>
                    )}
                  </div>
                )}
              </HudPanel>
            </div>
          )}

        </main>
      </div>

      {/* BOTTOM HUD BAR */}
      <footer className="jarvis-footer">
        <span className="footer-item">RESQCHAIN · EMERGENCY LOGISTICS AI</span>
        <span className="footer-sep">|</span>
        <span className="footer-item">DELIVERIES: {deliveries.length}</span>
        <span className="footer-sep">|</span>
        <span className={`footer-item ${isAlert ? "footer-alert" : "footer-ok"}`}>
          ZONES: {isAlert ? `${disruptions.length} DISRUPTED` : "ALL CLEAR"}
        </span>
        <span className="footer-sep">|</span>
        <span className="footer-item">GEMINI AI: INTEGRATED</span>
        <span className="footer-sep">|</span>
        <span className="footer-item footer-right">BUILD WITH AI · GOOGLE FOR DEVELOPERS 2026</span>
      </footer>
    </div>
  );
}