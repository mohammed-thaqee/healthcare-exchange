import { useState, useEffect, useRef } from "react";

const API = "/api";
const post = (url, body, token) =>
  fetch(API + url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  }).then((r) => r.json());
const get = (url, token) =>
  fetch(API + url, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());

const STATUS_COLOR = {
  PENDING:         { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  CONSENT_GRANTED: { bg: "#dcfce7", text: "#166534", dot: "#22c55e" },
  CONSENT_DENIED:  { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
  DATA_SHARED:     { bg: "#ede9fe", text: "#4c1d95", dot: "#8b5cf6" },
};

const STEP_META = [
  { icon: "🏥", label: "Login",        sub: "Authenticate as a hospital" },
  { icon: "📋", label: "Request Data", sub: "Initiate a data request"    },
  { icon: "📧", label: "Send OTP",     sub: "Notify patient for consent" },
  { icon: "🔑", label: "Verify OTP",   sub: "Patient grants or denies"   },
  { icon: "🔐", label: "Transfer",     sub: "Encrypted data exchange"    },
  { icon: "🩺", label: "View Record",  sub: "Doctor decrypts & reads"    },
  { icon: "✅", label: "Complete",     sub: "Audit trail on blockchain"  },
];

const GLOBAL_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%}
body{font-family:'Inter','Segoe UI',system-ui,sans-serif;background:#0a0f1e;color:#e2e8f0;min-height:100vh}
@keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(99,102,241,.5)}70%{box-shadow:0 0 0 10px rgba(99,102,241,0)}100%{box-shadow:0 0 0 0 rgba(99,102,241,0)}}
@keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.fade-in{animation:fadeSlideIn .35s ease both}
.spin{animation:spin 1s linear infinite}
input,select,textarea{font-family:inherit;outline:none;transition:border-color .2s,box-shadow .2s}
input:focus,select:focus,textarea:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,.15)}
button{font-family:inherit;cursor:pointer;transition:all .18s ease}
button:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px)}
button:active:not(:disabled){transform:translateY(0)}
button:disabled{opacity:.5;cursor:not-allowed;transform:none!important}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}
a{color:#818cf8;text-decoration:none}
a:hover{text-decoration:underline}
`;

function GlobalStyle() {
  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = GLOBAL_CSS;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);
  return null;
}

function Card({ children, style, className = "fade-in" }) {
  return (
    <div className={className} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:28, ...style }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8", letterSpacing:".06em", textTransform:"uppercase", marginBottom:6 }}>{children}</div>;
}

function Field({ label, children }) {
  return <div style={{ marginBottom:18 }}><Label>{label}</Label>{children}</div>;
}

function Select({ children, style, ...props }) {
  return (
    <select style={{ width:"100%", padding:"11px 14px", borderRadius:10, background:"#1e293b", border:"1px solid rgba(255,255,255,.12)", color:"#e2e8f0", fontSize:14, ...style }} {...props}>
      {children}
    </select>
  );
}

function Btn({ children, color="#6366f1", style, ...props }) {
  return (
    <button style={{ padding:"11px 22px", borderRadius:10, border:"none", background:color, color:"white", fontWeight:600, fontSize:14, display:"inline-flex", alignItems:"center", gap:8, ...style }} {...props}>
      {children}
    </button>
  );
}

function Spinner() {
  return <span className="spin" style={{ display:"inline-block", width:16, height:16, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"white", borderRadius:"50%" }} />;
}

function Badge({ status }) {
  const c = STATUS_COLOR[status] || { bg:"#1e293b", text:"#94a3b8", dot:"#64748b" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, background:c.bg, color:c.text, fontSize:11, fontWeight:700, letterSpacing:".04em" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot, display:"inline-block" }} />
      {status}
    </span>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:22 }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <h2 style={{ fontSize:18, fontWeight:700, color:"#f1f5f9" }}>{children}</h2>
    </div>
  );
}

function TxRow({ label, hash }) {
  const c = STATUS_COLOR[label] || { dot:"#8b5cf6" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", marginBottom:8 }}>
      <span style={{ width:8, height:8, borderRadius:"50%", background:c.dot, flexShrink:0 }} />
      <span style={{ fontSize:12, fontWeight:700, color:"#94a3b8", minWidth:170 }}>{label}</span>
      {hash.startsWith("0x") ? (
        <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer"
          style={{ fontFamily:"monospace", fontSize:11, color:"#818cf8", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {hash.slice(0,18)}…{hash.slice(-8)} ↗
        </a>
      ) : (
        <span style={{ fontFamily:"monospace", fontSize:11, color:"#475569", flex:1 }}>{hash}</span>
      )}
    </div>
  );
}

function Stepper({ step }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {STEP_META.map((s, i) => {
        const done = i < step, active = i === step, pending = i > step;
        return (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"12px 16px", borderRadius:12,
            background: active ? "rgba(99,102,241,.15)" : "transparent",
            border: active ? "1px solid rgba(99,102,241,.3)" : "1px solid transparent",
            opacity: pending ? .4 : 1, transition:"all .3s ease" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
              fontSize: done ? 14 : 13, fontWeight:700,
              background: done ? "#22c55e" : active ? "#6366f1" : "rgba(255,255,255,.08)",
              color:"white", animation: active ? "pulse-ring 2s infinite" : "none" }}>
              {done ? "✓" : active ? s.icon : i + 1}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight: active ? 700 : 500, color: active ? "#e2e8f0" : "#94a3b8" }}>{s.label}</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{s.sub}</div>
            </div>
          </div>
        );
      })}

      <div style={{ marginTop:24, padding:16, borderRadius:12, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".08em", color:"#475569", textTransform:"uppercase", marginBottom:10 }}>Tech Stack</div>
        {[["⛓","Ethereum Sepolia"],["🍃","MongoDB Atlas"],["🔐","AES-256 + RSA"],["📧","Nodemailer OTP"],["🔑","JWT Auth"]].map(([icon,label]) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
            <span style={{ fontSize:13 }}>{icon}</span>
            <span style={{ fontSize:12, color:"#64748b" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Console({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  if (!logs.length) return null;
  return (
    <div style={{ marginTop:20, borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,.08)" }}>
      <div style={{ background:"#0f172a", padding:"8px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <span style={{ width:10, height:10, borderRadius:"50%", background:"#ef4444" }} />
        <span style={{ width:10, height:10, borderRadius:"50%", background:"#f59e0b" }} />
        <span style={{ width:10, height:10, borderRadius:"50%", background:"#22c55e" }} />
        <span style={{ fontSize:11, color:"#475569", marginLeft:8 }}>system log</span>
      </div>
      <div ref={ref} style={{ background:"#020617", padding:14, maxHeight:220, overflowY:"auto" }}>
        {logs.map((l, i) => (
          <div key={i} style={{ color:l.color, fontSize:12, fontFamily:"monospace", lineHeight:1.7 }}>
            <span style={{ color:"#334155" }}>{l.time} </span>{l.msg}
          </div>
        ))}
        <span style={{ fontFamily:"monospace", fontSize:12, color:"#334155", animation:"blink 1s step-end infinite" }}>█</span>
      </div>
    </div>
  );
}

export default function App() {
  const [token,     setToken]     = useState("");
  const [hospital,  setHospital]  = useState(null);
  const [patientId, setPatientId] = useState("PAT-001");
  const [respHosp,  setRespHosp]  = useState("Hospital B");
  const [dataType,  setDataType]  = useState("LABS");
  const [requestId, setRequestId] = useState("");
  const [nonce,     setNonce]     = useState("");
  const [otp,       setOtp]       = useState("");
  const [pubKey,    setPubKey]    = useState("");
  const [step,      setStep]      = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [logs,      setLogs]      = useState([]);
  const [auditRows, setAuditRows] = useState([]);
  const [txHashes,      setTxHashes]      = useState([]);
  const [encryptedPayload, setEncryptedPayload] = useState(null);
  const [privKey,       setPrivKey]       = useState("");
  const [decryptedRecord, setDecryptedRecord] = useState(null);
  const [decryptError,  setDecryptError]  = useState("");

  const addLog = (msg, type = "info") => {
    const colors = { info:"#64748b", ok:"#4ade80", err:"#f87171", chain:"#818cf8" };
    setLogs(l => [...l, { msg, color:colors[type], time:new Date().toLocaleTimeString() }]);
  };

  const wrap = async (fn) => {
    setLoading(true);
    try { await fn(); } catch (e) { addLog("Unexpected error: " + e.message, "err"); }
    setLoading(false);
  };

  async function login(hospitalId) {
    wrap(async () => {
      const data = await post("/login", { hospitalId, password:"password123" });
      if (data.token) {
        setToken(data.token); setHospital(data.hospital); setStep(1);
        addLog(`Authenticated as ${data.hospital.name}`, "ok");
      } else { addLog("Login failed: " + data.error, "err"); }
    });
  }

  async function requestData() {
    wrap(async () => {
      addLog("POST /request-data …");
      const data = await post("/request-data", { patientId, respondingHospital:respHosp, dataType, timestamp:Date.now() }, token);
      if (data.success) {
        setRequestId(data.requestId);
        setTxHashes(h => [...h, { label:"REQUEST_INITIATED", hash:data.txHash }]);
        setStep(2);
        addLog(`Request created · ID: ${data.requestId}`, "ok");
        addLog(`⛓ TX: ${data.txHash}`, "chain");
        addLog(`OTP will be sent to: ${data.patientEmail}`);
      } else { addLog("Error: " + data.error, "err"); }
    });
  }

  async function sendOtp() {
    wrap(async () => {
      addLog("POST /send-otp …");
      const data = await post("/send-otp", { requestId }, token);
      if (data.success) {
        setNonce(data.nonce); setStep(3);
        addLog(`OTP dispatched to ${data.sentTo}`, "ok");
        addLog(`Expires: ${new Date(data.expiresAt).toLocaleTimeString()}`);
      } else { addLog("Error: " + data.error, "err"); }
    });
  }

  async function verifyOtp(consent) {
    wrap(async () => {
      addLog(`POST /verify-otp (consent=${consent}) …`);
      const data = await post("/verify-otp", { requestId, otp, nonce, consent }, token);
      if (data.success) {
        setTxHashes(h => [...h, { label: data.consent ? "CONSENT_GRANTED" : "CONSENT_DENIED", hash:data.txHash }]);
        addLog(`Status: ${data.status}`, data.consent ? "ok" : "err");
        addLog(`⛓ TX: ${data.txHash}`, "chain");
        if (data.consent) setStep(4); else setStep(5);
      } else { addLog("Error: " + data.error, "err"); }
    });
  }

  async function transferData() {
    wrap(async () => {
      if (!pubKey.trim()) { addLog("RSA public key is required", "err"); return; }
      addLog("POST /transfer-data …");
      const data = await post("/transfer-data", { requestId, hospitalPublicKey:pubKey }, token);
      if (data.success) {
        setTxHashes(h => [...h, { label:"DATA_SHARED", hash:data.txHash }]);
        setEncryptedPayload({
          encryptedData: data.encryptedData,
          encryptedKey:  data.encryptedKey,
          authTag:       data.authTag,
          iv:            data.iv,
        });
        setStep(5);
        addLog("Encrypted payload received — ready for doctor to decrypt", "ok");
        addLog(`⛓ TX: ${data.txHash}`, "chain");
        addLog(`encryptedData preview: ${data.encryptedData.slice(0,48)}…`);
      } else { addLog("Error: " + data.error, "err"); }
    });
  }

  async function fetchAudit() {
    wrap(async () => {
      const data = await get("/audit-logs", token);
      if (data.success) { setAuditRows(data.requests); addLog(`Loaded ${data.total} audit records`, "ok"); }
      else addLog("Error: " + data.error, "err");
    });
  }

  // Decrypt medical record client-side using Web Crypto API + RSA private key
  async function decryptRecord() {
    setDecryptError("");
    setDecryptedRecord(null);
    if (!privKey.trim()) { setDecryptError("Paste the RSA private key first."); return; }
    if (!encryptedPayload) { setDecryptError("No encrypted payload found."); return; }
    try {
      // 1. Import the RSA private key (PKCS#8 PEM)
      const pemBody = privKey.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
      const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
      const rsaKey = await crypto.subtle.importKey(
        "pkcs8", keyBytes.buffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false, ["decrypt"]
      );

      // 2. Decrypt the AES key with RSA-OAEP
      const encKeyBytes = Uint8Array.from(atob(encryptedPayload.encryptedKey), c => c.charCodeAt(0));
      const aesKeyBytes = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, rsaKey, encKeyBytes);

      // 3. Import the AES key
      const aesKey = await crypto.subtle.importKey(
        "raw", aesKeyBytes,
        { name: "AES-GCM" },
        false, ["decrypt"]
      );

      // 4. Decrypt the payload with AES-GCM
      // AES-GCM auth tag is appended: ciphertext + 16-byte tag
      const iv          = Uint8Array.from(atob(encryptedPayload.iv),            c => c.charCodeAt(0));
      const cipherBytes = Uint8Array.from(atob(encryptedPayload.encryptedData), c => c.charCodeAt(0));
      const tagBytes    = Uint8Array.from(atob(encryptedPayload.authTag),        c => c.charCodeAt(0));

      // Concatenate ciphertext + authTag (Web Crypto expects them together)
      const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
      combined.set(cipherBytes);
      combined.set(tagBytes, cipherBytes.length);

      const plainBytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, combined);
      const plainText  = new TextDecoder().decode(plainBytes);
      const record     = JSON.parse(plainText);
      setDecryptedRecord(record);
      addLog("Record decrypted successfully — displaying patient data", "ok");
      setStep(6);
    } catch (err) {
      setDecryptError("Decryption failed: " + err.message + ". Make sure you are using the correct private key.");
      addLog("Decryption error: " + err.message, "err");
    }
  }

  return (
    <>
      <GlobalStyle />
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>

        {/* Navbar */}
        <header style={{ background:"rgba(10,15,30,.95)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(255,255,255,.07)", padding:"0 32px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🏥</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>MediChain Exchange</div>
              <div style={{ fontSize:11, color:"#475569" }}>Consent-driven · Blockchain-audited · End-to-end encrypted</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            {hospital && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:20, background:"rgba(99,102,241,.15)", border:"1px solid rgba(99,102,241,.3)" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e" }} />
                <span style={{ fontSize:13, color:"#a5b4fc", fontWeight:600 }}>{hospital.name}</span>
              </div>
            )}
            {["Sepolia Testnet","MongoDB","JWT"].map(tag => (
              <span key={tag} style={{ padding:"3px 9px", borderRadius:6, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", fontSize:11, color:"#64748b" }}>{tag}</span>
            ))}
          </div>
        </header>

        <div style={{ flex:1, display:"flex" }}>

          {/* Sidebar */}
          <aside style={{ width:280, flexShrink:0, background:"rgba(255,255,255,.02)", borderRight:"1px solid rgba(255,255,255,.07)", padding:24, overflowY:"auto" }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".08em", color:"#334155", textTransform:"uppercase", marginBottom:16 }}>Workflow</div>
            <Stepper step={step} />
          </aside>

          {/* Main */}
          <main style={{ flex:1, padding:32, overflowY:"auto" }}>

            {/* Step 0 — Login */}
            {step === 0 && (
              <Card>
                <SectionTitle icon="🏥">Select Hospital</SectionTitle>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:28, lineHeight:1.6 }}>
                  Choose which hospital you are representing. Both hospitals use the demo password <code style={{ background:"rgba(255,255,255,.08)", padding:"1px 6px", borderRadius:4, fontSize:12 }}>password123</code>.
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  {[
                    { id:"hospital-a", name:"Hospital A", role:"Requesting party", color:"#6366f1", icon:"🏨" },
                    { id:"hospital-b", name:"Hospital B", role:"Data owner",       color:"#0ea5e9", icon:"🏩" },
                  ].map(h => (
                    <button key={h.id} onClick={() => login(h.id)} disabled={loading}
                      style={{ padding:24, borderRadius:14, border:`1px solid ${h.color}44`, background:`${h.color}11`, color:"#e2e8f0", textAlign:"left", cursor:"pointer", transition:"all .2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = `${h.color}22`}
                      onMouseLeave={e => e.currentTarget.style.background = `${h.color}11`}>
                      <div style={{ fontSize:32, marginBottom:12 }}>{h.icon}</div>
                      <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>{h.name}</div>
                      <div style={{ fontSize:12, color:"#64748b" }}>{h.role}</div>
                    </button>
                  ))}
                </div>
                {loading && <div style={{ marginTop:16, display:"flex", gap:10, alignItems:"center", color:"#64748b", fontSize:13 }}><Spinner /> Authenticating…</div>}
              </Card>
            )}

            {/* Step 1 — Request */}
            {step === 1 && (
              <Card>
                <SectionTitle icon="📋">Initiate Data Request</SectionTitle>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:24, lineHeight:1.6 }}>
                  <strong style={{ color:"#a5b4fc" }}>{hospital?.name}</strong> is requesting access to a patient's records held at another hospital. This action will be logged on the Ethereum blockchain immediately.
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  <Field label="Patient ID">
                    <Select value={patientId} onChange={e => setPatientId(e.target.value)}>
                      <option value="PAT-001">PAT-001 — Arjun Mehta</option>
                      <option value="PAT-002">PAT-002 — Priya Sharma</option>
                    </Select>
                  </Field>
                  <Field label="Responding Hospital">
                    <Select value={respHosp} onChange={e => setRespHosp(e.target.value)}>
                      <option>Hospital B</option>
                      <option>Hospital A</option>
                    </Select>
                  </Field>
                  <Field label="Data Type Requested">
                    <Select value={dataType} onChange={e => setDataType(e.target.value)}>
                      <option value="LABS">🧪 Lab Results</option>
                      <option value="IMAGING">🩻 Imaging</option>
                      <option value="PRESCRIPTIONS">💊 Prescriptions</option>
                      <option value="FULL">📁 Full Record</option>
                    </Select>
                  </Field>
                </div>
                <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(99,102,241,.08)", border:"1px solid rgba(99,102,241,.2)", fontSize:13, color:"#94a3b8", marginBottom:20 }}>
                  ⛓ This request will be hashed and logged on <strong style={{ color:"#a5b4fc" }}>Ethereum Sepolia</strong> as <code>REQUEST_INITIATED</code>
                </div>
                <Btn onClick={requestData} disabled={loading} style={{ minWidth:180 }}>
                  {loading ? <><Spinner /> Submitting…</> : "Submit Request →"}
                </Btn>
                <Console logs={logs} />
              </Card>
            )}

            {/* Step 2 — Send OTP */}
            {step === 2 && (
              <Card>
                <SectionTitle icon="📧">Notify Patient for Consent</SectionTitle>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:20, lineHeight:1.6 }}>
                  A one-time password will be emailed to the patient. They must share this code to approve the data release. <strong style={{ color:"#fbbf24" }}>No data is shared without this step.</strong>
                </p>
                <div style={{ padding:"14px 18px", borderRadius:12, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", marginBottom:24 }}>
                  <div style={{ fontSize:11, color:"#475569", marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>Request Summary</div>
                  <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                    {[["Patient",patientId],["From",hospital?.name],["To",respHosp],["Data",dataType]].map(([k,v]) => (
                      <div key={k}><div style={{ fontSize:11, color:"#475569" }}>{k}</div><div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{ marginTop:10, fontSize:11, color:"#475569" }}>Request ID: <code style={{ color:"#818cf8" }}>{requestId}</code></div>
                </div>
                <Btn onClick={sendOtp} disabled={loading} color="#0ea5e9" style={{ minWidth:200 }}>
                  {loading ? <><Spinner /> Sending…</> : "📧 Send OTP to Patient"}
                </Btn>
                <Console logs={logs} />
              </Card>
            )}

            {/* Step 3 — Verify OTP */}
            {step === 3 && (
              <Card>
                <SectionTitle icon="🔑">Patient Consent via OTP</SectionTitle>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:24, lineHeight:1.6 }}>
                  The patient has received a 6-digit OTP by email. Enter it below. The patient's decision is permanently recorded on the blockchain.
                </p>
                <Field label="6-digit OTP from patient's email">
                  <input
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                    maxLength={6} placeholder="· · · · · ·"
                    style={{ width:"100%", padding:"18px", textAlign:"center", fontSize:36, fontWeight:700, letterSpacing:20, borderRadius:12, border:"2px solid rgba(255,255,255,.12)", background:"rgba(255,255,255,.04)", color:"#f1f5f9", fontFamily:"monospace" }}
                  />
                </Field>
                <div style={{ display:"flex", gap:12, marginTop:4 }}>
                  <Btn onClick={() => verifyOtp(true)} disabled={loading || otp.length !== 6} color="#16a34a" style={{ flex:1, justifyContent:"center" }}>
                    {loading ? <><Spinner /> Verifying…</> : "✅ Grant Consent"}
                  </Btn>
                  <Btn onClick={() => verifyOtp(false)} disabled={loading} color="#dc2626" style={{ flex:1, justifyContent:"center" }}>
                    {loading ? <><Spinner /></> : "❌ Deny Consent"}
                  </Btn>
                </div>
                <Console logs={logs} />
              </Card>
            )}

            {/* Step 4 — Transfer */}
            {step === 4 && (
              <Card>
                <SectionTitle icon="🔐">Encrypted Data Transfer</SectionTitle>
                <p style={{ fontSize:14, color:"#64748b", marginBottom:20, lineHeight:1.6 }}>
                  Consent confirmed. Paste <strong style={{ color:"#a5b4fc" }}>Hospital A's RSA public key</strong>. The data will be AES-256 encrypted and the AES key wrapped with RSA-OAEP. Only the private key holder can decrypt.
                </p>
                <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(34,197,94,.08)", border:"1px solid rgba(34,197,94,.2)", fontSize:13, color:"#86efac", marginBottom:20 }}>
                  ✅ CONSENT_GRANTED recorded on-chain. Data transfer is now authorised.
                </div>
                <Field label="RSA Public Key — paste contents of keys/hospital-a-public.pem">
                  <textarea
                    value={pubKey} onChange={e => setPubKey(e.target.value)}
                    placeholder={"-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"}
                    style={{ width:"100%", minHeight:130, padding:"12px 14px", borderRadius:10, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.12)", color:"#94a3b8", fontSize:11, fontFamily:"monospace", resize:"vertical" }}
                  />
                </Field>
                <Btn onClick={transferData} disabled={loading || !pubKey.trim()} color="#7c3aed" style={{ minWidth:220 }}>
                  {loading ? <><Spinner /> Encrypting…</> : "🔐 Transfer Encrypted Data"}
                </Btn>
                <Console logs={logs} />
              </Card>
            )}

            {/* Step 5 — Doctor decrypts record */}
            {step === 5 && (
              <div className="fade-in">
                {/* Encrypted payload preview */}
                <Card style={{ marginBottom:20, borderColor:"rgba(99,102,241,.25)" }}>
                  <SectionTitle icon="🔐">Encrypted Payload Received</SectionTitle>
                  <p style={{ fontSize:14, color:"#64748b", marginBottom:16, lineHeight:1.6 }}>
                    The data has been transferred to <strong style={{ color:"#a5b4fc" }}>{hospital?.name}</strong> in encrypted form.
                    It is <strong style={{ color:"#f87171" }}>completely unreadable</strong> without the RSA private key.
                    Show this to your audience before decrypting.
                  </p>
                  <div style={{ background:"#020617", borderRadius:10, padding:14, fontFamily:"monospace", fontSize:11, color:"#475569", wordBreak:"break-all", maxHeight:80, overflow:"hidden", position:"relative" }}>
                    {encryptedPayload?.encryptedData}
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:32, background:"linear-gradient(transparent,#020617)" }} />
                  </div>
                  <div style={{ marginTop:8, fontSize:11, color:"#334155" }}>↑ This is what travels over the network — AES-256-GCM ciphertext</div>
                </Card>

                {/* Decrypt panel */}
                <Card>
                  <SectionTitle icon="🩺">Doctor's Decryption Panel</SectionTitle>
                  <p style={{ fontSize:14, color:"#64748b", marginBottom:20, lineHeight:1.6 }}>
                    Paste the <strong style={{ color:"#fbbf24" }}>RSA private key</strong> (contents of <code style={{ background:"rgba(255,255,255,.08)", padding:"1px 6px", borderRadius:4, fontSize:11 }}>keys/hospital-a-private.pem</code>).
                    Decryption happens <strong style={{ color:"#4ade80" }}>entirely in your browser</strong> — the private key never leaves this machine.
                  </p>

                  <Field label="RSA Private Key — keys/hospital-a-private.pem">
                    <textarea
                      value={privKey} onChange={e => setPrivKey(e.target.value)}
                      placeholder={`-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----`}
                      style={{ width:"100%", minHeight:120, padding:"12px 14px", borderRadius:10, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.12)", color:"#94a3b8", fontSize:11, fontFamily:"monospace", resize:"vertical" }}
                    />
                  </Field>

                  {decryptError && (
                    <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", color:"#fca5a5", fontSize:13, marginBottom:16 }}>
                      ⚠️ {decryptError}
                    </div>
                  )}

                  <Btn onClick={decryptRecord} disabled={!privKey.trim()} color="#059669" style={{ minWidth:220 }}>
                    🩺 Decrypt &amp; View Medical Record
                  </Btn>
                </Card>
                <Console logs={logs} />
              </div>
            )}

            {/* Step 6 — Decrypted record view */}
            {step === 6 && decryptedRecord && (
              <div className="fade-in">
                {/* Success banner */}
                <div style={{ padding:"20px 28px", borderRadius:16, background:"linear-gradient(135deg,rgba(5,150,105,.15),rgba(99,102,241,.12))", border:"1px solid rgba(5,150,105,.3)", marginBottom:20, display:"flex", alignItems:"center", gap:16 }}>
                  <span style={{ fontSize:36 }}>🩺</span>
                  <div>
                    <div style={{ fontSize:18, fontWeight:800, color:"#f1f5f9" }}>Medical Record Decrypted</div>
                    <div style={{ fontSize:13, color:"#6ee7b7", marginTop:4 }}>
                      Patient ID: <strong>{decryptedRecord.patientId}</strong> · Decrypted locally using RSA private key · Data never left the encrypted channel
                    </div>
                  </div>
                </div>

                {/* Medical record card */}
                {(() => {
                  const d = decryptedRecord.data || {};
                  const sections = [
                    { icon:"🦠", label:"Diagnoses",   color:"#ef4444", items: d.diagnoses },
                    { icon:"💊", label:"Medications",  color:"#8b5cf6", items: d.medications },
                    { icon:"⚠️", label:"Allergies",    color:"#f59e0b", items: d.allergies },
                    { icon:"🩻", label:"Imaging",      color:"#0ea5e9", items: d.imaging },
                  ].filter(s => s.items && s.items.length > 0);

                  return (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                      {sections.map(s => (
                        <Card key={s.label} style={{ padding:20 }} className="">
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                            <span style={{ fontSize:18 }}>{s.icon}</span>
                            <span style={{ fontSize:13, fontWeight:700, color:s.color, textTransform:"uppercase", letterSpacing:".05em" }}>{s.label}</span>
                          </div>
                          {s.items.map((item, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:6 }}>
                              <span style={{ width:6, height:6, borderRadius:"50%", background:s.color, flexShrink:0, marginTop:5 }} />
                              <span style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.5 }}>{item}</span>
                            </div>
                          ))}
                        </Card>
                      ))}

                      {/* Lab results */}
                      {d.labResults && (
                        <Card style={{ padding:20, gridColumn:"1 / -1" }} className="">
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                            <span style={{ fontSize:18 }}>🧪</span>
                            <span style={{ fontSize:13, fontWeight:700, color:"#22c55e", textTransform:"uppercase", letterSpacing:".05em" }}>Lab Results</span>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
                            {Object.entries(d.labResults).filter(([k]) => k !== "reportDate").map(([k, v]) => (
                              <div key={k} style={{ padding:"10px 14px", borderRadius:8, background:"rgba(34,197,94,.07)", border:"1px solid rgba(34,197,94,.15)" }}>
                                <div style={{ fontSize:10, color:"#4ade80", textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>{k}</div>
                                <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>{v}</div>
                              </div>
                            ))}
                          </div>
                          {d.labResults.reportDate && (
                            <div style={{ marginTop:10, fontSize:11, color:"#475569" }}>Report date: {d.labResults.reportDate}</div>
                          )}
                        </Card>
                      )}
                    </div>
                  );
                })()}

                {/* Blockchain trail */}
                {txHashes.length > 0 && (
                  <Card style={{ marginBottom:20 }}>
                    <SectionTitle icon="⛓">On-chain Audit Trail</SectionTitle>
                    {txHashes.map((t, i) => <TxRow key={i} {...t} />)}
                    <div style={{ marginTop:10, fontSize:12, color:"#475569" }}>Every step is publicly verifiable on Sepolia Etherscan ↗</div>
                  </Card>
                )}

                <div style={{ display:"flex", gap:12 }}>
                  <Btn onClick={fetchAudit} disabled={loading} color="#0ea5e9">
                    {loading ? <><Spinner /></> : "📋 Full Audit History"}
                  </Btn>
                  <Btn color="#334155" onClick={() => { setStep(1); setRequestId(""); setOtp(""); setNonce(""); setPubKey(""); setPrivKey(""); setTxHashes([]); setAuditRows([]); setLogs([]); setDecryptedRecord(null); setEncryptedPayload(null); }}>
                    ↩ New Request
                  </Btn>
                </div>

                {auditRows.length > 0 && (
                  <Card style={{ marginTop:20 }}>
                    <SectionTitle icon="📋">Request History</SectionTitle>
                    {auditRows.map(r => (
                      <div key={r.id} style={{ padding:"14px 16px", borderRadius:10, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                          <code style={{ fontSize:11, color:"#475569" }}>{r.id}</code>
                          <Badge status={r.status} />
                        </div>
                        <div style={{ display:"flex", gap:16, fontSize:13, flexWrap:"wrap" }}>
                          <span><span style={{ color:"#475569" }}>From </span><strong>{r.requestingHospital}</strong></span>
                          <span style={{ color:"#334155" }}>→</span>
                          <span><span style={{ color:"#475569" }}>To </span><strong>{r.respondingHospital}</strong></span>
                          <span style={{ color:"#6366f1", fontWeight:600 }}>{r.dataType}</span>
                          <span style={{ color:"#475569" }}>{r.patientId}</span>
                        </div>
                        <div style={{ fontSize:11, color:"#334155", marginTop:6 }}>{new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                  </Card>
                )}
                <Console logs={logs} />
              </div>
            )}

            {/* Inline TX trail on steps 2-4 */}
            {step >= 2 && step < 6 && txHashes.length > 0 && (
              <div style={{ marginTop:20, borderRadius:12, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", padding:"16px 20px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#475569", letterSpacing:".06em", textTransform:"uppercase", marginBottom:12 }}>⛓ On-chain Events So Far</div>
                {txHashes.map((t, i) => <TxRow key={i} {...t} />)}
              </div>
            )}

          </main>
        </div>
      </div>
    </>
  );
}
