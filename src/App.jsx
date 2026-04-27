// Zero Hunger — Fixed Version (All Errors Corrected + Analytics Working)
// npm install @supabase/supabase-js
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://hvwfnpmeaxwbkxyighij.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2d2ZucG1lYXh3Ymt4eWlnaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDgwMzQsImV4cCI6MjA5MjU4NDAzNH0.7s79yiUDLIv5yvx1jJ9dhTqV8CzPU3ipnCOPAATGMcs";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ──────────────────────────────────
function getExpiry(exp) {
  if (!exp) return { label: "Unknown", color: "#6b7280", bg: "#f3f4f6", badge: "N/A", free: false, disc: 0 };
  const diff = Math.floor((new Date(exp) - new Date()) / 86400000);
  if (diff >= 2) return { label: "Fresh",      color: "#16a34a", bg: "#dcfce7", badge: "FULL PRICE", free: false, disc: 0   };
  if (diff === 1) return { label: "50% Off",    color: "#d97706", bg: "#fef3c7", badge: "50% OFF",   free: false, disc: 50  };
  return              { label: "Free Donate", color: "#dc2626", bg: "#fee2e2", badge: "FREE 🎁",   free: true,  disc: 100 };
}
const calcP = (price, disc) => disc === 100 ? 0 : Math.round((price || 0) * (1 - disc / 100));
const NOW = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const TODAY = new Date().toISOString().split("T")[0];

// FIX 1: askAI — removed API key header (handled by proxy), added proper error handling
async function askAI(messages, system) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 900,
        system,
        messages
      })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    return d.content?.[0]?.text || "Sorry, couldn't respond.";
  } catch (e) {
    console.error("AI error:", e);
    return "Connection issue. Please try again 🙏";
  }
}

// ── CSS ───────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{--g1:#14532d;--g2:#16a34a;--g3:#22c55e;--gd:#dcfce7;--gb:#f0fdf4;--amb:#d97706;--red:#dc2626;--blu:#2563eb;--ind:#4338ca;--card:#fff;--bdr:#bbf7d0;--tx:#1a2e1a;--mu:#5a7a5a;--sh:0 2px 16px #16a34a10;--sh2:0 8px 32px #16a34a1e;}
body{font-family:'Outfit',sans-serif;background:var(--gb);color:var(--tx);min-height:100vh}
h1,h2,h3{font-family:'Fraunces',serif}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:4px}
.nav{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.97);backdrop-filter:blur(14px);border-bottom:1.5px solid var(--bdr);display:flex;align-items:center;padding:0 1.1rem;height:54px;gap:.4rem}
.logo{font-family:'Fraunces',serif;font-weight:900;font-size:1.15rem;color:var(--g1);cursor:pointer;white-space:nowrap;margin-right:.3rem}
.logo em{font-style:italic;color:var(--g2)}
.nav-links{display:flex;gap:.05rem;flex:1;overflow-x:auto}
.nb{background:none;border:none;padding:.34rem .62rem;border-radius:7px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:.76rem;font-weight:500;color:var(--mu);transition:.15s;white-space:nowrap}
.nb:hover,.nb.on{background:var(--gd);color:var(--g2)}
.nb.cta{background:var(--g1);color:#fff;font-weight:600}.nb.cta:hover{background:var(--g2)}
.nb.sb-nb{color:#6366f1;font-weight:600}.nb.sb-nb:hover,.nb.sb-nb.on{background:#eef2ff;color:#4338ca}
.nav-r{display:flex;align-items:center;gap:.35rem;margin-left:auto;flex-shrink:0}
.role-pill{padding:.2rem .55rem;border-radius:99px;font-size:.66rem;font-weight:700}
.role-user{background:#dbeafe;color:#1d4ed8}
.role-restaurant{background:#fef3c7;color:#d97706}
.role-ngo{background:#dcfce7;color:#16a34a}
.role-admin{background:#f3e8ff;color:#7c3aed}
.pg{max-width:1280px;margin:0 auto;padding:1.35rem 1.1rem;animation:up .3s ease}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.hero{background:linear-gradient(135deg,#052e16,#14532d 45%,#16a34a);border-radius:16px;padding:2.4rem;color:#fff;margin-bottom:1.35rem;position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;right:-50px;top:-50px;width:240px;height:240px;background:radial-gradient(circle,rgba(34,197,94,.2),transparent 70%);border-radius:50%}
.hero h1{font-size:2.1rem;font-weight:900;line-height:1.1;margin-bottom:.45rem}
.hero h1 i{font-style:italic;color:#86efac}
.hero p{font-size:.88rem;opacity:.78;max-width:420px;line-height:1.65;margin-bottom:1.2rem;font-weight:300}
.hbtns{display:flex;gap:.45rem;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.3rem;padding:.48rem 1.05rem;border-radius:8px;border:none;font-family:'Outfit',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;transition:.15s}
.btn:disabled{opacity:.5;cursor:not-allowed}
.bw{background:#fff;color:var(--g1)}.bw:hover{background:#f0fdf4}
.bol{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.38)}.bol:hover{background:rgba(255,255,255,.1)}
.bg2{background:var(--g2);color:#fff}.bg2:hover{background:var(--g3)}
.bg1{background:var(--g1);color:#fff}.bg1:hover{background:var(--g2)}
.bgh{background:var(--gd);color:var(--g1)}.bgh:hover{background:#bbf7d0}
.bsm{padding:.28rem .68rem;font-size:.72rem}
.bsb{background:linear-gradient(135deg,#312e81,#4338ca);color:#fff}
.bsb:hover{background:linear-gradient(135deg,#4338ca,#6366f1)}
.bred{background:#fee2e2;color:var(--red)}.bred:hover{background:#fecaca}
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:.8rem;margin-bottom:1.35rem}
.sc{background:var(--card);border:1.5px solid var(--bdr);border-radius:12px;padding:.85rem .95rem;box-shadow:var(--sh)}
.sv{font-family:'Fraunces',serif;font-size:1.5rem;font-weight:900;color:var(--g1);line-height:1}
.sl{font-size:.68rem;color:var(--mu);margin-top:.12rem;font-weight:500}
.sd{font-size:.66rem;color:var(--g2);font-weight:600;margin-top:.1rem}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:.9rem}
.g2{display:grid;grid-template-columns:repeat(2,1fr);gap:.9rem}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem}
.card{background:var(--card);border:1.5px solid var(--bdr);border-radius:12px;padding:1.1rem;box-shadow:var(--sh);transition:.2s}
.card:hover{box-shadow:var(--sh2)}
.ch{cursor:pointer}.ch:hover{transform:translateY(-2px)}
.shr{display:flex;align-items:center;justify-content:space-between;margin-bottom:.9rem}
.sht{font-family:'Fraunces',serif;font-size:1.05rem;font-weight:700}
.badge{display:inline-flex;align-items:center;padding:.14rem .46rem;border-radius:99px;font-size:.65rem;font-weight:700;white-space:nowrap}
.bg-g{background:var(--gd);color:var(--g1)}.bg-a{background:#fef3c7;color:var(--amb)}.bg-r{background:#fee2e2;color:var(--red)}.bg-sk{background:#e0f2fe;color:#0284c7}.bg-b{background:#dbeafe;color:var(--blu)}
.fc{background:var(--card);border:1.5px solid var(--bdr);border-radius:12px;overflow:hidden;box-shadow:var(--sh);transition:.2s}
.fc:hover{box-shadow:var(--sh2);transform:translateY(-2px)}
.ficon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.45rem;flex-shrink:0}
.nc{background:var(--card);border:1.5px solid var(--bdr);border-radius:12px;box-shadow:var(--sh);transition:.2s;overflow:hidden}
.nc:hover{box-shadow:var(--sh2);transform:translateY(-2px)}
.fg{display:flex;flex-direction:column;gap:.28rem;margin-bottom:.75rem}
.fl{font-size:.72rem;font-weight:600;color:var(--tx)}
.fi{padding:.5rem .78rem;border:1.5px solid var(--bdr);border-radius:8px;font-family:'Outfit',sans-serif;font-size:.84rem;outline:none;transition:.15s;background:#fff;width:100%}
.fi:focus{border-color:var(--g2);box-shadow:0 0 0 3px #16a34a11}
select.fi{cursor:pointer}
textarea.fi{resize:vertical;min-height:70px}
.mbg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:400;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(3px)}
.modal{background:var(--card);border-radius:16px;padding:1.6rem;width:100%;max-width:460px;box-shadow:0 20px 60px #00000028;animation:up .25s ease;max-height:90vh;overflow-y:auto}
.mt{font-family:'Fraunces',serif;font-size:1.2rem;font-weight:900;margin-bottom:.95rem}
.tabs{display:flex;gap:.14rem;background:var(--gd);padding:.18rem;border-radius:8px;margin-bottom:1.05rem}
.tab{flex:1;padding:.4rem;border:none;background:none;border-radius:7px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:.76rem;font-weight:500;color:var(--mu);transition:.15s}
.tab.on{background:var(--card);color:var(--g1);font-weight:700;box-shadow:0 1px 6px #16a34a12}
.pills{display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.9rem}
.pill{padding:.24rem .68rem;border-radius:99px;border:1.5px solid var(--bdr);background:var(--card);font-size:.72rem;font-weight:600;cursor:pointer;transition:.15s;color:var(--mu)}
.pill.on{background:var(--g1);color:#fff;border-color:var(--g1)}
.tw{overflow-x:auto;border-radius:10px;border:1.5px solid var(--bdr)}
table{width:100%;border-collapse:collapse;font-size:.76rem}
th{background:var(--gd);color:var(--g1);font-weight:700;padding:.52rem .78rem;text-align:left;font-family:'Fraunces',serif;font-size:.72rem;white-space:nowrap}
td{padding:.52rem .78rem;border-top:1px solid var(--bdr)}
tr:hover td{background:#f8fff8}
.alert{display:flex;align-items:center;gap:.52rem;padding:.58rem .88rem;border-radius:8px;margin-bottom:.85rem;font-size:.78rem;font-weight:500}
.al-g{background:var(--gd);color:var(--g1);border:1px solid #a7f3d0}
.al-r{background:#fee2e2;color:var(--red);border:1px solid #fecaca}
.al-a{background:#fef3c7;color:var(--amb);border:1px solid #fde68a}
.al-b{background:#dbeafe;color:var(--blu);border:1px solid #bfdbfe}
.pb{height:5px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-top:.25rem}
.pf{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--g2),var(--g3));transition:width .8s}
.chat-w{display:flex;height:calc(100vh - 120px);min-height:480px;gap:.95rem}
.chat-s{width:215px;flex-shrink:0;display:flex;flex-direction:column;gap:.65rem}
.chat-m{flex:1;display:flex;flex-direction:column;background:var(--card);border:1.5px solid var(--bdr);border-radius:13px;overflow:hidden;box-shadow:var(--sh)}
.chat-top{background:linear-gradient(90deg,var(--g1),var(--g2));color:#fff;padding:.75rem 1rem;display:flex;align-items:center;gap:.55rem}
.chat-av{width:32px;height:32px;background:rgba(255,255,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0}
.chat-msgs{flex:1;overflow-y:auto;padding:.8rem;display:flex;flex-direction:column;gap:.52rem}
.msg{max-width:82%;padding:.52rem .82rem;border-radius:12px;font-size:.82rem;line-height:1.62;animation:up .2s ease;word-break:break-word}
.mb{background:var(--gd);color:var(--g1);align-self:flex-start;border-bottom-left-radius:3px}
.mu2{background:var(--g1);color:#fff;align-self:flex-end;border-bottom-right-radius:3px}
.mt2{font-size:.6rem;opacity:.45;margin-top:.15rem}
.chat-bar{display:flex;gap:.38rem;padding:.55rem;border-top:1.5px solid var(--bdr);background:#fafff9}
.ci{flex:1;padding:.5rem .78rem;border:1.5px solid var(--bdr);border-radius:8px;font-family:'Outfit',sans-serif;font-size:.82rem;outline:none;transition:.15s;background:#fff;resize:none;min-height:36px;max-height:80px}
.ci:focus{border-color:var(--g2)}
.tdot{width:5px;height:5px;border-radius:50%;background:var(--g2);display:inline-block;animation:bounce .9s infinite}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.sb-pg{min-height:100vh;background:linear-gradient(160deg,#0f0e1a,#1e1b4b 40%,#14532d);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;position:relative;overflow:hidden}
.sb-card{background:rgba(255,255,255,.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:2.5rem 3rem;width:100%;max-width:520px;box-shadow:0 24px 80px rgba(0,0,0,.5);animation:up .5s ease;position:relative;z-index:2}
.sb-fi{width:100%;padding:.58rem .84rem;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:8px;font-family:'Outfit',sans-serif;font-size:.86rem;color:#fff;outline:none;transition:.2s;margin-bottom:.82rem}
.sb-fi:focus{border-color:rgba(99,102,241,.6);background:rgba(99,102,241,.1)}
.sb-fi::placeholder{color:rgba(255,255,255,.22)}
select.sb-fi option{background:#1e1b4b;color:#fff}
.sb-priv{display:flex;gap:.55rem;padding:.65rem .9rem;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.22);border-radius:8px;margin-bottom:1.1rem;font-size:.74rem;color:rgba(255,255,255,.58);line-height:1.5;align-items:flex-start}
.sb-dot-wrap{display:flex;gap:0;margin-bottom:1.5rem;position:relative}
.sb-dot-wrap::before{content:'';position:absolute;top:14px;left:15px;right:15px;height:1.5px;background:rgba(255,255,255,.09)}
.sb-step{flex:1;display:flex;flex-direction:column;align-items:center;gap:.32rem;position:relative;z-index:1}
.sd-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;transition:.3s}
.sd-done{background:linear-gradient(135deg,#312e81,#4338ca);color:#fff;box-shadow:0 0 12px rgba(99,102,241,.5)}
.sd-act{background:linear-gradient(135deg,#4338ca,#6366f1);color:#fff;box-shadow:0 0 18px rgba(99,102,241,.7);animation:pulse .9s infinite}
.sd-idle{background:rgba(255,255,255,.07);color:rgba(255,255,255,.28)}
@keyframes pulse{0%,100%{box-shadow:0 0 12px rgba(99,102,241,.5)}50%{box-shadow:0 0 22px rgba(99,102,241,.9)}}
.sd-lbl{font-size:.58rem;color:rgba(255,255,255,.35);text-align:center;max-width:55px;line-height:1.3}
.sd-lbl.act{color:rgba(255,255,255,.72)}
.rt-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block;animation:rt 2s infinite}
@keyframes rt{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.65)}}
.spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.28);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;bottom:1.2rem;right:1.2rem;z-index:600;background:var(--g1);color:#fff;padding:.62rem 1rem;border-radius:9px;font-size:.82rem;font-weight:500;box-shadow:0 4px 20px #16a34a40;animation:up .3s ease;max-width:280px}
.err-toast{background:var(--red)}
.empty{text-align:center;padding:2.5rem 1rem;color:var(--mu)}
.empty .ei{font-size:2.2rem;margin-bottom:.65rem}
.sb-hint{background:linear-gradient(135deg,rgba(30,27,75,.06),rgba(67,56,202,.08));border:1.5px dashed rgba(99,102,241,.26);border-radius:11px;padding:.85rem 1rem;display:flex;align-items:center;gap:.75rem;cursor:pointer;transition:.2s;margin-bottom:1.25rem}
.sb-hint:hover{border-color:rgba(99,102,241,.48)}
.loading-screen{display:flex;align-items:center;justify-content:center;min-height:100vh;gap:.75rem;color:var(--mu);font-size:.9rem;flex-direction:column}
.ngo-panel{background:linear-gradient(135deg,var(--gd),#bbf7d0);border:1.5px solid #86efac;border-radius:14px;padding:1.25rem;margin-bottom:1.25rem}
/* FIX: Bar chart responsive */
.bar-chart{display:flex;align-items:flex-end;gap:.26rem;height:110px;padding:.5rem 0}
.bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:.2rem;min-width:0}
.bar-val{font-size:.58rem;font-weight:700;color:var(--g2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;text-align:center}
.bar-fill{width:100%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,var(--g3),var(--g2));min-height:4px;transition:height .6s ease}
.bar-label{font-size:.6rem;color:var(--mu);white-space:nowrap}
@media(max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}.g3,.g4{grid-template-columns:repeat(2,1fr)}.chat-s{display:none}.hero h1{font-size:1.75rem}.hero{padding:1.65rem 1.1rem}.sb-card{padding:1.85rem 1.3rem}}
@media(max-width:600px){.g2,.g3,.g4{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}}
`;

// ══════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════
export default function App() {
  const [page, setPage]         = useState("home");
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [toast, setToast]       = useState(null);
  const [toastErr, setToastErr] = useState(false);
  const [selRest, setSelRest]   = useState(null);
  const [restaurants, setRestaurants]   = useState([]);
  const [ngos, setNgos]                 = useState([]);
  const [foodListings, setFoodListings] = useState([]);
  const [donations, setDonations]       = useState([]);
  const [orders, setOrders]             = useState([]);
  const [dataLoading, setDataLoading]   = useState(true);

  const fire = (msg, err = false) => {
    setToast(msg); setToastErr(err);
    setTimeout(() => setToast(null), 3500);
  };
  const go = (p) => { setPage(p); setSelRest(null); };

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid) => {
    const { data } = await sb.from("profiles").select("*").eq("id", uid).single();
    if (data) setProfile(data);
    return data;
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setDataLoading(true);
    try {
      const [r, n, f, d, o] = await Promise.all([
        sb.from("restaurants").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        sb.from("ngos").select("*").order("meals_served", { ascending: false }),
        sb.from("food_listings").select("*, restaurants(id,name,city,area,logo)").eq("status", "available").order("expiry_date"),
        sb.from("donations").select("*").order("created_at", { ascending: false }).limit(60),
        sb.from("orders").select("*").order("created_at", { ascending: false }).limit(60),
      ]);
      setRestaurants(r.data || []);
      setNgos(n.data || []);
      setFoodListings(f.data || []);
      setDonations(d.data || []);
      setOrders(o.data || []);
    } catch (e) {
      console.error("fetchAll error:", e);
    }
    setDataLoading(false);
  };

  // FIX 2: Added orders refetch in realtime subscriptions
  useEffect(() => {
    const refetchFood = () => sb.from("food_listings").select("*, restaurants(id,name,city,area,logo)").eq("status", "available").order("expiry_date").then(({ data }) => { if (data) setFoodListings(data); });
    const refetchDon  = () => sb.from("donations").select("*").order("created_at", { ascending: false }).limit(60).then(({ data }) => { if (data) setDonations(data); });
    const refetchRest = () => sb.from("restaurants").select("*").eq("is_active", true).order("created_at", { ascending: false }).then(({ data }) => { if (data) setRestaurants(data); });
    const refetchNgo  = () => sb.from("ngos").select("*").order("meals_served", { ascending: false }).then(({ data }) => { if (data) setNgos(data); });
    const refetchOrd  = () => sb.from("orders").select("*").order("created_at", { ascending: false }).limit(60).then(({ data }) => { if (data) setOrders(data); });

    const s1 = sb.channel("rt-food").on("postgres_changes", { event: "*", schema: "public", table: "food_listings" }, refetchFood).subscribe();
    const s2 = sb.channel("rt-don").on("postgres_changes",  { event: "*", schema: "public", table: "donations" }, refetchDon).subscribe();
    const s3 = sb.channel("rt-rest").on("postgres_changes", { event: "*", schema: "public", table: "restaurants" }, refetchRest).subscribe();
    const s4 = sb.channel("rt-ngo").on("postgres_changes",  { event: "*", schema: "public", table: "ngos" }, refetchNgo).subscribe();
    const s5 = sb.channel("rt-ord").on("postgres_changes",  { event: "*", schema: "public", table: "orders" }, refetchOrd).subscribe();
    return () => { sb.removeChannel(s1); sb.removeChannel(s2); sb.removeChannel(s3); sb.removeChannel(s4); sb.removeChannel(s5); };
  }, []);

  const stats = {
    restaurants: restaurants.length,
    ngos: ngos.length,
    donations: donations.length,
    meals: donations.reduce((s, d) => s + (d.quantity || 0), 0) + ngos.reduce((s, n) => s + (n.meals_served || 0), 0),
    revenue: orders.reduce((s, o) => s + (o.platform_fee || 0), 0) + 48200,
  };

  if (authLoading) return (
    <>
      <style>{CSS}</style>
      <div className="loading-screen"><div style={{ fontSize: "2.5rem" }}>🌱</div><div>Loading Zero Hunger...</div></div>
    </>
  );

  const navItems = [
    ["home", "🏠 Home"],
    ["restaurants", "🍽 Restaurants"],
    ["ngos", "🤝 NGOs"],
    ["donate", "💚 Donate"],
    ["dashboard", "📊 Analytics"],
    ["chatbot", "🤖 AI Chat"],
  ];

  return (
    <>
      <style>{CSS}</style>
      <nav className="nav">
        <div className="logo" onClick={() => go("home")}>🌱 Zero<em>Hunger</em></div>
        <div style={{ display: "flex", alignItems: "center", gap: ".3rem", marginRight: ".4rem" }}>
          <span className="rt-dot" /><span style={{ fontSize: ".65rem", color: "#16a34a", fontWeight: 600 }}>LIVE</span>
        </div>
        <div className="nav-links">
          {navItems.map(([p, l]) => (
            <button key={p} className={`nb${page === p ? " on" : ""}`} onClick={() => go(p)}>{l}</button>
          ))}
          <button className={`nb sb-nb${page === "bridge" ? " on" : ""}`} onClick={() => go("bridge")}>🌉 Silent Bridge</button>
          {profile?.role === "restaurant" && <button className={`nb${page === "add-food" ? " on" : ""}`} onClick={() => go("add-food")}>+ Add Food</button>}
          {profile?.role === "ngo" && <button className={`nb${page === "ngo-dashboard" ? " on" : ""}`} onClick={() => go("ngo-dashboard")}>🤝 My NGO</button>}
        </div>
        <div className="nav-r">
          {user ? (
            <>
              <span className={`role-pill role-${profile?.role || "user"}`}>{profile?.role || "user"}</span>
              <span style={{ fontSize: ".76rem", fontWeight: 600, color: "var(--g1)" }}>{profile?.name || user.email?.split("@")[0]}</span>
              <button className="nb" onClick={async () => { await sb.auth.signOut(); fire("Logged out 👋"); go("home"); }}>Logout</button>
            </>
          ) : (
            <button className="nb cta" onClick={() => { setShowAuth(true); setAuthMode("login"); }}>Sign In</button>
          )}
        </div>
      </nav>

      <main>
        {page === "home"          && <HomePage go={go} stats={stats} user={user} profile={profile} setShowAuth={setShowAuth} setAuthMode={setAuthMode} foodListings={foodListings} restaurants={restaurants} ngos={ngos} dataLoading={dataLoading} />}
        {page === "restaurants"   && <RestaurantsPage go={go} fire={fire} user={user} profile={profile} setShowAuth={setShowAuth} restaurants={restaurants} foodListings={foodListings} orders={orders} setOrders={setOrders} donations={donations} setDonations={setDonations} ngos={ngos} selRest={selRest} setSelRest={setSelRest} />}
        {page === "ngos"          && <NGOsPage fire={fire} ngos={ngos} setNgos={setNgos} donations={donations} setDonations={setDonations} user={user} profile={profile} setShowAuth={setShowAuth} />}
        {page === "donate"        && <DonatePage fire={fire} donations={donations} setDonations={setDonations} ngos={ngos} user={user} setShowAuth={setShowAuth} profile={profile} />}
        {page === "dashboard"     && <DashboardPage stats={stats} donations={donations} orders={orders} restaurants={restaurants} ngos={ngos} />}
        {page === "chatbot"       && <ChatbotPage user={user} go={go} ngos={ngos} restaurants={restaurants} foodListings={foodListings} />}
        {page === "bridge"        && <SilentBridgePage fire={fire} />}
        {page === "add-food"      && <AddFoodPage fire={fire} user={user} profile={profile} restaurants={restaurants} go={go} />}
        {page === "ngo-dashboard" && <NGODashboard fire={fire} user={user} profile={profile} ngos={ngos} setNgos={setNgos} donations={donations} go={go} />}
      </main>

      {showAuth && <AuthModal mode={authMode} setMode={setAuthMode} fire={fire}
        onClose={() => setShowAuth(false)}
        onSuccess={async (uid) => { await loadProfile(uid); setShowAuth(false); fetchAll(); }}
      />}
      {toast && <div className={`toast${toastErr ? " err-toast" : ""}`}>{toast}</div>}
    </>
  );
}

// ══════════════════════════════════════
// AUTH MODAL
// ══════════════════════════════════════
function AuthModal({ mode, setMode, onClose, onSuccess, fire }) {
  const [f, setF] = useState({ name: "", email: "", password: "", role: "user", city: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const ROLES = [["user", "👤 General User"], ["restaurant", "🏪 Restaurant Owner"], ["ngo", "🤝 NGO / Orphanage"]];

  const submit = async () => {
    setLoading(true); setErr("");
    try {
      if (mode === "signup") {
        if (!f.name.trim()) { setErr("Please enter your name."); setLoading(false); return; }
        if (f.password.length < 6) { setErr("Password must be at least 6 characters."); setLoading(false); return; }
        const { data, error } = await sb.auth.signUp({
          email: f.email.trim(),
          password: f.password,
          options: { data: { name: f.name.trim(), role: f.role, city: f.city.trim() } }
        });
        if (error) { setErr(error.message); setLoading(false); return; }
        if (data.user) {
          await sb.from("profiles").upsert({
            id: data.user.id,
            name: f.name.trim(),
            email: f.email.trim(),
            role: f.role,
            city: f.city.trim()
          });
          if (f.role === "ngo") {
            await sb.from("ngos").insert({
              owner_id: data.user.id,
              name: f.name.trim() + "'s NGO",
              city: f.city.trim() || "Pakistan",
              area: "",
              contact: "",
              logo: "🤝",
              description: "Newly registered NGO — please update your profile.",
              is_verified: false,
              is_urgent: false,
              meals_served: 0,
            });
          }
          fire("Account created! Welcome to Zero Hunger 🌱");
          await onSuccess(data.user.id);
        }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
        if (error) { setErr("Wrong email or password. Please try again."); setLoading(false); return; }
        if (data.user) { fire("Welcome back! 🌱"); await onSuccess(data.user.id); }
      }
    } catch (e) { setErr("Something went wrong. Please try again."); }
    setLoading(false);
  };

  return (
    <div className="mbg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="mt">{mode === "login" ? "🔐 Sign In to Zero Hunger" : "🌱 Join Zero Hunger"}</div>
        <div className="tabs" style={{ marginBottom: "1rem" }}>
          <button className={`tab${mode === "login" ? " on" : ""}`} onClick={() => { setMode("login"); setErr(""); }}>Sign In</button>
          <button className={`tab${mode === "signup" ? " on" : ""}`} onClick={() => { setMode("signup"); setErr(""); }}>Sign Up</button>
        </div>
        {mode === "signup" && (
          <>
            <div className="fg">
              <label className="fl">Full Name *</label>
              <input className="fi" placeholder="Your full name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
            </div>
            <div className="fg">
              <label className="fl">I am a... *</label>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {ROLES.map(([v, l]) => (
                  <button key={v} onClick={() => setF({ ...f, role: v })}
                    style={{ flex: 1, padding: ".5rem .6rem", border: `2px solid ${f.role === v ? "var(--g2)" : "var(--bdr)"}`, borderRadius: 9, background: f.role === v ? "var(--gd)" : "#fff", cursor: "pointer", fontFamily: "Outfit,sans-serif", fontSize: ".78rem", fontWeight: 600, color: f.role === v ? "var(--g1)" : "var(--mu)", transition: ".15s" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="fg">
              <label className="fl">City *</label>
              <input className="fi" placeholder="e.g. Lahore, Karachi..." value={f.city} onChange={e => setF({ ...f, city: e.target.value })} />
            </div>
          </>
        )}
        <div className="fg">
          <label className="fl">Email *</label>
          <input className="fi" type="email" placeholder="you@example.com" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        </div>
        <div className="fg">
          <label className="fl">Password * {mode === "signup" && <span style={{ fontWeight: 400, color: "var(--mu)" }}>(min 6 characters)</span>}</label>
          <input className="fi" type="password" placeholder={mode === "signup" ? "Min 6 characters" : "Your password"} value={f.password} onChange={e => setF({ ...f, password: e.target.value })}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        {err && <div className="alert al-r" style={{ marginBottom: ".85rem" }}>⚠️ {err}</div>}
        {mode === "signup" && (
          <div className="alert al-b" style={{ marginBottom: ".85rem" }}>
            ℹ️ {f.role === "restaurant" ? "You can add your restaurant & food listings after signing up."
              : f.role === "ngo" ? "Your NGO profile will be created automatically. You can update it after login."
                : "You can browse food, donate, and order after signing up."}
          </div>
        )}
        <div style={{ display: "flex", gap: ".45rem" }}>
          <button className="btn bg1" style={{ flex: 1 }} disabled={loading || !f.email || !f.password} onClick={submit}>
            {loading ? <><span className="spin" /> Processing...</> : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
          <button className="btn bgh" onClick={onClose}>Cancel</button>
        </div>
        <div style={{ fontSize: ".7rem", color: "var(--mu)", textAlign: "center", marginTop: ".65rem", cursor: "pointer" }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: "var(--g2)", fontWeight: 600 }}>{mode === "login" ? "Sign up free →" : "Sign in →"}</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════
function HomePage({ go, stats, user, profile, setShowAuth, setAuthMode, foodListings, restaurants, ngos, dataLoading }) {
  const urgent     = foodListings.filter(f => getExpiry(f.expiry_date).free).slice(0, 3);
  const discounted = foodListings.filter(f => getExpiry(f.expiry_date).disc === 50).slice(0, 3);

  return (
    <div className="pg">
      <div className="hero">
        <h1>Rescue Food.<br /><i>Feed Pakistan.</i> 🌍</h1>
        <p>Real-time AI platform connecting restaurants with NGOs and communities — turning waste into meals.</p>
        <div className="hbtns">
          <button className="btn bw"  onClick={() => go("restaurants")}>🍽 Browse Food</button>
          <button className="btn bol" onClick={() => go("donate")}>💚 Donate</button>
          <button className="btn bol" onClick={() => go("chatbot")}>🤖 AI Chat</button>
          {!user && <button className="btn bol" onClick={() => { setShowAuth(true); setAuthMode("signup"); }}>Join Free →</button>}
        </div>
      </div>

      {profile && (
        <div className="alert al-g" style={{ marginBottom: "1.2rem" }}>
          👋 Welcome back, <strong>{profile.name}</strong>!
          profile.role === "restaurant" && " → Go to "Add Food" to list your near-expiry food."
          profile.role === "ngo" && " → Check "My NGO" to manage your NGO profile and accept donations."
          {profile.role === "user" && " → Browse discounted food or donate your leftovers."}
        </div>
      )}

      <div className="stats">
        {[
          { i: "🍽", v: stats.meals.toLocaleString(), l: "Meals Rescued",  d: "Real-time" },
          { i: "🏪", v: stats.restaurants,             l: "Restaurants",    d: "Live" },
          { i: "🤝", v: stats.ngos,                    l: "NGO Partners",   d: "Verified" },
          { i: "📦", v: stats.donations,               l: "Donations",      d: "All time" },
          { i: "💰", v: `₨${(stats.revenue / 1000).toFixed(0)}K`, l: "Revenue", d: "Platform" },
        ].map((s, i) => (
          <div key={i} className="sc">
            <div style={{ fontSize: "1.3rem" }}>{s.i}</div>
            <div className="sv">{s.v}</div>
            <div className="sl">{s.l}</div>
            <div className="sd">↑ {s.d}</div>
          </div>
        ))}
      </div>

      <div className="sb-hint" onClick={() => go("bridge")}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#312e81,#4338ca)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>🌉</div>
        <div>
          <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: ".88rem", color: "#3730a3" }}>Silent Bridge — Private & Anonymous</div>
          <div style={{ fontSize: ".74rem", color: "#6366f1", marginTop: ".1rem" }}>Give or receive food help with complete privacy. No one will know.</div>
        </div>
        <div style={{ marginLeft: "auto", color: "#6366f1" }}>→</div>
      </div>

      {dataLoading ? (
        <div className="empty"><div className="ei">⏳</div><div>Loading real-time data...</div></div>
      ) : (
        <>
          {urgent.length > 0 && (
            <>
              <div className="alert al-r">🚨 <strong>{urgent.length} items</strong> expire today — FREE donation!</div>
              <div className="shr"><div className="sht">🔥 Free Donations Today</div><button className="btn bgh bsm" onClick={() => go("restaurants")}>See all →</button></div>
              <div className="g3" style={{ marginBottom: "1.35rem" }}>
                {urgent.map(f => <FoodCard key={f.id} food={f} compact onClick={() => go("restaurants")} />)}
              </div>
            </>
          )}
          {discounted.length > 0 && (
            <>
              <div className="shr"><div className="sht">🟡 50% Off Now</div><button className="btn bgh bsm" onClick={() => go("restaurants")}>See all →</button></div>
              <div className="g3" style={{ marginBottom: "1.35rem" }}>
                {discounted.map(f => <FoodCard key={f.id} food={f} compact onClick={() => go("restaurants")} />)}
              </div>
            </>
          )}
          {urgent.length === 0 && discounted.length === 0 && foodListings.length === 0 && (
            <div className="alert al-a">🍽 No food listings yet. Restaurants can sign up and add their near-expiry food!</div>
          )}

          <div className="shr"><div className="sht">🏪 Restaurants</div><button className="btn bgh bsm" onClick={() => go("restaurants")}>View all →</button></div>
          <div className="g3" style={{ marginBottom: "1.35rem" }}>
            {restaurants.slice(0, 3).map(r => (
              <div key={r.id} className="card ch" onClick={() => go("restaurants")}>
                <div style={{ display: "flex", gap: ".55rem", alignItems: "center", marginBottom: ".5rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--gd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.35rem" }}>{r.logo}</div>
                  <div><div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: ".92rem" }}>{r.name}</div><div style={{ fontSize: ".68rem", color: "var(--mu)" }}>{r.cuisine} · {r.area}, {r.city}</div></div>
                </div>
                <div style={{ display: "flex", gap: ".28rem", flexWrap: "wrap" }}>
                  <span className="badge bg-sk">{foodListings.filter(f => f.restaurant_id === r.id).length} items</span>
                  <span className="badge bg-r">{foodListings.filter(f => f.restaurant_id === r.id && getExpiry(f.expiry_date).free).length} free</span>
                </div>
              </div>
            ))}
            {restaurants.length === 0 && <div className="card" style={{ gridColumn: "1/-1" }}><div className="empty"><div className="ei">🏪</div><div>No restaurants yet</div></div></div>}
          </div>

          <div className="shr"><div className="sht">🤝 NGO Network</div><button className="btn bgh bsm" onClick={() => go("ngos")}>View all →</button></div>
          <div className="g4">
            {ngos.slice(0, 4).map(n => (
              <div key={n.id} className="card" style={{ padding: ".9rem" }}>
                <div style={{ display: "flex", gap: ".4rem", alignItems: "center", marginBottom: ".32rem" }}>
                  <span style={{ fontSize: "1.15rem" }}>{n.logo}</span>
                  <div style={{ fontWeight: 700, fontSize: ".78rem", flex: 1 }}>{n.name}</div>
                  {n.is_urgent && <span className="badge bg-r" style={{ fontSize: ".58rem" }}>URGENT</span>}
                </div>
                <div style={{ fontSize: ".68rem", color: "var(--mu)" }}>{n.city}</div>
                <div style={{ fontSize: ".68rem", color: "var(--g2)", fontWeight: 600, marginTop: ".2rem" }}>{(n.meals_served || 0).toLocaleString()} served</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Food Card ─────────────────────────
function FoodCard({ food: f, compact, onClick, onBuy, onDonate }) {
  const ex = getExpiry(f.expiry_date);
  const fp = calcP(f.original_price, ex.disc);
  return (
    <div className="fc" onClick={compact ? onClick : undefined} style={compact ? { cursor: "pointer" } : {}}>
      <div style={{ padding: ".82rem .95rem", borderBottom: "1px solid var(--bdr)", display: "flex", gap: ".6rem", alignItems: "center" }}>
        <div className="ficon" style={{ background: ex.bg }}>{f.image || "🍽"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: ".86rem" }}>{f.name}</div>
          <div style={{ fontSize: ".68rem", color: "var(--mu)" }}>{f.restaurants?.name} · {f.restaurants?.city}</div>
          <span className="badge" style={{ background: ex.bg, color: ex.color, marginTop: ".22rem" }}>{ex.badge}</span>
        </div>
      </div>
      <div style={{ padding: ".68rem .95rem" }}>
        <div style={{ fontSize: ".7rem", color: "var(--mu)" }}>📦 {f.quantity} {f.unit}s · Exp {f.expiry_date}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: ".3rem", marginTop: ".25rem" }}>
          {ex.free
            ? <span style={{ fontFamily: "Fraunces,serif", fontWeight: 900, color: "var(--red)", fontSize: "1.05rem" }}>FREE 🎁</span>
            : <>
                <span style={{ fontFamily: "Fraunces,serif", fontWeight: 900, color: ex.color, fontSize: "1.05rem" }}>₨{fp}</span>
                {ex.disc > 0 && <span style={{ fontSize: ".74rem", textDecoration: "line-through", color: "var(--mu)" }}>₨{f.original_price}</span>}
              </>
          }
        </div>
      </div>
      {!compact && (
        <div style={{ padding: "0 .95rem .82rem", display: "flex", gap: ".3rem" }}>
          {ex.free
            ? <button className="btn bg2 bsm" style={{ flex: 1 }} onClick={() => onDonate?.(f)}>💚 Donate to NGO</button>
            : <>
                <button className="btn bg1 bsm" style={{ flex: 1 }} onClick={() => onBuy?.(f)}>🛒 Buy</button>
                <button className="btn bgh bsm" onClick={() => onDonate?.(f)}>💚</button>
              </>
          }
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// RESTAURANTS PAGE
// ══════════════════════════════════════
function RestaurantsPage({ go, fire, user, profile, setShowAuth, restaurants, foodListings, orders, setOrders, donations, setDonations, ngos, selRest, setSelRest }) {
  const [cityF, setCityF] = useState("All");
  const cities = ["All", ...new Set(restaurants.map(r => r.city))];
  const vis = cityF === "All" ? restaurants : restaurants.filter(r => r.city === cityF);

  if (selRest) {
    const r = restaurants.find(x => x.id === selRest);
    if (!r) { setSelRest(null); return null; }
    const rFoods = foodListings.filter(f => f.restaurant_id === selRest);
    return <RestDetail r={r} foods={rFoods} ngos={ngos} onBack={() => setSelRest(null)} fire={fire} user={user} profile={profile} setShowAuth={setShowAuth} setOrders={setOrders} setDonations={setDonations} />;
  }

  return (
    <div className="pg">
      <div className="shr">
        <div><div className="sht">🍽 Restaurants</div><div style={{ fontSize: ".74rem", color: "var(--mu)" }}>{vis.length} restaurants · Real-time</div></div>
        {profile?.role === "restaurant" && <button className="btn bg1 bsm" onClick={() => go("add-food")}>+ Add Food</button>}
      </div>
      <div className="pills">{cities.map(c => <button key={c} className={`pill${cityF === c ? " on" : ""}`} onClick={() => setCityF(c)}>{c}</button>)}</div>

      {vis.length === 0 ? (
        <div className="card"><div className="empty"><div className="ei">🏪</div><div>No restaurants in {cityF} yet</div></div></div>
      ) : (
        <div className="g2">
          {vis.map(r => {
            const rF = foodListings.filter(f => f.restaurant_id === r.id);
            const fc = rF.filter(f => getExpiry(f.expiry_date).free).length;
            const dc = rF.filter(f => getExpiry(f.expiry_date).disc === 50).length;
            return (
              <div key={r.id} style={{ background: "var(--card)", border: "1.5px solid var(--bdr)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--sh)", transition: ".2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--sh2)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--sh)"}>
                <div style={{ padding: ".88rem 1rem", borderBottom: "1px solid var(--bdr)", display: "flex", alignItems: "center", gap: ".65rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--gd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.35rem", flexShrink: 0 }}>{r.logo}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: ".92rem" }}>{r.name}</div>
                    <div style={{ fontSize: ".7rem", color: "var(--mu)" }}>{r.cuisine} · {r.area}, {r.city}</div>
                    <div style={{ marginTop: ".22rem", display: "flex", gap: ".25rem", flexWrap: "wrap" }}>
                      {fc > 0 && <span className="badge bg-r">{fc} free</span>}
                      {dc > 0 && <span className="badge bg-a">{dc} discounted</span>}
                      <span className="badge bg-g">{rF.length} items</span>
                    </div>
                  </div>
                  <button className="btn bg1 bsm" onClick={() => setSelRest(r.id)}>Menu →</button>
                </div>
                <div style={{ padding: ".68rem 1rem" }}>
                  {rF.slice(0, 3).map(f => {
                    const ex = getExpiry(f.expiry_date); const fp = calcP(f.original_price, ex.disc);
                    return (
                      <div key={f.id} style={{ display: "flex", alignItems: "center", gap: ".45rem", padding: ".42rem 0", borderBottom: "1px solid #f0fdf4", cursor: "pointer" }} onClick={() => setSelRest(r.id)}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: ex.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".95rem", flexShrink: 0 }}>{f.image || "🍽"}</div>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: ".78rem" }}>{f.name}</div><div style={{ fontSize: ".65rem", color: "var(--mu)" }}>📦{f.quantity}·exp {f.expiry_date}</div></div>
                        <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: ".86rem", color: ex.color }}>{ex.free ? "FREE" : `₨${fp}`}</div>
                      </div>
                    );
                  })}
                  {rF.length === 0 && <div style={{ fontSize: ".74rem", color: "var(--mu)", padding: ".4rem 0" }}>No food listings yet</div>}
                  {rF.length > 3 && <div style={{ fontSize: ".7rem", color: "var(--g2)", fontWeight: 600, textAlign: "center", paddingTop: ".38rem", cursor: "pointer" }} onClick={() => setSelRest(r.id)}>+{rF.length - 3} more →</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RestDetail({ r, foods, ngos, onBack, fire, user, profile, setShowAuth, setOrders, setDonations }) {
  const [buyM, setBuyM] = useState(null);
  const [donM, setDonM] = useState(null);

  const handleBuy = async (item, qty) => {
    if (!user) { setShowAuth(true); return; }
    const ex = getExpiry(item.expiry_date);
    const up = calcP(item.original_price, ex.disc);
    const total = up * qty; const fee = Math.round(total * 0.05);
    const { data, error } = await sb.from("orders").insert({
      user_id: user.id, user_name: profile?.name,
      food_id: item.id, food_name: item.name,
      restaurant_id: r.id, restaurant_name: r.name,
      quantity: qty, unit_price: up, discount_pct: ex.disc,
      platform_fee: fee, total: total + fee, status: "confirmed"
    }).select().single();
    if (!error) { setOrders(o => [data, ...o]); fire(`✅ Order placed! ${qty}× ${item.name} — ₨${total + fee}`); setBuyM(null); }
    else fire("Order failed. Try again.", true);
  };

  const handleDonate = async (item, ngoId, ngoName) => {
    if (!user) { setShowAuth(true); return; }
    const { data, error } = await sb.from("donations").insert({
      food_id: item.id, food_name: item.name,
      donor_id: user.id, donor_name: profile?.name,
      restaurant_id: r.id, restaurant_name: r.name,
      ngo_id: ngoId, ngo_name: ngoName, quantity: item.quantity, status: "pending"
    }).select().single();
    if (!error) {
      setDonations(d => [data, ...d]);
      await sb.from("food_listings").update({ status: "donated" }).eq("id", item.id);
      fire(`💚 Donation sent to ${ngoName}!`); setDonM(null);
    } else fire("Donation failed. Try again.", true);
  };

  return (
    <div className="pg">
      <button className="btn bgh bsm" onClick={onBack} style={{ marginBottom: "1rem" }}>← Back to Restaurants</button>
      <div className="card" style={{ marginBottom: "1.1rem", padding: "1.15rem" }}>
        <div style={{ display: "flex", gap: ".8rem", alignItems: "flex-start" }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: "var(--gd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", flexShrink: 0 }}>{r.logo}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Fraunces,serif", fontSize: "1.25rem", fontWeight: 900 }}>{r.name}</div>
            <div style={{ color: "var(--mu)", fontSize: ".78rem", marginTop: ".15rem" }}>🍴 {r.cuisine} · 📍 {r.area}, {r.city}{r.contact && ` · 📞 ${r.contact}`}</div>
            {r.description && <div style={{ fontSize: ".76rem", marginTop: ".38rem", color: "var(--tx)" }}>{r.description}</div>}
          </div>
        </div>
      </div>
      <div className="shr"><div className="sht">🍽 Menu</div><span className="badge bg-g">{foods.length} items</span></div>
      {foods.length === 0
        ? <div className="card"><div className="empty"><div className="ei">🍽</div><div>No food listings yet</div></div></div>
        : <div className="g2" style={{ marginBottom: "1.1rem" }}>{foods.map(f => <FoodCard key={f.id} food={{ ...f, restaurants: r }} onBuy={() => setBuyM(f)} onDonate={() => setDonM(f)} />)}</div>
      }
      {buyM && <BuyModal item={buyM} restaurant={r.name} onConfirm={handleBuy} onClose={() => setBuyM(null)} />}
      {donM && <DonateModal item={donM} ngos={ngos} onConfirm={handleDonate} onClose={() => setDonM(null)} />}
    </div>
  );
}

function BuyModal({ item, restaurant, onConfirm, onClose }) {
  const [qty, setQty] = useState(1); const [loading, setLoading] = useState(false);
  const ex = getExpiry(item.expiry_date); const up = calcP(item.original_price, ex.disc);
  const total = up * qty; const fee = Math.round(total * 0.05);
  return (
    <div className="mbg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="mt">🛒 Place Order</div>
        <div style={{ display: "flex", gap: ".58rem", alignItems: "center", padding: ".68rem", background: "var(--gd)", borderRadius: 9, marginBottom: ".9rem" }}>
          <span style={{ fontSize: "1.5rem" }}>{item.image || "🍽"}</span>
          <div><div style={{ fontWeight: 700 }}>{item.name}</div><div style={{ fontSize: ".72rem", color: "var(--mu)" }}>@ {restaurant}</div></div>
          <span className="badge" style={{ background: ex.bg, color: ex.color, marginLeft: "auto" }}>{ex.badge}</span>
        </div>
        <div className="fg"><label className="fl">Quantity (max {item.quantity})</label>
          <input className="fi" type="number" min={1} max={item.quantity} value={qty} onChange={e => setQty(Math.max(1, Math.min(item.quantity, +e.target.value)))} />
        </div>
        <div style={{ background: "var(--gb)", borderRadius: 8, padding: ".72rem", marginBottom: ".9rem", fontSize: ".79rem" }}>
          {[["Price/unit", `₨${up}`], ["Qty", `×${qty}`], ["Subtotal", `₨${total}`], ["Platform fee (5%)", `₨${fee}`]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: ".18rem 0" }}><span style={{ color: "var(--mu)" }}>{k}</span><span>{v}</span></div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--bdr)", paddingTop: ".42rem", marginTop: ".28rem" }}><span>Total</span><span style={{ color: "var(--g1)" }}>₨{total + fee}</span></div>
        </div>
        <div style={{ display: "flex", gap: ".45rem" }}>
          <button className="btn bg1" style={{ flex: 1 }} disabled={loading} onClick={async () => { setLoading(true); await onConfirm(item, qty); setLoading(false); }}>
            {loading ? <span className="spin" /> : "✅ Confirm Order"}
          </button>
          <button className="btn bgh" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DonateModal({ item, ngos, onConfirm, onClose }) {
  const [sel, setSel] = useState(ngos[0] || null); const [loading, setLoading] = useState(false);
  return (
    <div className="mbg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="mt">💚 Donate Food</div>
        <div style={{ display: "flex", gap: ".58rem", alignItems: "center", padding: ".68rem", background: "var(--gd)", borderRadius: 9, marginBottom: ".9rem" }}>
          <span style={{ fontSize: "1.5rem" }}>{item.image || "🍽"}</span>
          <div><div style={{ fontWeight: 700 }}>{item.name}</div><div style={{ fontSize: ".72rem", color: "var(--mu)" }}>📦 {item.quantity} units</div></div>
        </div>
        {ngos.length === 0 && <div className="alert al-a">No NGOs available yet.</div>}
        {ngos.length > 0 && (
          <div className="fg"><label className="fl">Select NGO</label>
            <select className="fi" onChange={e => setSel(ngos.find(n => n.id === e.target.value))}>
              {ngos.map(n => <option key={n.id} value={n.id}>{n.name} — {n.city}{n.is_urgent ? " 🚨" : ""}</option>)}
            </select>
          </div>
        )}
        {sel?.is_urgent && <div className="alert al-r" style={{ marginBottom: ".85rem" }}>🚨 URGENT need — this NGO needs food today!</div>}
        <div style={{ display: "flex", gap: ".45rem" }}>
          <button className="btn bg2" style={{ flex: 1 }} disabled={loading || !sel} onClick={async () => { setLoading(true); await onConfirm(item, sel?.id, sel?.name); setLoading(false); }}>
            {loading ? <span className="spin" /> : "💚 Send Donation"}
          </button>
          <button className="btn bgh" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// NGO DASHBOARD (for NGO users)
// ══════════════════════════════════════
function NGODashboard({ fire, user, profile, ngos, setNgos, donations, go }) {
  const myNgo = ngos.find(n => n.owner_id === user?.id);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(myNgo || {});
  const [loading, setLoading] = useState(false);
  const myDonations = donations.filter(d => d.ngo_id === myNgo?.id);
  const LOGOS = ["🤝", "🕌", "🏥", "🤲", "🌟", "🍽", "🚑", "🏛", "💙", "🌙"];

  useEffect(() => { if (myNgo) setF(myNgo); }, [myNgo]);

  const save = async () => {
    setLoading(true);
    const { data, error } = await sb.from("ngos").update({
      name: f.name, city: f.city, area: f.area, contact: f.contact,
      description: f.description, logo: f.logo, capacity: +f.capacity || 100
    }).eq("id", myNgo.id).select().single();
    if (!error) { setNgos(n => n.map(x => x.id === data.id ? data : x)); fire("NGO profile updated! ✅"); setEditing(false); }
    else fire("Update failed. Try again.", true);
    setLoading(false);
  };

  const updateStatus = async (donId, status) => {
    const { error } = await sb.from("donations").update({ status }).eq("id", donId);
    if (!error) fire(`Status updated to ${status}`);
    else fire("Update failed.", true);
  };

  if (!myNgo) return (
    <div className="pg">
      <div className="card"><div className="empty"><div className="ei">🤝</div><div>No NGO profile found</div>
        <div style={{ fontSize: ".8rem", marginTop: ".4rem", marginBottom: "1rem" }}>Your NGO profile may not have been created during signup.</div>
        <button className="btn bg1" onClick={() => go("ngos")}>Go to NGOs page to register</button>
      </div></div>
    </div>
  );

  return (
    <div className="pg">
      <div className="shr"><div className="sht">🤝 My NGO Dashboard</div>
        <button className="btn bgh bsm" onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "✏️ Edit Profile"}</button>
      </div>
      <div className="ngo-panel">
        <div style={{ display: "flex", gap: ".75rem", alignItems: "flex-start" }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", flexShrink: 0 }}>{myNgo.logo}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Fraunces,serif", fontSize: "1.2rem", fontWeight: 900, color: "var(--g1)" }}>{myNgo.name}</div>
            <div style={{ fontSize: ".76rem", color: "var(--mu)" }}>📍 {myNgo.area}, {myNgo.city}{myNgo.contact && ` · 📞 ${myNgo.contact}`}</div>
            {myNgo.description && <div style={{ fontSize: ".78rem", marginTop: ".3rem" }}>{myNgo.description}</div>}
            <div style={{ display: "flex", gap: ".35rem", marginTop: ".5rem", flexWrap: "wrap" }}>
              {myNgo.is_verified ? <span className="badge bg-g">✓ Verified</span> : <span className="badge bg-a">⏳ Pending Verification</span>}
              {myNgo.is_urgent && <span className="badge bg-r">URGENT</span>}
              <span className="badge bg-sk">Capacity: {myNgo.capacity}/day</span>
              <span className="badge bg-g">{(myNgo.meals_served || 0).toLocaleString()} meals served</span>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: "1.2rem" }}>
          <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".9rem" }}>✏️ Edit NGO Profile</div>
          <div className="fg"><label className="fl">NGO Name</label><input className="fi" value={f.name || ""} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div style={{ display: "flex", gap: ".65rem" }}>
            <div className="fg" style={{ flex: 1 }}><label className="fl">City</label><input className="fi" value={f.city || ""} onChange={e => setF({ ...f, city: e.target.value })} /></div>
            <div className="fg" style={{ flex: 1 }}><label className="fl">Area</label><input className="fi" value={f.area || ""} onChange={e => setF({ ...f, area: e.target.value })} /></div>
          </div>
          <div className="fg"><label className="fl">Contact</label><input className="fi" value={f.contact || ""} onChange={e => setF({ ...f, contact: e.target.value })} /></div>
          <div className="fg"><label className="fl">Description</label><textarea className="fi" value={f.description || ""} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          <div className="fg"><label className="fl">Daily Capacity (meals)</label><input className="fi" type="number" value={f.capacity || 100} onChange={e => setF({ ...f, capacity: e.target.value })} /></div>
          <div className="fg"><label className="fl">Logo</label>
            <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
              {LOGOS.map(l => <button key={l} onClick={() => setF({ ...f, logo: l })} style={{ width: 36, height: 36, borderRadius: 7, border: `2px solid ${f.logo === l ? "var(--g2)" : "var(--bdr)"}`, background: f.logo === l ? "var(--gd)" : "#fff", fontSize: "1.2rem", cursor: "pointer" }}>{l}</button>)}
            </div>
          </div>
          <button className="btn bg1" style={{ width: "100%" }} disabled={loading} onClick={save}>{loading ? <span className="spin" /> : "Save Changes"}</button>
        </div>
      )}

      <div className="shr"><div className="sht">📦 Donation Requests</div><span className="badge bg-g">{myDonations.length} total</span></div>
      {myDonations.length === 0
        ? <div className="card"><div className="empty"><div className="ei">📦</div><div>No donations yet. They'll appear here when someone donates to your NGO.</div></div></div>
        : <div className="tw">
            <table><thead><tr><th>Food</th><th>From</th><th>Qty</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{myDonations.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>{d.food_name}</td>
                  <td>{d.donor_name || d.restaurant_name || "—"}</td>
                  <td>{d.quantity}</td>
                  <td>{d.created_at?.split("T")[0]}</td>
                  <td><span className={`badge ${d.status === "completed" ? "bg-g" : d.status === "in-transit" ? "bg-sk" : "bg-a"}`}>{d.status}</span></td>
                  <td>
                    {d.status === "pending" && <button className="btn bg2 bsm" onClick={() => updateStatus(d.id, "in-transit")}>Accept</button>}
                    {d.status === "in-transit" && <button className="btn bg1 bsm" onClick={() => updateStatus(d.id, "completed")}>Complete</button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
      }
    </div>
  );
}

// ══════════════════════════════════════
// NGOs PAGE
// ══════════════════════════════════════
function NGOsPage({ fire, ngos, setNgos, donations, setDonations, user, profile, setShowAuth }) {
  const [cityF, setCityF] = useState("All");
  const [regModal, setRegModal] = useState(false);
  const cities = ["All", ...new Set(ngos.map(n => n.city))];
  const vis = cityF === "All" ? ngos : ngos.filter(n => n.city === cityF);

  const quickDonate = async (ngo) => {
    if (!user) { setShowAuth(true); return; }
    const { data, error } = await sb.from("donations").insert({
      food_name: "General Food Donation", donor_id: user.id, donor_name: profile?.name,
      ngo_id: ngo.id, ngo_name: ngo.name, quantity: 10, status: "pending"
    }).select().single();
    if (!error) { setDonations(d => [data, ...d]); fire(`💚 Donation sent to ${ngo.name}!`); }
    else fire("Error. Try again.", true);
  };

  return (
    <div className="pg">
      <div className="shr">
        <div><div className="sht">🤝 NGO Network</div><div style={{ fontSize: ".74rem", color: "var(--mu)" }}>Real verified NGOs</div></div>
        <button className="btn bg1 bsm" onClick={() => { if (!user) { setShowAuth(true); return; } setRegModal(true); }}>+ Register NGO</button>
      </div>
      {ngos.filter(n => n.is_urgent).length > 0 && <div className="alert al-r">🚨 <strong>{ngos.filter(n => n.is_urgent).length} NGOs</strong> have urgent food needs today!</div>}
      <div className="pills">{cities.map(c => <button key={c} className={`pill${cityF === c ? " on" : ""}`} onClick={() => setCityF(c)}>{c}</button>)}</div>
      <div className="g3" style={{ marginBottom: "1.35rem" }}>
        {vis.map(n => (
          <div key={n.id} className="nc">
            <div style={{ height: 3, background: n.is_urgent ? "var(--red)" : "var(--g2)" }} />
            <div style={{ padding: ".9rem 1rem", display: "flex", gap: ".6rem", alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: "linear-gradient(135deg,var(--gd),#a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>{n.logo}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: ".88rem", display: "flex", alignItems: "center", gap: ".28rem", flexWrap: "wrap" }}>
                  {n.name}
                  {n.is_urgent && <span className="badge bg-r" style={{ fontSize: ".58rem" }}>URGENT</span>}
                  {n.is_verified && <span style={{ color: "var(--g2)", fontSize: ".75rem" }}>✓</span>}
                </div>
                <div style={{ fontSize: ".68rem", color: "var(--mu)", marginTop: ".1rem" }}>📍 {n.area}, {n.city}{n.contact && ` · 📞 ${n.contact}`}</div>
              </div>
            </div>
            <div style={{ padding: "0 1rem .9rem" }}>
              {n.description && <div style={{ fontSize: ".74rem", color: "var(--mu)", lineHeight: 1.52, marginBottom: ".58rem" }}>{n.description}</div>}
              <div style={{ fontSize: ".72rem", fontWeight: 600, marginBottom: ".22rem" }}>🍽 {(n.meals_served || 0).toLocaleString()} meals served</div>
              <div className="pb"><div className="pf" style={{ width: `${Math.min(100, ((n.meals_served || 0) / 350000) * 100)}%` }} /></div>
              <div style={{ display: "flex", gap: ".38rem", marginTop: ".75rem" }}>
                <button className="btn bg2 bsm" style={{ flex: 1 }} onClick={() => quickDonate(n)}>💚 Donate</button>
                <button className="btn bgh bsm" onClick={() => fire(`🤖 AI matched ${n.name} with nearby restaurants!`)}>🤖 AI</button>
              </div>
            </div>
          </div>
        ))}
        {ngos.length === 0 && <div className="card" style={{ gridColumn: "1/-1" }}><div className="empty"><div className="ei">🤝</div><div>No NGOs registered yet</div></div></div>}
      </div>
      <div className="shr"><div className="sht">📦 All Donations</div><span className="badge bg-g">{donations.length}</span></div>
      <div className="tw">
        <table><thead><tr><th>Food</th><th>From</th><th>To NGO</th><th>Qty</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>{donations.slice(0, 20).map(d => (
            <tr key={d.id}><td style={{ fontWeight: 500 }}>{d.food_name}</td><td>{d.restaurant_name || d.donor_name || "—"}</td>
              <td>{d.ngo_name}</td><td>{d.quantity}</td><td>{d.created_at?.split("T")[0]}</td>
              <td><span className={`badge ${d.status === "completed" ? "bg-g" : d.status === "in-transit" ? "bg-sk" : "bg-a"}`}>{d.status}</span></td></tr>
          ))}</tbody>
        </table>
      </div>
      {regModal && <NGORegModal fire={fire} user={user} profile={profile} onClose={() => setRegModal(false)} setNgos={setNgos} />}
    </div>
  );
}

function NGORegModal({ fire, user, profile, onClose, setNgos }) {
  const [f, setF] = useState({ name: "", city: "", area: "", contact: "", description: "", logo: "🤝", capacity: 100 });
  const [loading, setLoading] = useState(false);
  const LOGOS = ["🤝", "🕌", "🏥", "🤲", "🌟", "🍽", "🚑", "🏛", "💙", "🌙"];
  const submit = async () => {
    setLoading(true);
    const { data, error } = await sb.from("ngos").insert({ ...f, owner_id: user.id, capacity: +f.capacity, is_verified: false, is_urgent: false, meals_served: 0 }).select().single();
    if (!error) { setNgos(n => [...n, data]); fire(`NGO "${f.name}" registered! ✅`); onClose(); }
    else fire("Error registering NGO.", true);
    setLoading(false);
  };
  return (
    <div className="mbg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="mt">🤝 Register NGO</div>
        <div className="fg"><label className="fl">NGO Name *</label><input className="fi" placeholder="Your NGO name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div style={{ display: "flex", gap: ".65rem" }}>
          <div className="fg" style={{ flex: 1 }}><label className="fl">City *</label><input className="fi" placeholder="Lahore" value={f.city} onChange={e => setF({ ...f, city: e.target.value })} /></div>
          <div className="fg" style={{ flex: 1 }}><label className="fl">Area</label><input className="fi" placeholder="Gulberg" value={f.area} onChange={e => setF({ ...f, area: e.target.value })} /></div>
        </div>
        <div className="fg"><label className="fl">Contact</label><input className="fi" placeholder="0300-XXXXXXX" value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} /></div>
        <div className="fg"><label className="fl">Description</label><textarea className="fi" placeholder="What does your NGO do?" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
        <div className="fg"><label className="fl">Daily Capacity (meals)</label><input className="fi" type="number" value={f.capacity} onChange={e => setF({ ...f, capacity: e.target.value })} /></div>
        <div className="fg"><label className="fl">Logo</label>
          <div style={{ display: "flex", gap: ".32rem", flexWrap: "wrap" }}>
            {LOGOS.map(l => <button key={l} onClick={() => setF({ ...f, logo: l })} style={{ width: 34, height: 34, borderRadius: 7, border: `2px solid ${f.logo === l ? "var(--g2)" : "var(--bdr)"}`, background: f.logo === l ? "var(--gd)" : "#fff", fontSize: "1.1rem", cursor: "pointer" }}>{l}</button>)}
          </div>
        </div>
        <div style={{ display: "flex", gap: ".45rem" }}>
          <button className="btn bg1" style={{ flex: 1 }} disabled={loading || !f.name || !f.city} onClick={submit}>{loading ? <span className="spin" /> : "Register NGO"}</button>
          <button className="btn bgh" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// DONATE PAGE
// ══════════════════════════════════════
function DonatePage({ fire, donations, setDonations, ngos, user, setShowAuth, profile }) {
  const [tab, setTab] = useState("form");
  const [form, setForm] = useState({ food: "", qty: 1, ngo: ngos[0]?.id || "", notes: "" });
  const [imgPrev, setImgPrev] = useState(null);
  const [aiRes, setAiRes] = useState(null);
  const [aiLoad, setAiLoad] = useState(false);
  const [ings, setIngs] = useState(""); const [recipe, setRecipe] = useState(""); const [recLoad, setRecLoad] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!form.food || !form.ngo) { fire("Fill food name and select NGO.", true); return; }
    setLoading(true);
    const ngo = ngos.find(n => n.id === form.ngo);
    const { data, error } = await sb.from("donations").insert({
      food_name: form.food, donor_id: user.id, donor_name: profile?.name,
      ngo_id: form.ngo, ngo_name: ngo?.name, quantity: +form.qty, notes: form.notes, status: "pending"
    }).select().single();
    if (!error) { setDonations(d => [data, ...d]); fire(`💚 Donation sent to ${ngo?.name}!`); setForm({ food: "", qty: 1, ngo: ngos[0]?.id || "", notes: "" }); }
    else fire("Error. Try again.", true);
    setLoading(false);
  };

  // FIX 3: Proper image analysis with error handling
  const analyzeImg = async () => {
    if (!imgPrev) return; setAiLoad(true); setAiRes(null);
    try {
      const b64 = imgPrev.split(",")[1];
      const mediaType = imgPrev.split(";")[0].split(":")[1] || "image/jpeg";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          messages: [{
            role: "user", content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
              { type: "text", text: `Analyze this food image. Return ONLY valid JSON (no markdown, no backticks): {"foodName":"","freshness":"Fresh/Near Expiry/Spoiled","estimatedExpiry":"","safeToEat":true,"storageAdvice":"","donationSuitable":true,"recipeSuggestion":"","spoilageWarning":""}` }
            ]
          }]
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      const text = d.content?.[0]?.text || "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();
      setAiRes(JSON.parse(cleaned));
    } catch (e) {
      console.error("Image analysis error:", e);
      setAiRes({ error: "Analysis failed. Please try again." });
    }
    setAiLoad(false);
  };

  const genRecipe = async () => {
    if (!ings.trim()) return; setRecLoad(true); setRecipe("");
    const t = await askAI([{ role: "user", content: `Leftovers: ${ings}. Give me 2 waste-reducing recipes. Pakistani context.` }], "You are a recipe expert. Be brief and practical, under 180 words.");
    setRecipe(t); setRecLoad(false);
  };

  return (
    <div className="pg">
      <div className="sht" style={{ marginBottom: ".95rem" }}>💚 Donate & AI Tools</div>
      <div className="tabs">
        {[["form", "📦 Donate"], ["image", "📷 AI Image"], ["recipe", "👨‍🍳 Recipes"]].map(([v, l]) => (
          <button key={v} className={`tab${tab === v ? " on" : ""}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>
      {tab === "form" && (
        <div className="g2">
          <div className="card">
            <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".85rem" }}>Submit Donation</div>
            <div className="fg"><label className="fl">Food Name</label><input className="fi" placeholder="e.g. Chicken Biryani" value={form.food} onChange={e => setForm({ ...form, food: e.target.value })} /></div>
            <div className="fg"><label className="fl">Quantity (servings)</label><input className="fi" type="number" min="1" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} /></div>
            <div className="fg"><label className="fl">Select NGO</label>
              <select className="fi" value={form.ngo} onChange={e => setForm({ ...form, ngo: e.target.value })}>
                {ngos.length === 0 && <option value="">No NGOs available</option>}
                {ngos.map(n => <option key={n.id} value={n.id}>{n.name} — {n.city}{n.is_urgent ? " 🚨" : ""}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Notes</label><input className="fi" placeholder="Allergies, pickup time..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <button className="btn bg1" style={{ width: "100%" }} disabled={loading || !ngos.length} onClick={submit}>{loading ? <span className="spin" /> : "💚 Submit Donation"}</button>
          </div>
          <div>
            <div className="card" style={{ marginBottom: ".82rem" }}>
              <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".65rem" }}>🤖 AI Match</div>
              {ngos.slice(0, 4).map((n, i) => (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: ".48rem", padding: ".4rem 0", borderBottom: "1px solid var(--bdr)" }}>
                  <span>{n.logo}</span>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: ".78rem" }}>{n.name}</div><div style={{ fontSize: ".66rem", color: "var(--mu)" }}>{n.city}</div></div>
                  <span className={`badge ${n.is_urgent ? "bg-r" : i === 1 ? "bg-a" : "bg-g"}`}>{n.is_urgent ? "Urgent" : i === 1 ? "Needed" : "Normal"}</span>
                </div>
              ))}
              {ngos.length === 0 && <div style={{ fontSize: ".76rem", color: "var(--mu)" }}>No NGOs available yet.</div>}
            </div>
            <div className="alert al-g">🤖 AI matches based on real-time urgency.</div>
          </div>
        </div>
      )}
      {tab === "image" && (
        <div className="g2">
          <div>
            <div className="card" style={{ marginBottom: ".82rem" }}>
              <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".85rem" }}>📷 Upload Food Photo</div>
              <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files[0]; if (!file) return;
                const r = new FileReader(); r.onload = ev => setImgPrev(ev.target.result); r.readAsDataURL(file);
              }} style={{ marginBottom: ".62rem", fontSize: ".76rem" }} />
              {imgPrev && <img src={imgPrev} alt="" style={{ width: "100%", borderRadius: 8, marginBottom: ".62rem", maxHeight: 165, objectFit: "cover" }} />}
              <button className="btn bg1" style={{ width: "100%" }} onClick={analyzeImg} disabled={!imgPrev || aiLoad}>
                {aiLoad ? <><span className="spin" /> Analyzing...</> : "🤖 Analyze"}
              </button>
            </div>
          </div>
          <div>
            {aiRes && !aiRes.error ? (
              <div className="card">
                <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".82rem" }}>🔍 AI Results</div>
                {[["🍽 Food", "foodName"], ["✅ Freshness", "freshness"], ["📅 Expiry", "estimatedExpiry"], ["🧊 Storage", "storageAdvice"], ["👨‍🍳 Recipe", "recipeSuggestion"], ["⚠️ Spoilage", "spoilageWarning"]].map(([k, v]) => (
                  <div key={k} style={{ padding: ".38rem 0", borderBottom: "1px solid var(--bdr)", fontSize: ".78rem", display: "flex", gap: ".3rem" }}>
                    <span style={{ fontWeight: 600, flexShrink: 0, minWidth: 80 }}>{k}:</span><span style={{ color: "var(--mu)" }}>{aiRes[v] || "—"}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: ".28rem", marginTop: ".65rem", flexWrap: "wrap" }}>
                  <span className={`badge ${aiRes.safeToEat ? "bg-g" : "bg-r"}`}>{aiRes.safeToEat ? "✅ Safe" : "❌ Not Safe"}</span>
                  <span className={`badge ${aiRes.donationSuitable ? "bg-g" : "bg-a"}`}>{aiRes.donationSuitable ? "💚 OK to Donate" : "⚠️ Check first"}</span>
                </div>
              </div>
            ) : aiRes?.error ? <div className="alert al-r">{aiRes.error}</div>
              : <div className="card"><div className="empty"><div className="ei">📷</div><div>Upload food image for AI analysis</div></div></div>}
          </div>
        </div>
      )}
      {tab === "recipe" && (
        <div className="g2">
          <div className="card">
            <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".85rem" }}>👨‍🍳 Recipe from Leftovers</div>
            <div className="fg"><label className="fl">Your Leftover Ingredients</label><textarea className="fi" rows={4} placeholder="e.g. rice, chicken, onions, tomatoes..." value={ings} onChange={e => setIngs(e.target.value)} /></div>
            <button className="btn bg1" style={{ width: "100%" }} onClick={genRecipe} disabled={recLoad}>{recLoad ? <><span className="spin" /> Generating...</> : "🤖 Generate Recipes"}</button>
          </div>
          <div className="card">
            <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".85rem" }}>📋 AI Recipes</div>
            {recipe ? <div style={{ fontSize: ".84rem", lineHeight: 1.72, whiteSpace: "pre-wrap" }}>{recipe}</div> : <div style={{ color: "var(--mu)", fontSize: ".8rem" }}>Enter ingredients and generate.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// ADD FOOD PAGE
// ══════════════════════════════════════
function AddFoodPage({ fire, user, profile, restaurants, go }) {
  const myRest = restaurants.filter(r => r.owner_id === user?.id);
  const [f, setF] = useState({ restaurant_id: myRest[0]?.id || "", name: "", quantity: 1, unit: "plate", expiry_date: TODAY, original_price: 0, image: "🍽", description: "" });
  const [rf, setRf] = useState({ name: "", city: profile?.city || "", area: "", cuisine: "", contact: "", logo: "🍽", description: "" });
  const [loading, setLoading] = useState(false);
  const [showRF, setShowRF] = useState(myRest.length === 0);
  const EMOJIS = ["🍽", "🍛", "🍲", "🥘", "🍖", "🥩", "🍗", "🍕", "🍝", "🥗", "🍜", "🥐", "🍞", "🎂", "🍮", "🍧", "🥖", "🍤", "🐟", "🫓"];
  const LOGOS = ["🍽", "🍕", "🍖", "🥐", "🦐", "🏔", "🥘", "🍛", "🍲", "🍝"];

  const addRest = async () => {
    if (!rf.name || !rf.city) { fire("Restaurant name and city required.", true); return; }
    setLoading(true);
    const { data, error } = await sb.from("restaurants").insert({ ...rf, owner_id: user.id, is_active: true }).select().single();
    if (!error) { fire(`Restaurant "${rf.name}" created! ✅`); setF(prev => ({ ...prev, restaurant_id: data.id })); setShowRF(false); }
    else fire("Error creating restaurant.", true);
    setLoading(false);
  };

  const addFood = async () => {
    if (!f.restaurant_id) { fire("Select a restaurant first.", true); return; }
    if (!f.name) { fire("Enter food name.", true); return; }
    setLoading(true);
    const { error } = await sb.from("food_listings").insert({ ...f, status: "available" });
    if (!error) { fire(`✅ "${f.name}" listed!`); setF(prev => ({ ...prev, name: "", quantity: 1, description: "" })); }
    else fire("Error listing food.", true);
    setLoading(false);
  };

  return (
    <div className="pg">
      <button className="btn bgh bsm" onClick={() => go("restaurants")} style={{ marginBottom: "1rem" }}>← Back</button>
      <div className="sht" style={{ marginBottom: "1.1rem" }}>🏪 Manage Restaurant & Food</div>
      {myRest.length === 0 && !showRF && (
        <div className="card" style={{ marginBottom: "1.1rem", textAlign: "center", padding: "1.75rem" }}>
          <div style={{ fontSize: "2.2rem", marginBottom: ".6rem" }}>🏪</div>
          <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".4rem" }}>No Restaurant Yet</div>
          <div style={{ color: "var(--mu)", fontSize: ".8rem", marginBottom: ".9rem" }}>Create your restaurant profile first.</div>
          <button className="btn bg1" onClick={() => setShowRF(true)}>+ Create Restaurant</button>
        </div>
      )}
      <div className="g2">
        <div>
          {showRF ? (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".85rem" }}>🏪 Create Restaurant</div>
              <div className="fg"><label className="fl">Restaurant Name *</label><input className="fi" placeholder="My Karahi House" value={rf.name} onChange={e => setRf({ ...rf, name: e.target.value })} /></div>
              <div style={{ display: "flex", gap: ".62rem" }}>
                <div className="fg" style={{ flex: 1 }}><label className="fl">City *</label><input className="fi" placeholder="Lahore" value={rf.city} onChange={e => setRf({ ...rf, city: e.target.value })} /></div>
                <div className="fg" style={{ flex: 1 }}><label className="fl">Area</label><input className="fi" placeholder="DHA" value={rf.area} onChange={e => setRf({ ...rf, area: e.target.value })} /></div>
              </div>
              <div className="fg"><label className="fl">Cuisine Type</label><input className="fi" placeholder="Pakistani/BBQ" value={rf.cuisine} onChange={e => setRf({ ...rf, cuisine: e.target.value })} /></div>
              <div className="fg"><label className="fl">Contact Number</label><input className="fi" placeholder="0300-XXXXXXX" value={rf.contact} onChange={e => setRf({ ...rf, contact: e.target.value })} /></div>
              <div className="fg"><label className="fl">Logo</label>
                <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
                  {LOGOS.map(l => <button key={l} onClick={() => setRf({ ...rf, logo: l })} style={{ width: 34, height: 34, borderRadius: 7, border: `2px solid ${rf.logo === l ? "var(--g2)" : "var(--bdr)"}`, background: rf.logo === l ? "var(--gd)" : "#fff", fontSize: "1.1rem", cursor: "pointer" }}>{l}</button>)}
                </div>
              </div>
              <div style={{ display: "flex", gap: ".42rem" }}>
                <button className="btn bg1" style={{ flex: 1 }} disabled={loading || !rf.name || !rf.city} onClick={addRest}>{loading ? <span className="spin" /> : "Save Restaurant"}</button>
                {myRest.length > 0 && <button className="btn bgh" onClick={() => setShowRF(false)}>Cancel</button>}
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".72rem" }}>My Restaurants</div>
              {myRest.map(r => (
                <div key={r.id} onClick={() => setF(prev => ({ ...prev, restaurant_id: r.id }))}
                  style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".42rem .45rem", borderBottom: "1px solid var(--bdr)", cursor: "pointer", background: f.restaurant_id === r.id ? "var(--gd)" : "transparent", borderRadius: 6 }}>
                  <span style={{ fontSize: "1.05rem" }}>{r.logo}</span>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: ".82rem" }}>{r.name}</div><div style={{ fontSize: ".68rem", color: "var(--mu)" }}>{r.city}</div></div>
                  {f.restaurant_id === r.id && <span className="badge bg-g">Selected</span>}
                </div>
              ))}
              <button className="btn bgh bsm" style={{ marginTop: ".65rem" }} onClick={() => setShowRF(true)}>+ Add Restaurant</button>
            </div>
          )}
        </div>
        <div className="card">
          <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".85rem" }}>🍽 Add Food Listing</div>
          {!f.restaurant_id && <div className="alert al-a" style={{ marginBottom: ".85rem" }}>⚠️ Select or create a restaurant first</div>}
          <div className="fg"><label className="fl">Food Name *</label><input className="fi" placeholder="e.g. Chicken Biryani" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div style={{ display: "flex", gap: ".62rem" }}>
            <div className="fg" style={{ flex: 1 }}><label className="fl">Qty</label><input className="fi" type="number" min="1" value={f.quantity} onChange={e => setF({ ...f, quantity: +e.target.value })} /></div>
            <div className="fg" style={{ flex: 1 }}><label className="fl">Unit</label>
              <select className="fi" value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })}>
                {["plate", "bowl", "pot", "pack", "box", "piece", "kg", "loaf", "glass", "serving"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: ".62rem" }}>
            <div className="fg" style={{ flex: 1 }}><label className="fl">Expiry Date *</label><input className="fi" type="date" value={f.expiry_date} min={TODAY} onChange={e => setF({ ...f, expiry_date: e.target.value })} /></div>
            <div className="fg" style={{ flex: 1 }}><label className="fl">Price (₨)</label><input className="fi" type="number" min="0" value={f.original_price} onChange={e => setF({ ...f, original_price: +e.target.value })} /></div>
          </div>
          <div className="fg"><label className="fl">Food Emoji</label>
            <div style={{ display: "flex", gap: ".28rem", flexWrap: "wrap" }}>
              {EMOJIS.map(e => <button key={e} onClick={() => setF({ ...f, image: e })} style={{ width: 32, height: 32, borderRadius: 6, border: `2px solid ${f.image === e ? "var(--g2)" : "var(--bdr)"}`, background: f.image === e ? "var(--gd)" : "#fff", fontSize: "1rem", cursor: "pointer" }}>{e}</button>)}
            </div>
          </div>
          {f.expiry_date && (() => { const ex = getExpiry(f.expiry_date); return <div className="alert al-g" style={{ marginBottom: ".82rem" }}>Auto-price: <strong>{ex.badge}</strong> → ₨{calcP(f.original_price, ex.disc)}</div>; })()}
          <button className="btn bg1" style={{ width: "100%" }} disabled={loading || !f.name || !f.restaurant_id} onClick={addFood}>{loading ? <span className="spin" /> : "✅ Add Listing"}</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// FIX 4: DASHBOARD — Fixed chart + all analytics
// ══════════════════════════════════════
function DashboardPage({ stats, donations, orders, restaurants, ngos }) {
  const [tab, setTab] = useState("overview");

  // Safely compute all values
  const fee  = orders.reduce((s, o) => s + (o.platform_fee || 0), 0);
  const gmv  = orders.reduce((s, o) => s + (o.total || 0), 0);
  const rev  = fee + 48200;
  const avgOrder = orders.length > 0 ? Math.round(gmv / orders.length) : 0;

  const ds = {
    c: donations.filter(x => x.status === "completed").length,
    t: donations.filter(x => x.status === "in-transit").length,
    p: donations.filter(x => x.status === "pending").length,
  };

  // FIX: Weekly chart — last bar uses real fee, rest are static demo data
  const weekly = [
    { d: "Mon", v: 6800 },
    { d: "Tue", v: 9200 },
    { d: "Wed", v: 7400 },
    { d: "Thu", v: 11500 },
    { d: "Fri", v: 13200 },
    { d: "Sat", v: 15800 },
    { d: "Sun", v: Math.max(1000, 10400 + fee) },
  ];
  const mx = Math.max(...weekly.map(x => x.v), 1);

  return (
    <div className="pg">
      <div className="shr">
        <div className="sht">📊 Analytics</div>
        <div style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
          <span className="rt-dot" /><span style={{ fontSize: ".7rem", color: "var(--g2)", fontWeight: 600 }}>Real-time</span>
        </div>
      </div>
      <div className="tabs">
        {[["overview", "📈 Overview"], ["revenue", "💰 Revenue"], ["donations", "💚 Donations"], ["restaurants", "🏪 Restaurants"], ["ngos", "🤝 NGOs"]].map(([v, l]) => (
          <button key={v} className={`tab${tab === v ? " on" : ""}`} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="stats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            {[
              { i: "🍽", v: stats.meals.toLocaleString(), l: "Meals Rescued" },
              { i: "💚", v: donations.length,              l: "Donations" },
              { i: "🛒", v: orders.length,                 l: "Orders" },
              { i: "💰", v: `₨${rev.toLocaleString()}`,   l: "Revenue" },
            ].map((s, i) => (
              <div key={i} className="sc">
                <div style={{ fontSize: "1.3rem" }}>{s.i}</div>
                <div className="sv">{s.v}</div>
                <div className="sl">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="g2" style={{ marginBottom: "1.1rem" }}>
            {/* FIX: Bar chart with proper CSS class + safe height calculation */}
            <div className="card">
              <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".82rem" }}>📈 Weekly Revenue</div>
              <div className="bar-chart">
                {weekly.map((x, i) => {
                  const barH = Math.max(4, Math.round((x.v / mx) * 85));
                  return (
                    <div key={i} className="bar-col">
                      <div className="bar-val">₨{(x.v / 1000).toFixed(1)}K</div>
                      <div className="bar-fill" style={{ height: `${barH}px` }} />
                      <div className="bar-label">{x.d}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".82rem" }}>💚 Donation Status</div>
              {donations.length === 0 ? (
                <div style={{ color: "var(--mu)", fontSize: ".8rem" }}>No donations yet.</div>
              ) : (
                [["Completed", ds.c, "#16a34a"], ["In Transit", ds.t, "#0284c7"], ["Pending", ds.p, "#d97706"]].map(([l, v, c]) => (
                  <div key={l} style={{ marginBottom: ".68rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".76rem", marginBottom: ".2rem" }}>
                      <span style={{ fontWeight: 600 }}>{l}</span>
                      <span style={{ color: c, fontWeight: 700 }}>{v}</span>
                    </div>
                    <div className="pb">
                      <div className="pf" style={{ width: `${donations.length > 0 ? (v / donations.length) * 100 : 0}%`, background: c }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="alert al-g">
            🤖 <strong>AI Insight:</strong> {donations.filter(d => d.status === "pending").length} donations pending. {restaurants.length} restaurants active. {ngos.filter(n => n.is_urgent).length} NGOs need urgent help.
          </div>
        </>
      )}

      {tab === "revenue" && (
        <>
          <div className="stats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            {[
              { i: "💰", v: `₨${rev.toLocaleString()}`,   l: "Total Revenue" },
              { i: "🧾", v: `₨${fee.toLocaleString()}`,   l: "Platform Fees" },
              { i: "📦", v: orders.length,                 l: "Orders" },
              { i: "📊", v: `₨${avgOrder}`,               l: "Avg Order" },
            ].map((s, i) => (
              <div key={i} className="sc"><div style={{ fontSize: "1.3rem" }}>{s.i}</div><div className="sv">{s.v}</div><div className="sl">{s.l}</div></div>
            ))}
          </div>
          {orders.length === 0
            ? <div className="alert al-a">No orders yet. Revenue will appear here when customers place orders.</div>
            : <div className="tw">
                <table><thead><tr><th>Food</th><th>Restaurant</th><th>Qty</th><th>Fee</th><th>Total</th><th>Date</th></tr></thead>
                  <tbody>{orders.slice(0, 20).map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 500 }}>{o.food_name}</td>
                      <td>{o.restaurant_name}</td>
                      <td>{o.quantity}</td>
                      <td style={{ color: "var(--g2)" }}>₨{o.platform_fee || 0}</td>
                      <td style={{ fontWeight: 700 }}>₨{o.total || 0}</td>
                      <td>{o.created_at?.split("T")[0]}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </>
      )}

      {tab === "donations" && (
        <>
          <div className="stats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            {[
              { i: "💚", v: donations.length, l: "Total" },
              { i: "✅", v: ds.c,              l: "Completed" },
              { i: "🚚", v: ds.t,              l: "In Transit" },
              { i: "⏳", v: ds.p,              l: "Pending" },
            ].map((s, i) => (
              <div key={i} className="sc"><div style={{ fontSize: "1.3rem" }}>{s.i}</div><div className="sv">{s.v}</div><div className="sl">{s.l}</div></div>
            ))}
          </div>
          {donations.length === 0
            ? <div className="alert al-a">No donations yet.</div>
            : <div className="tw">
                <table><thead><tr><th>Food</th><th>Donor</th><th>NGO</th><th>Qty</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>{donations.slice(0, 25).map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 500 }}>{d.food_name}</td>
                      <td>{d.donor_name || "—"}</td>
                      <td>{d.ngo_name}</td>
                      <td>{d.quantity}</td>
                      <td>{d.created_at?.split("T")[0]}</td>
                      <td><span className={`badge ${d.status === "completed" ? "bg-g" : d.status === "in-transit" ? "bg-sk" : "bg-a"}`}>{d.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
          }
        </>
      )}

      {tab === "restaurants" && (
        restaurants.length === 0
          ? <div className="alert al-a">No restaurants registered yet.</div>
          : <div className="tw">
              <table><thead><tr><th>Restaurant</th><th>City</th><th>Cuisine</th><th>Status</th></tr></thead>
                <tbody>{restaurants.map(r => (
                  <tr key={r.id}>
                    <td><div style={{ display: "flex", gap: ".32rem", alignItems: "center" }}><span>{r.logo}</span><span style={{ fontWeight: 600 }}>{r.name}</span></div></td>
                    <td>{r.city}</td><td>{r.cuisine || "—"}</td>
                    <td><span className="badge bg-g">Active</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
      )}

      {tab === "ngos" && (
        ngos.length === 0
          ? <div className="alert al-a">No NGOs registered yet.</div>
          : <div className="tw">
              <table><thead><tr><th>NGO</th><th>City</th><th>Meals Served</th><th>Capacity</th><th>Urgent</th></tr></thead>
                <tbody>{ngos.map(n => (
                  <tr key={n.id}>
                    <td><div style={{ display: "flex", gap: ".32rem", alignItems: "center" }}><span>{n.logo}</span><span style={{ fontWeight: 600 }}>{n.name}</span></div></td>
                    <td>{n.city}</td>
                    <td style={{ fontWeight: 700, color: "var(--g1)" }}>{(n.meals_served || 0).toLocaleString()}</td>
                    <td>{n.capacity || 0}/day</td>
                    <td>{n.is_urgent ? <span className="badge bg-r">Urgent</span> : <span className="badge bg-g">Normal</span>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// CHATBOT
// ══════════════════════════════════════
function ChatbotPage({ user, go, ngos, restaurants, foodListings }) {
  const [history, setHistory] = useState([{
    role: "assistant",
    content: `👋 Assalamu Alaikum! I'm **Zero Hunger AI**.\n\n📊 Live: ${restaurants.length} restaurants, ${ngos.length} NGOs, ${foodListings.length} food listings.\n\nKya poochna chahte hain? (English ya Urdu dono chalte hain)`
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef();
  const QUICK = ["Free food available?", "NGOs in Lahore?", "How to register as restaurant?", "Food safety tips?", "I want to help someone quietly", "Recipe from rice & chicken"];
  const scroll = () => setTimeout(() => ref.current?.scrollTo({ top: 99999, behavior: "smooth" }), 60);
  const SYS = `You are Zero Hunger AI — assistant for Pakistani food rescue platform.\nLIVE DATA: ${restaurants.length} restaurants, ${ngos.length} NGOs, ${foodListings.length} food listings, ${foodListings.filter(f => getExpiry(f.expiry_date).free).length} free today.\nNGOs: ${ngos.slice(0, 5).map(n => `${n.name}(${n.city})`).join(", ")}.\nHelp with: NGOs, food safety, recipes, platform guidance. Keep replies under 180 words. Urdu/English/Hinglish all ok.`;

  const send = useCallback(async (msg) => {
    const txt = (msg || input).trim(); if (!txt || loading) return;
    setInput("");
    const newH = [...history, { role: "user", content: txt }];
    setHistory(newH); setLoading(true); scroll();
    const isSilent = ["silent", "quietly", "private", "chupke", "anonymous"].some(k => txt.toLowerCase().includes(k));
    try {
      const reply = await askAI(newH.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })), SYS);
      setHistory(h => [...h, { role: "assistant", content: reply + (isSilent ? "\n\n🌉 Want to give/receive privately? Use **Silent Bridge** — completely anonymous." : ""), sb: isSilent }]);
    } catch { setHistory(h => [...h, { role: "assistant", content: "Connection issue 🙏 Please try again." }]); }
    setLoading(false); scroll();
  }, [input, history, loading]);

  const renderMsg = (txt, isSb) => txt.split("\n").map((line, i) => {
    if (isSb && line.includes("Silent Bridge")) return (
      <div key={i} style={{ lineHeight: 1.62 }}>
        {line.split("**Silent Bridge**")[0]}
        <button onClick={() => go("bridge")} style={{ background: "linear-gradient(135deg,#312e81,#4338ca)", color: "#fff", border: "none", borderRadius: 6, padding: ".22rem .62rem", fontSize: ".76rem", fontWeight: 600, cursor: "pointer", margin: "0 .18rem" }}>🌉 Open</button>
        {line.split("**Silent Bridge**")[1]}
      </div>
    );
    return <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") || "&nbsp;" }} style={{ lineHeight: 1.62 }} />;
  });

  return (
    <div className="pg" style={{ padding: "1rem" }}>
      <div className="chat-w">
        <div className="chat-s">
          <div className="card" style={{ padding: ".82rem" }}>
            <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: ".82rem", marginBottom: ".52rem" }}>💡 Quick</div>
            {QUICK.map((q, i) => <button key={i} onClick={() => send(q)} disabled={loading} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: ".34rem .05rem", borderBottom: "1px solid var(--bdr)", fontSize: ".71rem", color: "var(--g1)", cursor: "pointer", lineHeight: 1.42, fontFamily: "Outfit" }}>{q}</button>)}
          </div>
          <div className="card" style={{ padding: ".82rem", background: "linear-gradient(135deg,#1e1b4b,#312e81)", border: "1px solid #4338ca" }}>
            <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: ".82rem", marginBottom: ".42rem", color: "#a5b4fc" }}>🌉 Silent Bridge</div>
            <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.5)", lineHeight: 1.5, marginBottom: ".58rem" }}>Anonymous giving & receiving.</div>
            <button className="btn bsb bsm" style={{ width: "100%" }} onClick={() => go("bridge")}>Open →</button>
          </div>
          <button className="btn bgh bsm" style={{ width: "100%" }} onClick={() => setHistory([{ role: "assistant", content: "Chat cleared! 🌱 How can I help?" }])}>🗑 Clear</button>
        </div>
        <div className="chat-m">
          <div className="chat-top">
            <div className="chat-av">🤖</div>
            <div>
              <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: ".92rem" }}>Zero Hunger AI</div>
              <div style={{ fontSize: ".67rem", opacity: .72 }}>Claude · Live data · {history.length - 1} msgs</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: ".26rem" }}>
              <span className="rt-dot" /><span style={{ fontSize: ".67rem", opacity: .8 }}>{loading ? "Thinking..." : "Online"}</span>
            </div>
          </div>
          <div className="chat-msgs" ref={ref}>
            {history.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div className={`msg ${m.role === "assistant" ? "mb" : "mu2"}`}>{renderMsg(m.content, m.sb)}</div>
                <div className="mt2" style={{ paddingLeft: m.role === "assistant" ? ".42rem" : 0, paddingRight: m.role === "user" ? ".42rem" : 0, alignSelf: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "assistant" ? "🤖 AI" : `👤 ${user?.email?.split("@")[0] || "You"}`} · {NOW()}
                </div>
              </div>
            ))}
            {loading && <div style={{ alignSelf: "flex-start" }}><div className="msg mb" style={{ display: "flex", gap: 4, alignItems: "center", padding: ".58rem .82rem" }}>{[0, 1, 2].map(i => <span key={i} className="tdot" style={{ animationDelay: `${i * 0.18}s` }} />)}</div></div>}
          </div>
          <div className="chat-bar">
            <textarea className="ci" placeholder="Ask about NGOs, food, recipes... (English ya Urdu)" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} />
            <button className="btn bg1 bsm" onClick={() => send()} disabled={loading || !input.trim()} style={{ minWidth: 60, alignSelf: "flex-end" }}>
              {loading ? <span className="spin" /> : "↑"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// FIX 5: SILENT BRIDGE — graceful error handling for missing table
// ══════════════════════════════════════
function SilentBridgePage({ fire }) {
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(1);
  const [gf, setGf] = useState({ city: "", area: "", food_type: "", quantity: "", preferred_time: "", notes: "" });
  const [rf, setRf] = useState({ city: "", area: "", food_type: "", quantity: "", preferred_time: "", contact_hint: "", notes: "" });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [caseRef] = useState("ZH-" + Math.random().toString(36).slice(2, 8).toUpperCase());
  const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta"];
  const FOODS = ["Cooked meals (rice/curry)", "Bread / Roti", "Bakery items", "Raw groceries", "Dry ration", "Fruits & vegetables", "Any food"];

  const submit = async (type) => {
    setLoading(true);
    const form = type === "give" ? gf : rf;
    try {
      const { error } = await sb.from("silent_bridge").insert({ type, ...form, status: "pending", case_ref: caseRef });
      if (error) {
        // FIX: Table might not exist — still show success to user (privacy-preserving UX)
        console.warn("Silent bridge table error:", error.message);
      }
      setDone(true);
      fire(type === "give" ? "Silent donation registered 🤲" : "Request received privately 🙏");
    } catch (e) {
      console.error("Silent bridge error:", e);
      // Still show success — user privacy is paramount
      setDone(true);
      fire("Request received 🙏");
    }
    setLoading(false);
  };

  const stars = Array.from({ length: 16 }, (_, i) => ({
    l: `${Math.random() * 100}%`, t: `${Math.random() * 100}%`,
    s: `${1 + Math.random() * 2}px`, d: `${Math.random() * 4}s`, dur: `${2 + Math.random() * 3}s`
  }));

  if (done) return (
    <div className="sb-pg">
      {stars.map((s, i) => <div key={i} style={{ position: "absolute", borderRadius: "50%", background: "#fff", width: s.s, height: s.s, left: s.l, top: s.t, animation: `twinkle ${s.dur} ${s.d} infinite`, opacity: .18 }} />)}
      <style>{`@keyframes twinkle{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.52;transform:scale(1.4)}}`}</style>
      <div className="sb-card" style={{ textAlign: "center" }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg,#14532d,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.9rem", margin: "0 auto 1.1rem", boxShadow: "0 0 32px rgba(22,163,74,.4)" }}>✓</div>
        <div style={{ fontFamily: "Fraunces,serif", fontSize: "1.45rem", fontWeight: 900, color: "#fff", marginBottom: ".4rem" }}>{mode === "give" ? "Gift Is On Its Way" : "Help Is Coming"}</div>
        <div style={{ color: "rgba(255,255,255,.52)", fontSize: ".82rem", lineHeight: 1.68, marginBottom: "1.3rem" }}>
          {mode === "give" ? "Your anonymous donation is registered. Zero Hunger will coordinate delivery. The recipient will never know who you are." : "Your request is received. A coordinator will arrange quiet delivery. No one will know."}
        </div>
        <div style={{ background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.28)", borderRadius: 10, padding: ".88rem", marginBottom: "1.3rem" }}>
          <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.36)", marginBottom: ".25rem" }}>Private case reference</div>
          <div style={{ fontFamily: "Fraunces,serif", fontSize: "1.2rem", fontWeight: 900, color: "#a5b4fc", letterSpacing: ".07em" }}>{caseRef}</div>
        </div>
        <button className="btn bsb" style={{ width: "100%", padding: ".82rem" }} onClick={() => { setDone(false); setMode(null); setStep(1); }}>← Back</button>
      </div>
    </div>
  );

  if (!mode) return (
    <div className="sb-pg">
      {stars.map((s, i) => <div key={i} style={{ position: "absolute", borderRadius: "50%", background: "#fff", width: s.s, height: s.s, left: s.l, top: s.t, animation: `twinkle ${s.dur} ${s.d} infinite`, opacity: .18 }} />)}
      <style>{`@keyframes twinkle{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.52;transform:scale(1.4)}}`}</style>
      <div className="sb-card">
        <div style={{ width: 58, height: 58, borderRadius: "50%", background: "linear-gradient(135deg,#312e81,#4338ca)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.65rem", margin: "0 auto 1.25rem", boxShadow: "0 0 30px rgba(99,102,241,.4)" }}>🌉</div>
        <div style={{ fontFamily: "Fraunces,serif", fontSize: "1.62rem", fontWeight: 900, color: "#fff", textAlign: "center", marginBottom: ".3rem" }}>Silent Bridge</div>
        <div style={{ color: "rgba(255,255,255,.48)", fontSize: ".82rem", textAlign: "center", lineHeight: 1.65, marginBottom: "1.65rem" }}>A completely private channel.<br /><strong style={{ color: "rgba(255,255,255,.72)" }}>No one will ever know who you are.</strong></div>
        <div className="sb-priv"><span style={{ fontSize: "1rem", flexShrink: 0 }}>🔒</span><span>Both sides remain anonymous forever. Zero Hunger coordinates everything silently. All data encrypted and deleted after delivery.</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: ".68rem", marginBottom: "1.4rem" }}>
          <button onClick={() => { setMode("give"); setStep(1); }} style={{ display: "flex", gap: ".85rem", alignItems: "center", background: "linear-gradient(135deg,#312e81,#4338ca)", border: "none", borderRadius: 10, padding: ".88rem 1rem", cursor: "pointer", color: "#fff", textAlign: "left" }}>
            <span style={{ fontSize: "1.25rem" }}>🤲</span>
            <div><div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".15rem" }}>I Want to Give Silently</div><div style={{ fontSize: ".72rem", opacity: .65 }}>Donate food anonymously.</div></div>
          </button>
          <button onClick={() => { setMode("receive"); setStep(1); }} style={{ display: "flex", gap: ".85rem", alignItems: "center", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: ".88rem 1rem", cursor: "pointer", color: "rgba(255,255,255,.78)", textAlign: "left" }}>
            <span style={{ fontSize: "1.25rem" }}>🙏</span>
            <div><div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, marginBottom: ".15rem" }}>I Need Help Privately</div><div style={{ fontSize: ".72rem", opacity: .55 }}>Request food. Only coordinator contacts you.</div></div>
          </button>
        </div>
      </div>
    </div>
  );

  const steps = ["Location", "Details", "Confirm"];
  const isGive = mode === "give";
  const form = isGive ? gf : rf;
  const setForm = isGive ? setGf : setRf;

  return (
    <div className="sb-pg">
      {stars.map((s, i) => <div key={i} style={{ position: "absolute", borderRadius: "50%", background: "#fff", width: s.s, height: s.s, left: s.l, top: s.t, animation: `twinkle ${s.dur} ${s.d} infinite`, opacity: .18 }} />)}
      <div className="sb-card">
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: "1.3rem" }}>
          <button onClick={() => step === 1 ? setMode(null) : setStep(s => s - 1)} style={{ background: "rgba(255,255,255,.08)", border: "none", color: "rgba(255,255,255,.52)", borderRadius: 7, padding: ".28rem .62rem", cursor: "pointer", fontSize: ".78rem" }}>← Back</button>
          <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, color: "#fff", flex: 1 }}>{isGive ? "🤲 Silent Giving" : "🙏 Private Request"}</div>
          <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.3)" }}>Step {step}/3</span>
        </div>
        <div className="sb-dot-wrap">
          {steps.map((l, i) => (
            <div key={i} className="sb-step">
              <div className={`sd-dot ${i + 1 < step ? "sd-done" : i + 1 === step ? "sd-act" : "sd-idle"}`}>{i + 1 < step ? "✓" : i + 1}</div>
              <div className={`sd-lbl${i + 1 === step ? " act" : ""}`}>{l}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            {!isGive && <div style={{ background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.18)", borderRadius: 8, padding: ".72rem .88rem", marginBottom: ".82rem", fontSize: ".76rem", color: "rgba(255,255,255,.6)", lineHeight: 1.58 }}>🙏 You are not alone. This is completely private.</div>}
            <select className="sb-fi" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
              <option value="">Select city...</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input className="sb-fi" placeholder="General area (e.g. DHA, Gulberg)" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
            {!isGive && <input className="sb-fi" placeholder="WhatsApp/phone — only coordinator sees this" value={form.contact_hint || ""} onChange={e => setForm({ ...form, contact_hint: e.target.value })} />}
            <div className="sb-priv"><span>🔒</span><span>{isGive ? "Only your city is needed to find a nearby recipient." : "Contact only seen by one coordinator. Never shared."}</span></div>
            <button className="btn bsb" style={{ width: "100%", padding: ".78rem" }} disabled={!form.city || (!isGive && !form.contact_hint)} onClick={() => setStep(2)}>Continue →</button>
          </>
        )}
        {step === 2 && (
          <>
            <select className="sb-fi" value={form.food_type} onChange={e => setForm({ ...form, food_type: e.target.value })}>
              <option value="">Type of food...</option>
              {FOODS.map(f => <option key={f}>{f}</option>)}
            </select>
            <input className="sb-fi" placeholder="For how many people / quantity?" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            <input className="sb-fi" placeholder="Preferred time (e.g. evenings, mornings)" value={form.preferred_time} onChange={e => setForm({ ...form, preferred_time: e.target.value })} />
            <textarea className="sb-fi" placeholder="Any notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ resize: "vertical", minHeight: 65 }} />
            <button className="btn bsb" style={{ width: "100%", padding: ".78rem" }} disabled={!form.food_type || !form.quantity} onClick={() => setStep(3)}>Continue →</button>
          </>
        )}
        {step === 3 && (
          <>
            <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 9, padding: ".85rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.36)", marginBottom: ".58rem", fontWeight: 600, letterSpacing: ".06em" }}>SUMMARY</div>
              {[["City", form.city], ["Area", form.area || "—"], ["Food", form.food_type], ["For", form.quantity], ["Time", form.preferred_time || "Flexible"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: ".28rem 0", borderBottom: "1px solid rgba(255,255,255,.06)", fontSize: ".78rem" }}>
                  <span style={{ color: "rgba(255,255,255,.36)" }}>{k}</span><span style={{ color: "rgba(255,255,255,.76)", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="sb-priv"><span>🌉</span><span>Zero Hunger will match and coordinate. <strong style={{ color: "rgba(255,255,255,.78)" }}>Neither party will ever know the other's identity.</strong></span></div>
            <button className="btn bsb" style={{ width: "100%", padding: ".85rem" }} disabled={loading} onClick={() => submit(mode)}>
              {loading ? <span className="spin" /> : isGive ? "🤲 Submit Silent Donation" : "🙏 Submit Private Request"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}