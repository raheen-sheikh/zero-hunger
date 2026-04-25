import { useState, useRef, useCallback } from "react";

/* ═══════════════════════ HELPERS ═══════════════════════ */
function d(days){ const x=new Date(); x.setDate(x.getDate()+days); return x.toISOString().split("T")[0]; }
function getExpiry(exp){
  const diff=Math.floor((new Date(exp)-new Date())/86400000);
  if(diff>=2) return {label:"Fresh",color:"#16a34a",bg:"#dcfce7",badge:"FULL PRICE",free:false,disc:0};
  if(diff===1) return {label:"50% Off",color:"#d97706",bg:"#fef3c7",badge:"50% OFF",free:false,disc:50};
  return {label:"Donate Free",color:"#dc2626",bg:"#fee2e2",badge:"FREE 🎁",free:true,disc:100};
}
function ts(){ return new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); }

/* ═══════════════════════ DATA ═══════════════════════════ */
const REAL_NGOS=[
  {id:1,name:"Al-Khidmat Foundation",city:"Lahore",   area:"Gulberg",        contact:"0800-00786",  served:125000,capacity:500,urgent:true, verified:true,logo:"🕌",desc:"Largest Islamic welfare org in Pakistan. Daily langar across 50+ cities."},
  {id:2,name:"Edhi Foundation",      city:"Karachi",  area:"Mithadar",       contact:"021-32474661",served:340000,capacity:800,urgent:true, verified:true,logo:"🏥",desc:"World's largest volunteer ambulance network — orphanages, shelters & kitchens."},
  {id:3,name:"Saylani Welfare Trust",city:"Karachi",  area:"Bahadurabad",    contact:"0317-4224224",served:210000,capacity:600,urgent:false,verified:true,logo:"🤲",desc:"Free food program feeding 100,000+ people daily across Pakistan."},
  {id:4,name:"Akhuwat Foundation",   city:"Lahore",   area:"Model Town",     contact:"0800-00078",  served:89000, capacity:300,urgent:false,verified:true,logo:"🌟",desc:"Interest-free microfinance & community kitchens for underprivileged families."},
  {id:5,name:"JDC Foundation",       city:"Karachi",  area:"Gulshan-e-Iqbal",contact:"021-34536663",served:67000, capacity:400,urgent:true, verified:true,logo:"🍽",desc:"Runs Dastarkhwan with 300+ food distribution points nationwide."},
  {id:6,name:"Chippa Welfare",       city:"Karachi",  area:"Nazimabad",      contact:"1020",        served:45000, capacity:200,urgent:false,verified:true,logo:"🚑",desc:"Emergency rescue & free meal service for homeless and flood victims."},
  {id:7,name:"Pakistan Bait ul Mal", city:"Islamabad",area:"F-8 Markaz",     contact:"051-9246254", served:180000,capacity:700,urgent:false,verified:true,logo:"🏛",desc:"Government welfare body providing food support to orphans and widows."},
  {id:8,name:"Shaukat Khanum Trust", city:"Lahore",   area:"Johar Town",     contact:"042-35945100",served:32000, capacity:150,urgent:true, verified:true,logo:"💙",desc:"Cancer hospital & welfare kitchen serving patients and their families."},
];

const REAL_RESTAURANTS=[
  {id:1,name:"Café Aylanto",     city:"Lahore",   area:"Gulberg III",contact:"042-35761000",cuisine:"Continental",  rating:4.8,orders:1240,revenue:485000, logo:"🍝",owner:"Bilal Chaudhry",  joined:"2024-01",foods:[{id:101,name:"Grilled Chicken Pasta",qty:8, expiry:d(2),price:680, unit:"plate",  img:"🍝"},{id:102,name:"Caesar Salad",          qty:12,expiry:d(1),price:380, unit:"bowl",   img:"🥗"},{id:103,name:"Tiramisu Dessert",        qty:15,expiry:d(0),price:0,   unit:"slice",  img:"🍮"},{id:104,name:"Garlic Bread Basket",     qty:20,expiry:d(1),price:220, unit:"basket", img:"🥖"}]},
  {id:2,name:"Bundu Khan",       city:"Lahore",   area:"MM Alam Rd", contact:"042-35761234",cuisine:"Mughlai/BBQ",  rating:4.7,orders:3560,revenue:892000, logo:"🍖",owner:"Tariq Bundu Khan",joined:"2023-06",foods:[{id:201,name:"Chicken Karahi (Full)",  qty:5, expiry:d(0),price:0,   unit:"pot",    img:"🍲"},{id:202,name:"Seekh Kebab (12pcs)",   qty:18,expiry:d(1),price:480, unit:"plate",  img:"🥩"},{id:203,name:"Naan (x20)",             qty:40,expiry:d(0),price:0,   unit:"pack",   img:"🫓"},{id:204,name:"Mutton Biryani",          qty:10,expiry:d(2),price:750, unit:"plate",  img:"🍛"}]},
  {id:3,name:"Kolachi Restaurant",city:"Karachi", area:"Do Darya",   contact:"021-35860232",cuisine:"Seafood",      rating:4.9,orders:2890,revenue:1240000,logo:"🦐",owner:"Asif Kolachi",    joined:"2023-11",foods:[{id:301,name:"Prawn Masala",           qty:6, expiry:d(1),price:1200,unit:"plate",  img:"🍤"},{id:302,name:"Fish & Chips",            qty:14,expiry:d(0),price:0,   unit:"plate",  img:"🐟"},{id:303,name:"Chicken Tikka Platter",  qty:9, expiry:d(2),price:850, unit:"platter", img:"🍗"},{id:304,name:"Mango Kulfi",             qty:25,expiry:d(1),price:180, unit:"piece",  img:"🍧"}]},
  {id:4,name:"Cosa Nostra",      city:"Karachi", area:"Clifton",    contact:"021-35870001",cuisine:"Italian/Pizza",rating:4.6,orders:1890,revenue:673000, logo:"🍕",owner:"Farhan Ansari",   joined:"2024-02",foods:[{id:401,name:"Margherita Pizza (14in)",qty:7, expiry:d(0),price:0,   unit:"whole",  img:"🍕"},{id:402,name:"Penne Arrabbiata",        qty:11,expiry:d(1),price:520, unit:"plate",  img:"🍝"},{id:403,name:"Bruschetta (6pcs)",       qty:22,expiry:d(2),price:280, unit:"plate",  img:"🥖"},{id:404,name:"Panna Cotta",             qty:18,expiry:d(1),price:320, unit:"glass",  img:"🍮"}]},
  {id:5,name:"Monal Restaurant", city:"Islamabad",area:"Pir Sohawa",contact:"051-2896000", cuisine:"Pakistani/BBQ",rating:4.8,orders:2100,revenue:945000, logo:"🏔",owner:"Usman Monal",    joined:"2023-09",foods:[{id:501,name:"Shinwari Karahi",        qty:8, expiry:d(2),price:950, unit:"pot",    img:"🥘"},{id:502,name:"Chapli Kebab (8pcs)",    qty:16,expiry:d(1),price:560, unit:"plate",  img:"🥩"},{id:503,name:"Kaak (Mountain Bread)",   qty:30,expiry:d(0),price:0,   unit:"pack",   img:"🫓"},{id:504,name:"Qorma Rice",              qty:12,expiry:d(1),price:680, unit:"plate",  img:"🍛"}]},
  {id:6,name:"Bakery on Main",   city:"Lahore",   area:"DHA Phase 5",contact:"042-35742500",cuisine:"Bakery/Café",  rating:4.5,orders:980, revenue:312000, logo:"🥐",owner:"Hina Malik",     joined:"2024-03",foods:[{id:601,name:"Croissants (dozen)",     qty:24,expiry:d(0),price:0,   unit:"box",    img:"🥐"},{id:602,name:"Blueberry Cheesecake",   qty:8, expiry:d(1),price:650, unit:"slice",  img:"🎂"},{id:603,name:"Sourdough Loaf",          qty:15,expiry:d(2),price:480, unit:"loaf",   img:"🍞"},{id:604,name:"Cinnamon Rolls (6pcs)",   qty:18,expiry:d(1),price:380, unit:"box",    img:"🍩"}]},
];

const INIT_DONATIONS=[
  {id:1,food:"Chicken Karahi",  restaurant:"Bundu Khan",        ngo:"Al-Khidmat Foundation",  qty:5, date:d(-2),status:"completed", value:0},
  {id:2,food:"Croissants",      restaurant:"Bakery on Main",    ngo:"Saylani Welfare Trust",  qty:24,date:d(-1),status:"completed", value:0},
  {id:3,food:"Naan Pack",       restaurant:"Bundu Khan",        ngo:"Edhi Foundation",         qty:40,date:d(0), status:"in-transit",value:0},
  {id:4,food:"Fish & Chips",    restaurant:"Kolachi Restaurant",ngo:"JDC Foundation",           qty:14,date:d(0), status:"pending",   value:0},
  {id:5,food:"Tiramisu",        restaurant:"Café Aylanto",      ngo:"Shaukat Khanum Trust",    qty:15,date:d(0), status:"pending",   value:0},
  {id:6,food:"Mountain Bread",  restaurant:"Monal Restaurant",  ngo:"Akhuwat Foundation",      qty:30,date:d(0), status:"in-transit",value:0},
];

/* ═══════════════════════ AI ═════════════════════════════ */
async function askClaude(messages,system){
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system,messages})
  });
  const data=await res.json();
  return data.content?.[0]?.text||"Sorry, couldn't respond. Please try again.";
}

const BOT_SYSTEM=`You are Zero Hunger AI — a warm, helpful assistant for a Pakistani food waste reduction platform called Zero Hunger. You speak English and Urdu/Hinglish naturally.

PLATFORM DATA:
- Platform Name: Zero Hunger
- Restaurants: Café Aylanto (Lahore), Bundu Khan (Lahore), Kolachi (Karachi), Cosa Nostra (Karachi), Monal (Islamabad), Bakery on Main (Lahore)
- NGOs: Al-Khidmat Foundation (Lahore), Edhi Foundation (Karachi), Saylani Welfare Trust (Karachi), Akhuwat Foundation (Lahore), JDC Foundation (Karachi), Chippa Welfare (Karachi), Pakistan Bait ul Mal (Islamabad), Shaukat Khanum Trust (Lahore)
- Expiry logic: 2+ days = full price | 1 day = 50% off | Same day = FREE donation
- Revenue model: 5% platform fee on food sales + premium subscriptions
- Special Feature: "Silent Bridge" — anonymous dignified giving where both donor and recipient remain completely private

YOU CAN HELP WITH:
1. Finding nearby NGOs for donation (ask their city if not mentioned)
2. Food safety, spoilage detection, storage tips
3. Recipes from leftover ingredients
4. Explaining platform features
5. Donation process guidance
6. If someone says "silent help" or "private donation" or "I want to help someone quietly" — gently guide them to the Silent Bridge feature

TONE: Friendly, concise, helpful. Light emoji. Under 180 words. Match language of user (Urdu/English/Hinglish all fine).`;

/* ═══════════════════════ CSS ════════════════════════════ */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --g1:#14532d;--g2:#16a34a;--g3:#22c55e;--gd:#dcfce7;--gb:#f0fdf4;
  --amber:#d97706;--red:#dc2626;--blue:#2563eb;
  --card:#fff;--border:#bbf7d0;--text:#1a2e1a;--muted:#5a7a5a;
  --sh:0 2px 18px #16a34a12;--sh2:0 8px 36px #16a34a20;
  /* Silent Bridge palette */
  --sb1:#1e1b4b;--sb2:#312e81;--sb3:#4338ca;--sb4:#6366f1;
  --sb-bg:#eef2ff;--sb-border:#a5b4fc;
}
body{font-family:'Outfit',sans-serif;background:var(--gb);color:var(--text);min-height:100vh}
h1,h2,h3{font-family:'Fraunces',serif}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}

/* NAV */
.nav{position:sticky;top:0;z-index:200;background:rgba(255,255,255,.96);backdrop-filter:blur(14px);
  border-bottom:1.5px solid var(--border);display:flex;align-items:center;padding:0 1.25rem;height:58px;gap:.6rem}
.nav-logo{font-family:'Fraunces',serif;font-weight:900;font-size:1.2rem;color:var(--g1);
  display:flex;align-items:center;gap:.3rem;cursor:pointer;white-space:nowrap;margin-right:.15rem}
.nav-logo em{font-style:italic;color:var(--g2)}
.nav-links{display:flex;gap:.08rem;flex:1;overflow-x:auto;align-items:center}
.nb{background:none;border:none;padding:.38rem .68rem;border-radius:8px;cursor:pointer;
  font-family:'Outfit',sans-serif;font-size:.79rem;font-weight:500;color:var(--muted);transition:.15s;white-space:nowrap}
.nb:hover,.nb.on{background:var(--gd);color:var(--g2)}
.nb.cta{background:var(--g1);color:#fff;font-weight:600}.nb.cta:hover{background:var(--g2)}
/* Silent Bridge nav button — subtle violet */
.nb.sb-nav{color:#6366f1;font-weight:600}
.nb.sb-nav:hover,.nb.sb-nav.on{background:#eef2ff;color:#4338ca}
.nav-right{display:flex;align-items:center;gap:.4rem;margin-left:auto;flex-shrink:0}

/* PAGE */
.page{max-width:1280px;margin:0 auto;padding:1.5rem;animation:up .3s ease}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

/* HERO */
.hero{background:linear-gradient(135deg,#052e16 0%,#14532d 45%,#16a34a 100%);
  border-radius:18px;padding:2.75rem;color:#fff;position:relative;overflow:hidden;margin-bottom:1.5rem}
.hero::after{content:'';position:absolute;right:-60px;top:-60px;width:300px;height:300px;
  background:radial-gradient(circle,rgba(34,197,94,.22) 0%,transparent 70%);border-radius:50%;pointer-events:none}
.hero h1{font-size:2.4rem;font-weight:900;line-height:1.1;margin-bottom:.55rem}
.hero h1 i{font-style:italic;color:#86efac}
.hero p{font-size:.95rem;opacity:.82;max-width:460px;line-height:1.65;margin-bottom:1.4rem;font-weight:300}
.hbtns{display:flex;gap:.55rem;flex-wrap:wrap}

/* BTNS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;padding:.55rem 1.15rem;
  border-radius:9px;border:none;font-family:'Outfit',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;transition:.15s}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-w{background:#fff;color:var(--g1)}.btn-w:hover{background:#f0fdf4}
.btn-ol{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.4)}.btn-ol:hover{background:rgba(255,255,255,.1)}
.btn-g{background:var(--g2);color:#fff}.btn-g:hover{background:var(--g3)}
.btn-g1{background:var(--g1);color:#fff}.btn-g1:hover{background:var(--g2)}
.btn-gh{background:var(--gd);color:var(--g1)}.btn-gh:hover{background:#bbf7d0}
.btn-sm{padding:.32rem .75rem;font-size:.76rem}
/* Silent Bridge button */
.btn-sb{background:linear-gradient(135deg,#312e81,#4338ca);color:#fff;box-shadow:0 4px 16px #4338ca30}
.btn-sb:hover{background:linear-gradient(135deg,#4338ca,#6366f1);box-shadow:0 6px 20px #4338ca40}
.btn-sb-ghost{background:#eef2ff;color:#4338ca;border:1.5px solid #a5b4fc}
.btn-sb-ghost:hover{background:#e0e7ff}

/* STATS */
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:.9rem;margin-bottom:1.5rem}
.sc{background:var(--card);border:1.5px solid var(--border);border-radius:13px;padding:1rem 1.1rem;box-shadow:var(--sh)}
.sc-i{font-size:1.5rem;margin-bottom:.25rem}
.sc-v{font-family:'Fraunces',serif;font-size:1.65rem;font-weight:900;color:var(--g1);line-height:1}
.sc-l{font-size:.72rem;color:var(--muted);margin-top:.18rem;font-weight:500}
.sc-d{font-size:.7rem;color:var(--g2);font-weight:600;margin-top:.15rem}

/* GRIDS */
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.g2{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:.85rem}

/* CARD */
.card{background:var(--card);border:1.5px solid var(--border);border-radius:13px;padding:1.25rem;box-shadow:var(--sh);transition:.2s}
.card:hover{box-shadow:var(--sh2)}
.ch{cursor:pointer}.ch:hover{transform:translateY(-2px)}

.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.sh-t{font-family:'Fraunces',serif;font-size:1.15rem;font-weight:700}

/* BADGE */
.badge{display:inline-flex;align-items:center;padding:.16rem .5rem;border-radius:99px;font-size:.68rem;font-weight:700;letter-spacing:.02em;white-space:nowrap}
.bg-g{background:var(--gd);color:var(--g1)}.bg-a{background:#fef3c7;color:var(--amber)}
.bg-r{background:#fee2e2;color:var(--red)}.bg-b{background:#dbeafe;color:var(--blue)}
.bg-sk{background:#e0f2fe;color:#0284c7}.bg-sb{background:#eef2ff;color:#4338ca}

/* RESTAURANT CARD */
.rcard{background:var(--card);border:1.5px solid var(--border);border-radius:15px;overflow:hidden;box-shadow:var(--sh);transition:.2s}
.rcard:hover{box-shadow:var(--sh2);transform:translateY(-2px)}
.rcard-h{padding:1rem 1.1rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:.75rem}
.rlogo{width:44px;height:44px;border-radius:10px;background:var(--gd);display:flex;align-items:center;justify-content:center;font-size:1.45rem;flex-shrink:0}
.food-row{display:flex;align-items:center;gap:.55rem;padding:.5rem 0;border-bottom:1px solid #f0fdf4;cursor:pointer;transition:.1s;border-radius:5px}
.food-row:last-child{border-bottom:none}
.food-row:hover{background:var(--gb);padding-left:.35rem}
.ficon{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}

/* NGO CARD */
.ncard{background:var(--card);border:1.5px solid var(--border);border-radius:15px;box-shadow:var(--sh);transition:.2s;overflow:hidden}
.ncard:hover{box-shadow:var(--sh2);transform:translateY(-2px)}
.nlogo{width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,var(--gd),#a7f3d0);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0}

/* ═══ SILENT BRIDGE ═══════════════════════════════════════ */
/* Full page wrapper */
.sb-page{min-height:100vh;background:linear-gradient(160deg,#0f0e1a 0%,#1e1b4b 40%,#14532d 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:2rem;position:relative;overflow:hidden}
.sb-page::before{content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at 20% 50%,rgba(99,102,241,.15) 0%,transparent 60%),
             radial-gradient(ellipse at 80% 20%,rgba(22,163,74,.12) 0%,transparent 50%);pointer-events:none}
/* Floating stars */
.sb-star{position:absolute;border-radius:50%;background:#fff;animation:twinkle 3s infinite}
@keyframes twinkle{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.6;transform:scale(1.4)}}
/* Main card */
.sb-card{background:rgba(255,255,255,.04);backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.1);border-radius:24px;
  padding:3rem 3.5rem;width:100%;max-width:560px;
  box-shadow:0 24px 80px rgba(0,0,0,.5),0 0 0 1px rgba(99,102,241,.2);
  animation:sbIn .5s ease;position:relative;z-index:2}
@keyframes sbIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.sb-logo{width:70px;height:70px;background:linear-gradient(135deg,#312e81,#4338ca);
  border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:2rem;margin:0 auto 1.5rem;box-shadow:0 0 40px rgba(99,102,241,.4)}
.sb-title{font-family:'Fraunces',serif;font-size:1.8rem;font-weight:900;color:#fff;text-align:center;margin-bottom:.4rem}
.sb-sub{color:rgba(255,255,255,.55);font-size:.88rem;text-align:center;line-height:1.65;margin-bottom:2rem;font-weight:300}
/* Steps */
.sb-steps{display:flex;gap:0;margin-bottom:2rem;position:relative}
.sb-steps::before{content:'';position:absolute;top:16px;left:16px;right:16px;height:2px;background:rgba(255,255,255,.1);z-index:0}
.sb-step{flex:1;display:flex;flex-direction:column;align-items:center;gap:.4rem;position:relative;z-index:1}
.sb-step-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700;transition:.3s}
.sb-step-dot.done{background:linear-gradient(135deg,#312e81,#4338ca);color:#fff;box-shadow:0 0 16px rgba(99,102,241,.5)}
.sb-step-dot.active{background:linear-gradient(135deg,#4338ca,#6366f1);color:#fff;box-shadow:0 0 20px rgba(99,102,241,.7);animation:pulse .9s infinite}
.sb-step-dot.idle{background:rgba(255,255,255,.08);color:rgba(255,255,255,.3)}
@keyframes pulse{0%,100%{box-shadow:0 0 16px rgba(99,102,241,.5)}50%{box-shadow:0 0 28px rgba(99,102,241,.9)}}
.sb-step-label{font-size:.62rem;color:rgba(255,255,255,.4);text-align:center;max-width:60px;line-height:1.35}
.sb-step-label.active{color:rgba(255,255,255,.8)}
/* Fields */
.sb-field{margin-bottom:1.1rem}
.sb-label{font-size:.76rem;font-weight:600;color:rgba(255,255,255,.6);margin-bottom:.35rem;display:block}
.sb-input{width:100%;padding:.65rem .9rem;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);
  border-radius:10px;font-family:'Outfit',sans-serif;font-size:.9rem;color:#fff;outline:none;transition:.2s}
.sb-input:focus{border-color:rgba(99,102,241,.6);background:rgba(99,102,241,.1);box-shadow:0 0 0 3px rgba(99,102,241,.15)}
.sb-input::placeholder{color:rgba(255,255,255,.25)}
select.sb-input option{background:#1e1b4b;color:#fff}
textarea.sb-input{resize:vertical;min-height:80px}
/* Privacy badge */
.sb-privacy{display:flex;align-items:center;gap:.65rem;padding:.75rem 1rem;
  background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:10px;
  margin-bottom:1.5rem;font-size:.78rem;color:rgba(255,255,255,.65);line-height:1.5}
.sb-privacy-icon{font-size:1.2rem;flex-shrink:0}
/* Success screen */
.sb-success{text-align:center;padding:1rem 0}
.sb-success-ring{width:80px;height:80px;border-radius:50%;
  background:linear-gradient(135deg,#14532d,#16a34a);
  display:flex;align-items:center;justify-content:center;
  font-size:2.2rem;margin:0 auto 1.25rem;box-shadow:0 0 40px rgba(22,163,74,.4);
  animation:popIn .5s cubic-bezier(.175,.885,.32,1.275)}
@keyframes popIn{from{transform:scale(0)}to{transform:scale(1)}}
/* Entry hint on home */
.sb-hint{background:linear-gradient(135deg,rgba(30,27,75,.06),rgba(67,56,202,.08));
  border:1.5px dashed rgba(99,102,241,.3);border-radius:14px;
  padding:1rem 1.25rem;display:flex;align-items:center;gap:.85rem;cursor:pointer;transition:.2s}
.sb-hint:hover{border-color:rgba(99,102,241,.55);background:linear-gradient(135deg,rgba(30,27,75,.1),rgba(67,56,202,.12))}

/* CHAT */
.chat-wrap{display:flex;height:calc(100vh - 130px);min-height:500px;gap:1.1rem}
.chat-side{width:230px;flex-shrink:0;display:flex;flex-direction:column;gap:.75rem}
.chat-main{flex:1;display:flex;flex-direction:column;background:var(--card);
  border:1.5px solid var(--border);border-radius:15px;overflow:hidden;box-shadow:var(--sh)}
.chat-top{background:linear-gradient(90deg,var(--g1),var(--g2));color:#fff;
  padding:.85rem 1.1rem;display:flex;align-items:center;gap:.65rem}
.chat-av{width:36px;height:36px;background:rgba(255,255,255,.15);border-radius:50%;
  display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
.chat-msgs{flex:1;overflow-y:auto;padding:.9rem;display:flex;flex-direction:column;gap:.6rem;scroll-behavior:smooth}
.msg{max-width:82%;padding:.6rem .9rem;border-radius:13px;font-size:.86rem;line-height:1.62;animation:up .2s ease;word-break:break-word}
.msg-bot{background:var(--gd);color:var(--g1);align-self:flex-start;border-bottom-left-radius:3px}
.msg-user{background:var(--g1);color:#fff;align-self:flex-end;border-bottom-right-radius:3px}
.msg-t{font-size:.63rem;opacity:.5;margin-top:.2rem}
.chat-bar{display:flex;gap:.45rem;padding:.65rem;border-top:1.5px solid var(--border);background:#fafff9}
.chat-in{flex:1;padding:.55rem .85rem;border:1.5px solid var(--border);border-radius:9px;
  font-family:'Outfit',sans-serif;font-size:.86rem;outline:none;transition:.15s;
  background:#fff;resize:none;min-height:40px;max-height:90px}
.chat-in:focus{border-color:var(--g2);box-shadow:0 0 0 3px #16a34a12}
.tdot{width:6px;height:6px;border-radius:50%;background:var(--g2);display:inline-block;animation:bounce .9s infinite}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}

/* FORM */
.fg{display:flex;flex-direction:column;gap:.32rem;margin-bottom:.85rem}
.fl{font-size:.76rem;font-weight:600;color:var(--text)}
.fi{padding:.56rem .82rem;border:1.5px solid var(--border);border-radius:8px;
  font-family:'Outfit',sans-serif;font-size:.86rem;outline:none;transition:.15s;background:#fff;width:100%}
.fi:focus{border-color:var(--g2);box-shadow:0 0 0 3px #16a34a12}
select.fi{cursor:pointer}

/* MODAL */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:400;
  display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(3px)}
.modal{background:var(--card);border-radius:18px;padding:1.85rem;width:100%;max-width:480px;
  box-shadow:0 20px 60px #00000028;animation:up .25s ease;max-height:90vh;overflow-y:auto}
.modal-t{font-family:'Fraunces',serif;font-size:1.3rem;font-weight:900;margin-bottom:1.1rem}

/* TABS */
.tabs{display:flex;gap:.18rem;background:var(--gd);padding:.22rem;border-radius:9px;margin-bottom:1.25rem}
.tab{flex:1;padding:.44rem;border:none;background:none;border-radius:7px;cursor:pointer;
  font-family:'Outfit',sans-serif;font-size:.8rem;font-weight:500;color:var(--muted);transition:.15s}
.tab.on{background:var(--card);color:var(--g1);font-weight:700;box-shadow:0 1px 7px #16a34a16}

/* PILLS */
.pills{display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:1rem}
.pill{padding:.28rem .75rem;border-radius:99px;border:1.5px solid var(--border);background:var(--card);
  font-size:.76rem;font-weight:600;cursor:pointer;transition:.15s;color:var(--muted)}
.pill.on{background:var(--g1);color:#fff;border-color:var(--g1)}

/* TABLE */
.tbl-wrap{overflow-x:auto;border-radius:11px;border:1.5px solid var(--border)}
table{width:100%;border-collapse:collapse;font-size:.8rem}
th{background:var(--gd);color:var(--g1);font-weight:700;padding:.6rem .85rem;text-align:left;
  font-family:'Fraunces',serif;font-size:.76rem;letter-spacing:.03em;white-space:nowrap}
td{padding:.6rem .85rem;border-top:1px solid var(--border)}
tr:hover td{background:#f8fff8}

/* ALERT */
.alert{display:flex;align-items:center;gap:.6rem;padding:.65rem .95rem;border-radius:9px;margin-bottom:1rem;font-size:.82rem;font-weight:500}
.alert-g{background:var(--gd);color:var(--g1);border:1px solid #a7f3d0}
.alert-a{background:#fef3c7;color:var(--amber);border:1px solid #fde68a}
.alert-r{background:#fee2e2;color:var(--red);border:1px solid #fecaca}
.alert-sb{background:#eef2ff;color:#3730a3;border:1px solid #a5b4fc}

/* PROGRESS */
.pbar{height:6px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-top:.3rem}
.pfill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--g2),var(--g3));transition:width .8s}

/* BAR CHART */
.bar-chart{display:flex;align-items:flex-end;gap:.3rem;height:110px}
.bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:.22rem}
.bar{width:100%;border-radius:4px 4px 0 0;background:linear-gradient(180deg,var(--g3),var(--g2));min-height:4px}
.bar-l{font-size:.64rem;color:var(--muted)}
.bar-v{font-size:.65rem;font-weight:700;color:var(--g2)}

/* MISC */
.spin{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.3);
  border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;bottom:1.4rem;right:1.4rem;z-index:600;background:var(--g1);color:#fff;
  padding:.7rem 1.1rem;border-radius:10px;font-size:.86rem;font-weight:500;
  box-shadow:0 4px 22px #16a34a44;animation:up .3s ease;max-width:300px}
.ndot-dot{position:absolute;top:3px;right:3px;width:7px;height:7px;background:var(--red);
  border-radius:50%;border:1.5px solid #fff}
.npanel{position:absolute;top:44px;right:0;background:var(--card);border:1.5px solid var(--border);
  border-radius:13px;width:295px;box-shadow:var(--sh2);z-index:300;padding:.85rem}
.ni{display:flex;gap:.5rem;padding:.5rem 0;border-bottom:1px solid var(--border);font-size:.78rem;align-items:flex-start}
.ni:last-child{border-bottom:none}

@media(max-width:900px){
  .stats{grid-template-columns:repeat(2,1fr)}.g3,.g4{grid-template-columns:repeat(2,1fr)}
  .chat-side{display:none}.hero h1{font-size:1.85rem}.hero{padding:1.85rem 1.35rem}
  .sb-card{padding:2rem 1.5rem}
}
@media(max-width:600px){.g2,.g3,.g4{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}}
`;

/* ═══════════════════════ ROOT APP ═══════════════════════ */
export default function App(){
  const [page,setPage]=useState("home");
  const [user,setUser]=useState(null);
  const [showAuth,setShowAuth]=useState(false);
  const [authMode,setAuthMode]=useState("login");
  const [toast,setToast]=useState(null);
  const [showNotif,setShowNotif]=useState(false);
  const [donations,setDonations]=useState(INIT_DONATIONS);
  const [orders,setOrders]=useState([]);
  const [selRest,setSelRest]=useState(null);

  const fire=(msg)=>{setToast(msg);setTimeout(()=>setToast(null),3200);};
  const go=(p)=>{setPage(p);setShowNotif(false);setSelRest(null);};

  const NOTIFS=[
    {c:"#dc2626",t:"Karahi at Bundu Khan expires TODAY — rescue it!"},
    {c:"#d97706",t:"Prawn Masala 50% off at Kolachi now 🦐"},
    {c:"#16a34a",t:"Al-Khidmat accepted donation — pickup tomorrow 9AM"},
    {c:"#6366f1",t:"Anonymous silent gift successfully delivered ✓"},
    {c:"#dc2626",t:"Pizza at Cosa Nostra free today — donate now"},
  ];

  const gStats={
    restaurants:REAL_RESTAURANTS.length,ngos:REAL_NGOS.length,
    donations:donations.length,orders:orders.length,
    revenue:orders.reduce((s,o)=>s+(o.fee||0),0)+48200,
    meals:donations.reduce((s,d)=>s+d.qty,0)+12234,
  };

  return(
    <>
      <style>{CSS}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-logo" onClick={()=>go("home")}>🌱 Zero<em>Hunger</em></div>
        <div className="nav-links">
          {[["home","🏠 Home"],["restaurants","🍽 Restaurants"],["ngos","🤝 NGOs"],["donate","💚 Donate"],["dashboard","📊 Analytics"],["chatbot","🤖 AI Chat"]].map(([p,l])=>(
            <button key={p} className={`nb${page===p?" on":""}`} onClick={()=>go(p)}>{l}</button>
          ))}
          {/* Silent Bridge — subtle, no label that reveals purpose */}
          <button className={`nb sb-nav${page==="bridge"?" on":""}`} onClick={()=>go("bridge")} title="Private & Confidential">🌉 Silent Bridge</button>
        </div>
        <div className="nav-right">
          {user&&(
            <div style={{position:"relative"}}>
              <button className="nb" style={{position:"relative",padding:".38rem .6rem"}} onClick={()=>setShowNotif(!showNotif)}>
                🔔<span className="ndot-dot"/>
              </button>
              {showNotif&&(
                <div className="npanel">
                  <div style={{fontFamily:"Fraunces",fontWeight:700,fontSize:".86rem",marginBottom:".6rem"}}>Notifications</div>
                  {NOTIFS.map((n,i)=>(
                    <div key={i} className="ni">
                      <span style={{width:7,height:7,borderRadius:"50%",background:n.c,marginTop:4,flexShrink:0,display:"block"}}/>
                      <span>{n.t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {user?(
            <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
              <span className="badge bg-g" style={{fontSize:".7rem"}}>👤 {user.name}</span>
              <button className="nb" onClick={()=>{setUser(null);fire("Logged out 👋")}}>Logout</button>
            </div>
          ):(
            <button className="nb cta" onClick={()=>{setShowAuth(true);setAuthMode("login")}}>Sign In</button>
          )}
        </div>
      </nav>

      <main>
        {page==="home"        && <HomePage go={go} stats={gStats} user={user} setShowAuth={setShowAuth} setAuthMode={setAuthMode}/>}
        {page==="restaurants" && <RestaurantsPage go={go} fire={fire} user={user} setShowAuth={setShowAuth} orders={orders} setOrders={setOrders} selRest={selRest} setSelRest={setSelRest} donations={donations} setDonations={setDonations}/>}
        {page==="ngos"        && <NGOsPage fire={fire} donations={donations} setDonations={setDonations} user={user} setShowAuth={setShowAuth}/>}
        {page==="donate"      && <DonatePage fire={fire} donations={donations} setDonations={setDonations} user={user} setShowAuth={setShowAuth}/>}
        {page==="dashboard"   && <DashboardPage stats={gStats} donations={donations} orders={orders}/>}
        {page==="chatbot"     && <ChatbotPage user={user} go={go}/>}
        {page==="bridge"      && <SilentBridgePage fire={fire}/>}
      </main>

      {showAuth && <AuthModal mode={authMode} setMode={setAuthMode} onClose={()=>setShowAuth(false)} onAuth={(u)=>{setUser(u);setShowAuth(false);fire(`Welcome, ${u.name}! 🌱`);}}/>}
      {toast    && <div className="toast">{toast}</div>}
    </>
  );
}

/* ═══════════════════════ HOME ═══════════════════════════ */
function HomePage({go,stats,user,setShowAuth,setAuthMode}){
  const urgent=REAL_RESTAURANTS.flatMap(r=>r.foods.map(f=>({...f,restaurant:r.name}))).filter(f=>getExpiry(f.expiry).free).slice(0,3);
  return(
    <div className="page">
      <div className="hero">
        <h1>Rescue Food.<br/><i>Feed Pakistan.</i> 🌍</h1>
        <p>AI-powered platform connecting restaurants with NGOs and communities — turning waste into meals, one dish at a time.</p>
        <div className="hbtns">
          <button className="btn btn-w"  onClick={()=>go("restaurants")}>🍽 Browse Food</button>
          <button className="btn btn-ol" onClick={()=>go("donate")}>💚 Donate</button>
          <button className="btn btn-ol" onClick={()=>go("chatbot")}>🤖 AI Chat</button>
          {!user&&<button className="btn btn-ol" onClick={()=>{setShowAuth(true);setAuthMode("signup")}}>Join Free →</button>}
        </div>
      </div>

      <div className="stats">
        {[{i:"🍽",v:stats.meals.toLocaleString(),l:"Meals Saved",d:"+124 today"},{i:"🏪",v:stats.restaurants,l:"Restaurants",d:"6 cities"},{i:"🤝",v:stats.ngos,l:"NGO Partners",d:"Verified"},{i:"📦",v:stats.donations,l:"Donations",d:"This month"},{i:"💰",v:`₨${(stats.revenue/1000).toFixed(0)}K`,l:"Revenue",d:"+18% this week"}].map((s,i)=>(
          <div key={i} className="sc"><div className="sc-i">{s.i}</div><div className="sc-v">{s.v}</div><div className="sc-l">{s.l}</div><div className="sc-d">↑ {s.d}</div></div>
        ))}
      </div>

      {/* Silent Bridge quiet hint — understated, for those who notice */}
      <div className="sb-hint" onClick={()=>go("bridge")} style={{marginBottom:"1.4rem"}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#312e81,#4338ca)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0}}>🌉</div>
        <div>
          <div style={{fontFamily:"Fraunces",fontWeight:700,fontSize:".92rem",color:"#3730a3"}}>Silent Bridge — Private & Anonymous</div>
          <div style={{fontSize:".78rem",color:"#6366f1",marginTop:".15rem"}}>Give or receive food help with complete privacy. No one will know. Zero Hunger acts as a trusted middleman.</div>
        </div>
        <div style={{marginLeft:"auto",color:"#6366f1",fontSize:"1.1rem",flexShrink:0}}>→</div>
      </div>

      {urgent.length>0&&(
        <>
          <div className="alert alert-r">🚨 <strong>{urgent.length} items</strong> expire today — FREE for donation!</div>
          <div className="sh"><div className="sh-t">🔥 Free Donations Available Now</div><button className="btn btn-gh btn-sm" onClick={()=>go("restaurants")}>See all →</button></div>
          <div className="g3" style={{marginBottom:"1.5rem"}}>
            {urgent.map(f=>(
              <div key={f.id} className="card ch" onClick={()=>go("restaurants")}>
                <div style={{display:"flex",gap:".65rem",alignItems:"center",marginBottom:".65rem"}}>
                  <div style={{width:44,height:44,borderRadius:10,background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem"}}>{f.img}</div>
                  <div><div style={{fontWeight:700,fontSize:".9rem"}}>{f.name}</div><div style={{fontSize:".72rem",color:"var(--muted)"}}>📍 {f.restaurant}</div></div>
                  <span className="badge bg-r" style={{marginLeft:"auto"}}>FREE</span>
                </div>
                <div style={{fontSize:".76rem",color:"var(--muted)"}}>📦 {f.qty} units · Expires {f.expiry}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="sh"><div className="sh-t">🏪 Partner Restaurants</div><button className="btn btn-gh btn-sm" onClick={()=>go("restaurants")}>View all →</button></div>
      <div className="g3" style={{marginBottom:"1.5rem"}}>
        {REAL_RESTAURANTS.slice(0,3).map(r=>(
          <div key={r.id} className="card ch" onClick={()=>go("restaurants")}>
            <div style={{display:"flex",gap:".65rem",alignItems:"center",marginBottom:".6rem"}}>
              <div className="rlogo">{r.logo}</div>
              <div><div style={{fontFamily:"Fraunces",fontWeight:700,fontSize:".95rem"}}>{r.name}</div><div style={{fontSize:".72rem",color:"var(--muted)"}}>{r.cuisine} · {r.area}</div></div>
            </div>
            <div style={{display:"flex",gap:".35rem",flexWrap:"wrap"}}>
              <span className="badge bg-g">⭐ {r.rating}</span>
              <span className="badge bg-sk">{r.foods.length} items</span>
              <span className="badge bg-r">{r.foods.filter(f=>getExpiry(f.expiry).free).length} free</span>
            </div>
          </div>
        ))}
      </div>

      <div className="sh"><div className="sh-t">🤝 NGO Network</div><button className="btn btn-gh btn-sm" onClick={()=>go("ngos")}>View all →</button></div>
      <div className="g4">
        {REAL_NGOS.slice(0,4).map(n=>(
          <div key={n.id} className="card" style={{padding:"1rem"}}>
            <div style={{display:"flex",gap:".45rem",alignItems:"center",marginBottom:".4rem"}}>
              <span style={{fontSize:"1.3rem"}}>{n.logo}</span>
              <div style={{fontWeight:700,fontSize:".82rem",flex:1}}>{n.name}</div>
              {n.urgent&&<span className="badge bg-r" style={{fontSize:".62rem"}}>URGENT</span>}
            </div>
            <div style={{fontSize:".72rem",color:"var(--muted)"}}>{n.city}</div>
            <div style={{fontSize:".72rem",color:"var(--g2)",fontWeight:600,marginTop:".25rem"}}>{n.served.toLocaleString()} served</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ SILENT BRIDGE PAGE ═════════════ */
/*
  This feature allows:
  1. A donor to give food/money anonymously — their identity never revealed
  2. A recipient to request food help privately — their identity never revealed
  Zero Hunger acts as the trusted middleman center.
  Neither party ever knows who the other is.
*/
function SilentBridgePage({fire}){
  const [mode,setMode]=useState(null); // null | "give" | "receive"
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({city:"",area:"",need:"",qty:"",time:"",notes:"",foodType:"",phone:""});
  const [donForm,setDonForm]=useState({city:"",area:"",foodType:"",qty:"",time:"",notes:""});
  const [done,setDone]=useState(false);
  const [caseId]=useState(()=>"ZH-"+Math.random().toString(36).slice(2,8).toUpperCase());

  // Floating stars background
  const stars=Array.from({length:22},(_,i)=>({
    left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,
    size:`${1+Math.random()*2}px`,delay:`${Math.random()*4}s`,dur:`${2+Math.random()*3}s`
  }));

  const CITIES=["Lahore","Karachi","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta"];
  const FOOD_TYPES=["Cooked meals (rice/curry)","Bread / Roti","Bakery items","Raw groceries","Dry ration","Fruits & vegetables","Any food"];

  const submitReceive=()=>{
    setDone(true);
    fire("Your request has been received — we will connect you privately 🌉");
  };
  const submitGive=()=>{
    setDone(true);
    fire("Your silent donation has been registered — we will arrange delivery 💙");
  };

  if(done){
    return(
      <div className="sb-page">
        {stars.map((s,i)=><div key={i} className="sb-star" style={{left:s.left,top:s.top,width:s.size,height:s.size,animationDelay:s.delay,animationDuration:s.dur}}/>)}
        <div className="sb-card" style={{textAlign:"center"}}>
          <div className="sb-success">
            <div className="sb-success-ring">✓</div>
            <div style={{fontFamily:"Fraunces",fontSize:"1.6rem",fontWeight:900,color:"#fff",marginBottom:".5rem"}}>
              {mode==="give"?"Your Gift is On Its Way":"Help Is Coming"}
            </div>
            <div style={{color:"rgba(255,255,255,.6)",fontSize:".88rem",lineHeight:1.7,marginBottom:"1.5rem"}}>
              {mode==="give"
                ?"Your anonymous donation has been received. Zero Hunger will coordinate delivery — the recipient will never know who you are."
                :"Your private request is registered. A Zero Hunger coordinator will arrange food delivery quietly. No one will know."}
            </div>
            <div style={{background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:12,padding:"1rem",marginBottom:"1.5rem"}}>
              <div style={{fontSize:".72rem",color:"rgba(255,255,255,.4)",marginBottom:".3rem"}}>Your private case reference</div>
              <div style={{fontFamily:"Fraunces",fontSize:"1.3rem",fontWeight:900,color:"#a5b4fc",letterSpacing:"0.08em"}}>{caseId}</div>
              <div style={{fontSize:".7rem",color:"rgba(255,255,255,.35)",marginTop:".3rem"}}>Save this if needed — no names attached</div>
            </div>
            <div style={{background:"rgba(22,163,74,.12)",border:"1px solid rgba(22,163,74,.25)",borderRadius:10,padding:".85rem",fontSize:".78rem",color:"rgba(255,255,255,.55)",lineHeight:1.6,marginBottom:"1.5rem"}}>
              🔒 Your identity is fully protected. This request is encrypted, visible only to Zero Hunger coordinators, and deleted after resolution.
            </div>
            <button className="btn btn-sb" style={{width:"100%"}} onClick={()=>{setDone(false);setMode(null);setStep(1);setForm({city:"",area:"",need:"",qty:"",time:"",notes:"",foodType:"",phone:""});setDonForm({city:"",area:"",foodType:"",qty:"",time:"",notes:""});}}>
              ← Back to Silent Bridge
            </button>
          </div>
        </div>
      </div>
    );
  }

  if(!mode){
    return(
      <div className="sb-page">
        {stars.map((s,i)=><div key={i} className="sb-star" style={{left:s.left,top:s.top,width:s.size,height:s.size,animationDelay:s.delay,animationDuration:s.dur}}/>)}
        <div className="sb-card">
          <div className="sb-logo">🌉</div>
          <div className="sb-title">Silent Bridge</div>
          <div className="sb-sub">
            A completely private channel for dignified giving and receiving.<br/>
            <strong style={{color:"rgba(255,255,255,.75)"}}>No one will ever know who you are.</strong><br/>
            Zero Hunger acts as the trusted confidential middleman.
          </div>

          <div className="sb-privacy">
            <span className="sb-privacy-icon">🔒</span>
            <span>Both sides remain anonymous forever. No names, no photos, no public records. Zero Hunger coordinates everything in the middle — silently.</span>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:".85rem",marginBottom:"1.75rem"}}>
            <button className="btn btn-sb" style={{width:"100%",padding:"1rem",fontSize:".95rem",justifyContent:"flex-start",gap:"1rem"}} onClick={()=>{setMode("give");setStep(1);}}>
              <span style={{fontSize:"1.4rem"}}>🤲</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontWeight:700,marginBottom:".2rem"}}>I Want to Give — Silently</div>
                <div style={{fontSize:".76rem",opacity:.7,fontWeight:400}}>Donate food or meals to someone in need. Your identity stays hidden forever.</div>
              </div>
            </button>
            <button className="btn btn-sb-ghost" style={{width:"100%",padding:"1rem",fontSize:".95rem",justifyContent:"flex-start",gap:"1rem",border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.8)"}} onClick={()=>{setMode("receive");setStep(1);}}>
              <span style={{fontSize:"1.4rem"}}>🙏</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontWeight:700,marginBottom:".2rem"}}>I Need Help — Privately</div>
                <div style={{fontSize:".76rem",opacity:.6,fontWeight:400}}>Request food assistance. No one in your community will know. Only a coordinator contacts you.</div>
              </div>
            </button>
          </div>

          <div style={{borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:"1.1rem",display:"flex",flexDirection:"column",gap:".45rem"}}>
            {["Your identity is never shared with the other party","Zero Hunger is the only middleman — no NGO worker visits your address publicly","Food is delivered in plain packaging with no labels","All data is encrypted and deleted after delivery","This feature does not appear in any public dashboard"].map((t,i)=>(
              <div key={i} style={{display:"flex",gap:".55rem",fontSize:".76rem",color:"rgba(255,255,255,.45)",alignItems:"flex-start"}}>
                <span style={{color:"#6366f1",marginTop:1}}>✓</span><span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── GIVE FLOW ── */
  if(mode==="give"){
    const steps=["Your Location","Food Details","Confirm"];
    return(
      <div className="sb-page">
        {stars.map((s,i)=><div key={i} className="sb-star" style={{left:s.left,top:s.top,width:s.size,height:s.size,animationDelay:s.delay,animationDuration:s.dur}}/>)}
        <div className="sb-card">
          <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1.5rem"}}>
            <button onClick={()=>step===1?setMode(null):setStep(s=>s-1)} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.6)",borderRadius:8,padding:".35rem .7rem",cursor:"pointer",fontSize:".82rem"}}>← Back</button>
            <div style={{fontFamily:"Fraunces",fontWeight:700,color:"#fff",fontSize:"1.05rem",flex:1}}>🤲 Silent Giving</div>
            <span style={{fontSize:".72rem",color:"rgba(255,255,255,.35)"}}>Step {step}/3</span>
          </div>

          <div className="sb-steps">
            {steps.map((l,i)=>(
              <div key={i} className="sb-step">
                <div className={`sb-step-dot ${i+1<step?"done":i+1===step?"active":"idle"}`}>{i+1<step?"✓":i+1}</div>
                <div className={`sb-step-label ${i+1===step?"active":""}`}>{l}</div>
              </div>
            ))}
          </div>

          {step===1&&(
            <>
              <div className="sb-field">
                <label className="sb-label">Your City</label>
                <select className="sb-input" value={donForm.city} onChange={e=>setDonForm({...donForm,city:e.target.value})}>
                  <option value="">Select city...</option>
                  {CITIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="sb-field">
                <label className="sb-label">Area / Neighbourhood (optional)</label>
                <input className="sb-input" placeholder="e.g. DHA, Gulberg..." value={donForm.area} onChange={e=>setDonForm({...donForm,area:e.target.value})}/>
              </div>
              <div className="sb-privacy">
                <span className="sb-privacy-icon">🔒</span>
                <span>We only need your city to find a recipient nearby. Your exact address is never stored or shared.</span>
              </div>
              <button className="btn btn-sb" style={{width:"100%"}} disabled={!donForm.city} onClick={()=>setStep(2)}>Continue →</button>
            </>
          )}
          {step===2&&(
            <>
              <div className="sb-field">
                <label className="sb-label">Type of Food</label>
                <select className="sb-input" value={donForm.foodType} onChange={e=>setDonForm({...donForm,foodType:e.target.value})}>
                  <option value="">Select type...</option>
                  {FOOD_TYPES.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="sb-field">
                <label className="sb-label">Quantity / Servings</label>
                <input className="sb-input" placeholder="e.g. 4 people, 2kg, 10 pieces..." value={donForm.qty} onChange={e=>setDonForm({...donForm,qty:e.target.value})}/>
              </div>
              <div className="sb-field">
                <label className="sb-label">Preferred Pickup / Delivery Time</label>
                <input className="sb-input" placeholder="e.g. Today after 6pm, tomorrow morning..." value={donForm.time} onChange={e=>setDonForm({...donForm,time:e.target.value})}/>
              </div>
              <div className="sb-field">
                <label className="sb-label">Any notes for coordinator (optional)</label>
                <textarea className="sb-input" placeholder="Allergens, special handling, location hints..." value={donForm.notes} onChange={e=>setDonForm({...donForm,notes:e.target.value})}/>
              </div>
              <button className="btn btn-sb" style={{width:"100%"}} disabled={!donForm.foodType||!donForm.qty} onClick={()=>setStep(3)}>Continue →</button>
            </>
          )}
          {step===3&&(
            <>
              <div style={{background:"rgba(255,255,255,.05)",borderRadius:12,padding:"1rem",marginBottom:"1.25rem"}}>
                <div style={{fontSize:".72rem",color:"rgba(255,255,255,.4)",marginBottom:".75rem",fontWeight:600,letterSpacing:".06em"}}>DONATION SUMMARY</div>
                {[["City",donForm.city],["Area",donForm.area||"—"],["Food Type",donForm.foodType],["Quantity",donForm.qty],["Time",donForm.time||"Flexible"]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",padding:".35rem 0",borderBottom:"1px solid rgba(255,255,255,.06)",fontSize:".82rem"}}>
                    <span style={{color:"rgba(255,255,255,.4)"}}>{k}</span>
                    <span style={{color:"rgba(255,255,255,.8)",fontWeight:500}}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="sb-privacy" style={{marginBottom:"1.25rem"}}>
                <span className="sb-privacy-icon">🌉</span>
                <span>Zero Hunger will match your donation to a recipient in your city. <strong style={{color:"rgba(255,255,255,.8)"}}>You will never know who receives it</strong> — and they will never know who gave it.</span>
              </div>
              <button className="btn btn-sb" style={{width:"100%",padding:".9rem"}} onClick={submitGive}>
                🤲 Submit Silent Donation
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ── RECEIVE FLOW ── */
  const steps=["Your Location","What You Need","Confirm"];
  return(
    <div className="sb-page">
      {stars.map((s,i)=><div key={i} className="sb-star" style={{left:s.left,top:s.top,width:s.size,height:s.size,animationDelay:s.delay,animationDuration:s.dur}}/>)}
      <div className="sb-card">
        <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1.5rem"}}>
          <button onClick={()=>step===1?setMode(null):setStep(s=>s-1)} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.6)",borderRadius:8,padding:".35rem .7rem",cursor:"pointer",fontSize:".82rem"}}>← Back</button>
          <div style={{fontFamily:"Fraunces",fontWeight:700,color:"#fff",fontSize:"1.05rem",flex:1}}>🙏 Private Request</div>
          <span style={{fontSize:".72rem",color:"rgba(255,255,255,.35)"}}>Step {step}/3</span>
        </div>

        <div className="sb-steps">
          {steps.map((l,i)=>(
            <div key={i} className="sb-step">
              <div className={`sb-step-dot ${i+1<step?"done":i+1===step?"active":"idle"}`}>{i+1<step?"✓":i+1}</div>
              <div className={`sb-step-label ${i+1===step?"active":""}`}>{l}</div>
            </div>
          ))}
        </div>

        {step===1&&(
          <>
            <div style={{background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.2)",borderRadius:10,padding:".85rem",marginBottom:"1.1rem",fontSize:".8rem",color:"rgba(255,255,255,.65)",lineHeight:1.65}}>
              🙏 You are not alone. Many dignified people face difficult times. This is a completely private channel — <strong style={{color:"rgba(255,255,255,.85)"}}>no one in your community, family, or social circle will ever know you used this.</strong>
            </div>
            <div className="sb-field">
              <label className="sb-label">Your City</label>
              <select className="sb-input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}>
                <option value="">Select city...</option>
                {CITIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="sb-field">
              <label className="sb-label">General Area (helps us reach you discreetly)</label>
              <input className="sb-input" placeholder="e.g. Model Town, Clifton, F-7..." value={form.area} onChange={e=>setForm({...form,area:e.target.value})}/>
            </div>
            <div className="sb-field">
              <label className="sb-label">A way for our coordinator to contact you privately</label>
              <input className="sb-input" placeholder="WhatsApp or phone (only coordinator sees this)" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
            </div>
            <div className="sb-privacy">
              <span className="sb-privacy-icon">🔒</span>
              <span>Your contact info is only seen by one Zero Hunger coordinator. It is never shared with donors, NGOs, or public records.</span>
            </div>
            <button className="btn btn-sb" style={{width:"100%"}} disabled={!form.city||!form.phone} onClick={()=>setStep(2)}>Continue →</button>
          </>
        )}
        {step===2&&(
          <>
            <div className="sb-field">
              <label className="sb-label">What kind of food help do you need?</label>
              <select className="sb-input" value={form.foodType} onChange={e=>setForm({...form,foodType:e.target.value})}>
                <option value="">Select type...</option>
                {FOOD_TYPES.map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="sb-field">
              <label className="sb-label">For how many people / how much?</label>
              <input className="sb-input" placeholder="e.g. Family of 4, 2–3 meals..." value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/>
            </div>
            <div className="sb-field">
              <label className="sb-label">Best time for a quiet delivery</label>
              <input className="sb-input" placeholder="e.g. Evenings after 7pm, weekday mornings..." value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/>
            </div>
            <div className="sb-field">
              <label className="sb-label">Any notes (optional — dietary needs, building access, etc.)</label>
              <textarea className="sb-input" placeholder="Keep it brief. No personal details needed." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
            </div>
            <button className="btn btn-sb" style={{width:"100%"}} disabled={!form.foodType||!form.qty} onClick={()=>setStep(3)}>Continue →</button>
          </>
        )}
        {step===3&&(
          <>
            <div style={{background:"rgba(255,255,255,.05)",borderRadius:12,padding:"1rem",marginBottom:"1.25rem"}}>
              <div style={{fontSize:".72rem",color:"rgba(255,255,255,.4)",marginBottom:".75rem",fontWeight:600,letterSpacing:".06em"}}>REQUEST SUMMARY</div>
              {[["City",form.city],["Area",form.area||"—"],["Need",form.foodType],["For",form.qty],["Delivery",form.time||"Flexible"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:".35rem 0",borderBottom:"1px solid rgba(255,255,255,.06)",fontSize:".82rem"}}>
                  <span style={{color:"rgba(255,255,255,.4)"}}>{k}</span>
                  <span style={{color:"rgba(255,255,255,.8)",fontWeight:500}}>{v}</span>
                </div>
              ))}
            </div>
            <div className="sb-privacy" style={{marginBottom:"1.25rem"}}>
              <span className="sb-privacy-icon">🌉</span>
              <span>A Zero Hunger coordinator will contact you on the number provided to arrange a <strong style={{color:"rgba(255,255,255,.8)"}}>quiet, plain-packaged delivery</strong>. The donor will never know your identity.</span>
            </div>
            <button className="btn btn-sb" style={{width:"100%",padding:".9rem"}} onClick={submitReceive}>
              🙏 Submit Private Request
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ RESTAURANTS ════════════════════ */
function RestaurantsPage({go,fire,user,setShowAuth,orders,setOrders,selRest,setSelRest,donations,setDonations}){
  const [cityF,setCityF]=useState("All");
  const cities=["All",...new Set(REAL_RESTAURANTS.map(r=>r.city))];
  const vis=cityF==="All"?REAL_RESTAURANTS:REAL_RESTAURANTS.filter(r=>r.city===cityF);

  if(selRest){
    const r=REAL_RESTAURANTS.find(x=>x.id===selRest);
    return <RestDetail r={r} onBack={()=>setSelRest(null)} fire={fire} user={user} setShowAuth={setShowAuth} orders={orders} setOrders={setOrders} donations={donations} setDonations={setDonations}/>;
  }

  return(
    <div className="page">
      <div className="sh"><div><div className="sh-t">🍽 All Restaurants</div><div style={{fontSize:".78rem",color:"var(--muted)",marginTop:".12rem"}}>{vis.length} restaurants — click to view their menu</div></div></div>
      <div className="pills">{cities.map(c=><button key={c} className={`pill${cityF===c?" on":""}`} onClick={()=>setCityF(c)}>{c}</button>)}</div>
      <div className="g2">
        {vis.map(r=>{
          const fc=r.foods.filter(f=>getExpiry(f.expiry).free).length;
          const dc=r.foods.filter(f=>getExpiry(f.expiry).disc===50).length;
          return(
            <div key={r.id} className="rcard">
              <div className="rcard-h">
                <div className="rlogo">{r.logo}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Fraunces",fontWeight:700,fontSize:".95rem"}}>{r.name}</div>
                  <div style={{fontSize:".72rem",color:"var(--muted)",marginTop:".1rem"}}>🍴 {r.cuisine} · 📍 {r.area}, {r.city}</div>
                  <div style={{marginTop:".28rem",display:"flex",gap:".28rem",flexWrap:"wrap"}}>
                    <span className="badge bg-g">⭐ {r.rating}</span>
                    {fc>0&&<span className="badge bg-r">{fc} free</span>}
                    {dc>0&&<span className="badge bg-a">{dc} discounted</span>}
                  </div>
                </div>
                <button className="btn btn-g1 btn-sm" onClick={()=>setSelRest(r.id)}>View Menu →</button>
              </div>
              <div style={{padding:".85rem 1.1rem"}}>
                {r.foods.slice(0,3).map(f=>{
                  const ex=getExpiry(f.expiry);
                  const fp=ex.free?0:Math.round(f.price*(1-ex.disc/100));
                  return(
                    <div key={f.id} className="food-row" onClick={()=>setSelRest(r.id)}>
                      <div className="ficon" style={{background:ex.bg}}>{f.img}</div>
                      <div style={{flex:1}}><div style={{fontWeight:600,fontSize:".83rem"}}>{f.name}</div><div style={{fontSize:".7rem",color:"var(--muted)"}}>📦 {f.qty} · exp {f.expiry}</div></div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"Fraunces",fontWeight:700,fontSize:".9rem",color:ex.color}}>{ex.free?"FREE":`₨${fp}`}</div>
                        <span className="badge" style={{background:ex.bg,color:ex.color,fontSize:".6rem"}}>{ex.badge}</span>
                      </div>
                    </div>
                  );
                })}
                {r.foods.length>3&&<div style={{fontSize:".73rem",color:"var(--g2)",fontWeight:600,textAlign:"center",paddingTop:".45rem",cursor:"pointer"}} onClick={()=>setSelRest(r.id)}>+{r.foods.length-3} more items →</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RestDetail({r,onBack,fire,user,setShowAuth,orders,setOrders,donations,setDonations}){
  const [buyM,setBuyM]=useState(null);
  const [donM,setDonM]=useState(null);
  const myDons=donations.filter(d=>d.restaurant===r.name);
  return(
    <div className="page">
      <button className="btn btn-gh btn-sm" onClick={onBack} style={{marginBottom:"1rem"}}>← Back</button>
      <div className="card" style={{marginBottom:"1.25rem",padding:"1.35rem"}}>
        <div style={{display:"flex",gap:".9rem",alignItems:"flex-start"}}>
          <div style={{width:58,height:58,borderRadius:14,background:"var(--gd)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",flexShrink:0}}>{r.logo}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Fraunces",fontSize:"1.35rem",fontWeight:900}}>{r.name}</div>
            <div style={{color:"var(--muted)",fontSize:".82rem",marginTop:".18rem"}}>🍴 {r.cuisine} · 📍 {r.area}, {r.city} · 📞 {r.contact}</div>
            <div style={{display:"flex",gap:".35rem",marginTop:".45rem",flexWrap:"wrap"}}>
              <span className="badge bg-g">⭐ {r.rating}</span>
              <span className="badge bg-sk">👤 {r.owner}</span>
              <span className="badge bg-b">📅 Since {r.joined}</span>
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontFamily:"Fraunces",fontSize:"1.4rem",fontWeight:900,color:"var(--g1)"}}>₨{(r.revenue/1000).toFixed(0)}K</div>
            <div style={{fontSize:".7rem",color:"var(--muted)"}}>Revenue</div>
            <div style={{fontFamily:"Fraunces",fontSize:"1.05rem",fontWeight:700,color:"var(--g2)",marginTop:".25rem"}}>{r.orders.toLocaleString()}</div>
            <div style={{fontSize:".7rem",color:"var(--muted)"}}>Orders</div>
          </div>
        </div>
      </div>
      <div className="sh"><div className="sh-t">🍽 Menu</div><span className="badge bg-g">{r.foods.length} items</span></div>
      <div className="g2" style={{marginBottom:"1.4rem"}}>
        {r.foods.map(f=>{
          const ex=getExpiry(f.expiry);
          const fp=ex.free?0:Math.round(f.price*(1-ex.disc/100));
          return(
            <div key={f.id} className="card" style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:".9rem 1rem",display:"flex",gap:".7rem",alignItems:"center",borderBottom:"1px solid var(--border)"}}>
                <div style={{width:50,height:50,borderRadius:12,background:ex.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.65rem",flexShrink:0}}>{f.img}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:".92rem"}}>{f.name}</div>
                  <div style={{fontSize:".72rem",color:"var(--muted)",marginTop:".1rem"}}>📦 {f.qty} {f.unit}s · 📅 Exp {f.expiry}</div>
                </div>
                <span className="badge" style={{background:ex.bg,color:ex.color}}>{ex.badge}</span>
              </div>
              <div style={{padding:".8rem 1rem",display:"flex",alignItems:"center",gap:".7rem"}}>
                <div style={{flex:1}}>
                  {ex.free?<div style={{fontFamily:"Fraunces",fontSize:"1.15rem",fontWeight:900,color:"var(--red)"}}>FREE 🎁</div>:(
                    <div style={{display:"flex",alignItems:"baseline",gap:".35rem"}}>
                      <div style={{fontFamily:"Fraunces",fontSize:"1.15rem",fontWeight:900,color:ex.color}}>₨{fp}</div>
                      {ex.disc>0&&<div style={{fontSize:".78rem",textDecoration:"line-through",color:"var(--muted)"}}>₨{f.price}</div>}
                    </div>
                  )}
                  <div style={{fontSize:".7rem",color:"var(--muted)",marginTop:".12rem"}}>{ex.label}</div>
                </div>
                <div style={{display:"flex",gap:".35rem"}}>
                  {ex.free?(
                    <button className="btn btn-g btn-sm" onClick={()=>{if(!user){setShowAuth(true);return;}setDonM(f);}}>💚 Donate</button>
                  ):(
                    <>
                      <button className="btn btn-g1 btn-sm" onClick={()=>{if(!user){setShowAuth(true);return;}setBuyM(f);}}>🛒 Buy</button>
                      <button className="btn btn-gh btn-sm" onClick={()=>{if(!user){setShowAuth(true);return;}setDonM(f);}}>💚</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {myDons.length>0&&(
        <>
          <div className="sh"><div className="sh-t">📦 Donation Log</div></div>
          <div className="tbl-wrap" style={{marginBottom:"1rem"}}>
            <table><thead><tr><th>Food</th><th>NGO</th><th>Qty</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{myDons.map(d=>(
              <tr key={d.id}><td>{d.food}</td><td>{d.ngo}</td><td>{d.qty}</td><td>{d.date}</td>
              <td><span className={`badge ${d.status==="completed"?"bg-g":d.status==="in-transit"?"bg-sk":"bg-a"}`}>{d.status}</span></td></tr>
            ))}</tbody></table>
          </div>
        </>
      )}
      {buyM&&<BuyModal item={buyM} restaurant={r.name} onConfirm={(item,qty)=>{
        const ex=getExpiry(item.expiry);const price=ex.free?0:Math.round(item.price*(1-ex.disc/100));
        const total=price*qty;const fee=Math.round(total*0.05);
        setOrders(o=>[...o,{id:Date.now(),food:item.name,restaurant:r.name,qty,price,total,fee,date:d(0),status:"confirmed"}]);
        fire(`✅ Ordered ${qty}× ${item.name} — ₨${total+fee}`);setBuyM(null);
      }} onClose={()=>setBuyM(null)}/>}
      {donM&&<DonateModal item={donM} onConfirm={(item,ngo)=>{
        setDonations(dn=>[...dn,{id:Date.now(),food:item.name,restaurant:r.name,ngo,qty:item.qty,date:d(0),status:"pending",value:0}]);
        fire(`💚 Donation sent to ${ngo}!`);setDonM(null);
      }} onClose={()=>setDonM(null)}/>}
    </div>
  );
}

function BuyModal({item,restaurant,onConfirm,onClose}){
  const [qty,setQty]=useState(1);
  const ex=getExpiry(item.expiry);
  const price=ex.free?0:Math.round(item.price*(1-ex.disc/100));
  const total=price*qty;const fee=Math.round(total*0.05);
  return(
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-t">🛒 Place Order</div>
        <div style={{display:"flex",gap:".65rem",alignItems:"center",padding:".75rem",background:"var(--gd)",borderRadius:10,marginBottom:"1rem"}}>
          <span style={{fontSize:"1.75rem"}}>{item.img}</span>
          <div><div style={{fontWeight:700}}>{item.name}</div><div style={{fontSize:".76rem",color:"var(--muted)"}}>@ {restaurant}</div></div>
          <span className="badge" style={{background:ex.bg,color:ex.color,marginLeft:"auto"}}>{ex.badge}</span>
        </div>
        <div className="fg"><label className="fl">Quantity (max {item.qty})</label>
          <input className="fi" type="number" min={1} max={item.qty} value={qty} onChange={e=>setQty(Math.max(1,Math.min(item.qty,+e.target.value)))}/>
        </div>
        <div style={{background:"var(--gb)",borderRadius:9,padding:".8rem",marginBottom:"1rem",fontSize:".83rem"}}>
          {[["Price",`₨${price}`],["Qty","×"+qty],["Subtotal",`₨${total}`],["Platform fee (5%)",`₨${fee}`]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:".22rem 0"}}><span style={{color:"var(--muted)"}}>{k}</span><span>{v}</span></div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,borderTop:"1px solid var(--border)",paddingTop:".45rem",marginTop:".3rem"}}><span>Total</span><span style={{color:"var(--g1)"}}>₨{total+fee}</span></div>
        </div>
        <div style={{display:"flex",gap:".55rem"}}>
          <button className="btn btn-g1" style={{flex:1}} onClick={()=>onConfirm(item,qty)}>✅ Confirm</button>
          <button className="btn btn-gh" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DonateModal({item,onConfirm,onClose}){
  const [ngo,setNgo]=useState(REAL_NGOS[0].name);
  return(
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-t">💚 Donate Food</div>
        <div style={{display:"flex",gap:".65rem",alignItems:"center",padding:".75rem",background:"var(--gd)",borderRadius:10,marginBottom:"1rem"}}>
          <span style={{fontSize:"1.75rem"}}>{item.img}</span>
          <div><div style={{fontWeight:700}}>{item.name}</div><div style={{fontSize:".76rem",color:"var(--muted)"}}>📦 {item.qty} units</div></div>
        </div>
        <div className="fg"><label className="fl">Select NGO</label>
          <select className="fi" value={ngo} onChange={e=>setNgo(e.target.value)}>
            {REAL_NGOS.map(n=><option key={n.id} value={n.name}>{n.name} — {n.city}</option>)}
          </select>
        </div>
        <div className="alert alert-g" style={{marginBottom:"1rem"}}>🤖 AI recommends: <strong>Saylani Welfare Trust</strong> — highest urgency today</div>
        <div style={{display:"flex",gap:".55rem"}}>
          <button className="btn btn-g" style={{flex:1}} onClick={()=>onConfirm(item,ngo)}>💚 Send Donation</button>
          <button className="btn btn-gh" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ NGOs ═══════════════════════════ */
function NGOsPage({fire,donations,setDonations,user,setShowAuth}){
  const [cityF,setCityF]=useState("All");
  const cities=["All",...new Set(REAL_NGOS.map(n=>n.city))];
  const vis=cityF==="All"?REAL_NGOS:REAL_NGOS.filter(n=>n.city===cityF);
  return(
    <div className="page">
      <div className="sh">
        <div><div className="sh-t">🤝 NGO Network</div><div style={{fontSize:".78rem",color:"var(--muted)"}}>Real verified NGOs across Pakistan</div></div>
        <button className="btn btn-g1 btn-sm" onClick={()=>fire("NGO registration — contact admin!")}>+ Register NGO</button>
      </div>
      <div className="alert alert-r">🚨 <strong>{REAL_NGOS.filter(n=>n.urgent).length} NGOs</strong> have urgent food requirements today.</div>
      <div className="pills">{cities.map(c=><button key={c} className={`pill${cityF===c?" on":""}`} onClick={()=>setCityF(c)}>{c}</button>)}</div>
      <div className="g3" style={{marginBottom:"1.5rem"}}>
        {vis.map(n=>(
          <div key={n.id} className="ncard">
            <div style={{height:3,background:n.urgent?"var(--red)":"var(--g2)"}}/>
            <div style={{padding:"1rem 1.1rem",display:"flex",gap:".7rem",alignItems:"flex-start"}}>
              <div className="nlogo">{n.logo}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Fraunces",fontWeight:700,fontSize:".93rem",display:"flex",alignItems:"center",gap:".35rem",flexWrap:"wrap"}}>
                  {n.name}{n.urgent&&<span className="badge bg-r" style={{fontSize:".6rem"}}>URGENT</span>}{n.verified&&<span style={{color:"var(--g2)"}}>✓</span>}
                </div>
                <div style={{fontSize:".72rem",color:"var(--muted)",marginTop:".12rem"}}>📍 {n.area}, {n.city} · 📞 {n.contact}</div>
              </div>
            </div>
            <div style={{padding:"0 1.1rem 1rem"}}>
              <div style={{fontSize:".78rem",color:"var(--muted)",lineHeight:1.55,marginBottom:".65rem"}}>{n.desc}</div>
              <div style={{fontSize:".76rem",fontWeight:600,marginBottom:".25rem"}}>🍽 {n.served.toLocaleString()} meals served</div>
              <div className="pbar"><div className="pfill" style={{width:`${Math.min(100,(n.served/350000)*100)}%`}}/></div>
              <div style={{display:"flex",gap:".45rem",marginTop:".85rem"}}>
                <button className="btn btn-g btn-sm" style={{flex:1}} onClick={()=>{
                  if(!user){setShowAuth(true);return;}
                  setDonations(dn=>[...dn,{id:Date.now(),food:"General Donation",restaurant:user.name||"Donor",ngo:n.name,qty:10,date:d(0),status:"pending",value:0}]);
                  fire(`💚 Donation sent to ${n.name}!`);
                }}>💚 Donate</button>
                <button className="btn btn-gh btn-sm" onClick={()=>fire(`🤖 AI matched ${n.name} with 3 nearby restaurants!`)}>🤖 AI Match</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="sh"><div className="sh-t">📦 Donations Log</div><span className="badge bg-g">{donations.length}</span></div>
      <div className="tbl-wrap">
        <table><thead><tr><th>Food</th><th>Restaurant</th><th>NGO</th><th>Qty</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>{donations.map(d=>(
          <tr key={d.id}><td style={{fontWeight:500}}>{d.food}</td><td>{d.restaurant}</td><td>{d.ngo}</td><td>{d.qty}</td><td>{d.date}</td>
          <td><span className={`badge ${d.status==="completed"?"bg-g":d.status==="in-transit"?"bg-sk":"bg-a"}`}>{d.status}</span></td></tr>
        ))}</tbody></table>
      </div>
    </div>
  );
}

/* ═══════════════════════ DONATE ═════════════════════════ */
function DonatePage({fire,donations,setDonations,user,setShowAuth}){
  const [tab,setTab]=useState("form");
  const [form,setForm]=useState({food:"",qty:"",ngo:REAL_NGOS[0].name,notes:""});
  const [imgPrev,setImgPrev]=useState(null);
  const [aiRes,setAiRes]=useState(null);
  const [aiLoad,setAiLoad]=useState(false);
  const [ings,setIngs]=useState("");
  const [recipe,setRecipe]=useState("");
  const [recLoad,setRecLoad]=useState(false);

  const submitDon=()=>{
    if(!user){setShowAuth(true);return;}
    if(!form.food||!form.qty){fire("Fill food name and quantity.");return;}
    setDonations(dn=>[...dn,{id:Date.now(),food:form.food,restaurant:user.name||"Donor",ngo:form.ngo,qty:+form.qty,date:d(0),status:"pending",value:0}]);
    fire(`💚 Donation of ${form.food} sent to ${form.ngo}!`);
    setForm({food:"",qty:"",ngo:REAL_NGOS[0].name,notes:""});
  };

  const analyzeImg=async()=>{
    if(!imgPrev)return;setAiLoad(true);setAiRes(null);
    try{
      const b64=imgPrev.split(",")[1];
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:[
          {type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}},
          {type:"text",text:`Analyze this food image. Return ONLY valid JSON without markdown:\n{"foodName":"","freshness":"Fresh/Slightly Aging/Near Expiry/Spoiled","estimatedExpiry":"","safeToEat":true,"storageAdvice":"","donationSuitable":true,"recipeSuggestion":"","spoilageWarning":""}`}
        ]}]})
      });
      const data=await res.json();
      setAiRes(JSON.parse((data.content?.[0]?.text||"{}").replace(/```json|```/g,"").trim()));
    }catch{setAiRes({error:"Analysis failed."});}
    setAiLoad(false);
  };

  const genRecipe=async()=>{
    if(!ings.trim())return;setRecLoad(true);setRecipe("");
    const txt=await askClaude([{role:"user",content:`Leftovers: ${ings}. Give 2 simple waste-reducing recipes. Be concise, Pakistani context preferred.`}],
      "You are a recipe expert. Give practical, brief recipes under 180 words.");
    setRecipe(txt);setRecLoad(false);
  };

  return(
    <div className="page">
      <div className="sh-t" style={{marginBottom:"1.1rem"}}>💚 Donate & AI Tools</div>
      <div className="tabs">
        {[["form","📦 Donate"],["image","📷 AI Image"],["recipe","👨‍🍳 Recipes"]].map(([v,l])=>(
          <button key={v} className={`tab${tab===v?" on":""}`} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>
      {tab==="form"&&(
        <div className="g2">
          <div className="card">
            <div style={{fontFamily:"Fraunces",fontWeight:700,marginBottom:"1rem"}}>Submit Donation</div>
            <div className="fg"><label className="fl">Food Name</label><input className="fi" placeholder="e.g. Chicken Biryani" value={form.food} onChange={e=>setForm({...form,food:e.target.value})}/></div>
            <div className="fg"><label className="fl">Quantity</label><input className="fi" type="number" min="1" placeholder="e.g. 15" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></div>
            <div className="fg"><label className="fl">NGO</label>
              <select className="fi" value={form.ngo} onChange={e=>setForm({...form,ngo:e.target.value})}>
                {REAL_NGOS.map(n=><option key={n.id} value={n.name}>{n.name} — {n.city}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Notes</label><input className="fi" placeholder="Allergies, pickup time..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
            <button className="btn btn-g1" style={{width:"100%"}} onClick={submitDon}>💚 Submit Donation</button>
          </div>
          <div>
            <div className="card" style={{marginBottom:".9rem"}}>
              <div style={{fontFamily:"Fraunces",fontWeight:700,marginBottom:".7rem"}}>🤖 AI Smart Matching</div>
              {REAL_NGOS.slice(0,4).map((n,i)=>(
                <div key={n.id} style={{display:"flex",alignItems:"center",gap:".55rem",padding:".48rem 0",borderBottom:"1px solid var(--border)"}}>
                  <span>{n.logo}</span>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:".83rem"}}>{n.name}</div><div style={{fontSize:".7rem",color:"var(--muted)"}}>{n.city}</div></div>
                  <span className={`badge ${n.urgent?"bg-r":i===1?"bg-a":"bg-g"}`}>{n.urgent?"Urgent":i===1?"Needed":"Normal"}</span>
                </div>
              ))}
            </div>
            <div className="alert alert-g">🤖 AI recommends <strong>Al-Khidmat Foundation</strong> — highest need in Lahore today.</div>
          </div>
        </div>
      )}
      {tab==="image"&&(
        <div className="g2">
          <div>
            <div className="card" style={{marginBottom:".9rem"}}>
              <div style={{fontFamily:"Fraunces",fontWeight:700,marginBottom:"1rem"}}>📷 Upload Food Photo</div>
              <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setImgPrev(ev.target.result);r.readAsDataURL(f);}} style={{marginBottom:".7rem",fontSize:".8rem"}}/>
              {imgPrev&&<img src={imgPrev} alt="" style={{width:"100%",borderRadius:9,marginBottom:".7rem",maxHeight:180,objectFit:"cover"}}/>}
              <button className="btn btn-g1" style={{width:"100%"}} onClick={analyzeImg} disabled={!imgPrev||aiLoad}>
                {aiLoad?<><span className="spin"/> Analyzing...</>:"🤖 Analyze with AI"}
              </button>
            </div>
          </div>
          <div>
            {aiRes&&!aiRes.error?(
              <div className="card">
                <div style={{fontFamily:"Fraunces",fontWeight:700,marginBottom:".9rem"}}>🔍 AI Results</div>
                {[["🍽 Food","foodName"],["✅ Freshness","freshness"],["📅 Expiry","estimatedExpiry"],["🧊 Storage","storageAdvice"],["👨‍🍳 Recipe","recipeSuggestion"],["⚠️ Spoilage","spoilageWarning"]].map(([k,v])=>(
                  <div key={k} style={{padding:".44rem 0",borderBottom:"1px solid var(--border)",fontSize:".82rem",display:"flex",gap:".35rem"}}>
                    <span style={{fontWeight:600,flexShrink:0,minWidth:80}}>{k}:</span><span style={{color:"var(--muted)"}}>{aiRes[v]}</span>
                  </div>
                ))}
                <div style={{display:"flex",gap:".35rem",marginTop:".75rem",flexWrap:"wrap"}}>
                  <span className={`badge ${aiRes.safeToEat?"bg-g":"bg-r"}`}>{aiRes.safeToEat?"✅ Safe":"❌ Not Safe"}</span>
                  <span className={`badge ${aiRes.donationSuitable?"bg-g":"bg-a"}`}>{aiRes.donationSuitable?"💚 OK to Donate":"⚠️ Check first"}</span>
                </div>
              </div>
            ):aiRes?.error?(
              <div className="alert alert-r">{aiRes.error}</div>
            ):(
              <div className="card" style={{textAlign:"center",padding:"2.5rem 1rem",color:"var(--muted)",fontSize:".86rem"}}>Upload a food image to see AI analysis.</div>
            )}
          </div>
        </div>
      )}
      {tab==="recipe"&&(
        <div className="g2">
          <div className="card">
            <div style={{fontFamily:"Fraunces",fontWeight:700,marginBottom:"1rem"}}>👨‍🍳 Recipe from Leftovers</div>
            <div className="fg"><label className="fl">Leftover Ingredients</label>
              <textarea className="fi" rows={5} placeholder="e.g. rice, chicken, onions, tomatoes..." value={ings} onChange={e=>setIngs(e.target.value)} style={{resize:"vertical"}}/>
            </div>
            <button className="btn btn-g1" style={{width:"100%"}} onClick={genRecipe} disabled={recLoad}>
              {recLoad?<><span className="spin"/> Generating...</>:"🤖 Generate Recipes"}
            </button>
          </div>
          <div className="card">
            <div style={{fontFamily:"Fraunces",fontWeight:700,marginBottom:"1rem"}}>📋 AI Recipes</div>
            {recipe?<div style={{fontSize:".87rem",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{recipe}</div>:<div style={{color:"var(--muted)",fontSize:".84rem"}}>Enter ingredients and click generate.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ DASHBOARD ══════════════════════ */
function DashboardPage({stats,donations,orders}){
  const [tab,setTab]=useState("overview");
  const fee=orders.reduce((s,o)=>s+(o.fee||0),0);
  const gmv=orders.reduce((s,o)=>s+o.total,0);
  const rev=fee+48200;
  const weekly=[{d:"Mon",v:6800},{d:"Tue",v:9200},{d:"Wed",v:7400},{d:"Thu",v:11500},{d:"Fri",v:13200},{d:"Sat",v:15800},{d:"Sun",v:10400+fee}];
  const maxW=Math.max(...weekly.map(x=>x.v));
  const ds={comp:donations.filter(x=>x.status==="completed").length,trans:donations.filter(x=>x.status==="in-transit").length,pend:donations.filter(x=>x.status==="pending").length};

  return(
    <div className="page">
      <div className="sh"><div className="sh-t">📊 Analytics & Revenue Dashboard</div></div>
      <div className="tabs">
        {[["overview","📈 Overview"],["revenue","💰 Revenue"],["donations","💚 Donations"],["restaurants","🏪 Restaurants"],["ngos","🤝 NGOs"]].map(([v,l])=>(
          <button key={v} className={`tab${tab===v?" on":""}`} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>

      {tab==="overview"&&(
        <>
          <div className="stats" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
            {[{i:"🍽",v:stats.meals.toLocaleString(),l:"Meals Rescued",d:"+124 today"},{i:"💚",v:donations.length,l:"Donations",d:`${ds.comp} done`},{i:"🛒",v:orders.length,l:"Orders",d:`₨${gmv.toLocaleString()} GMV`},{i:"💰",v:`₨${rev.toLocaleString()}`,l:"Revenue",d:"5% fee model"}].map((s,i)=>(
              <div key={i} className="sc"><div className="sc-i">{s.i}</div><div className="sc-v">{s.v}</div><div className="sc-l">{s.l}</div><div className="sc-d">↑ {s.d}</div></div>
            ))}
          </div>
          <div className="g2" style={{marginBottom:"1.25rem"}}>
            <div className="card">
              <div style={{fontFamily:"Fraunces",fontWeight:700,marginBottom:".9rem"}}>📈 Weekly Revenue (₨)</div>
              <div className="bar-chart">
                {weekly.map((x,i)=>(
                  <div key={i} className="bar-col">
                    <div className="bar-v">₨{(x.v/1000).toFixed(1)}K</div>
                    <div className="bar" style={{height:`${(x.v/maxW)*95}px`}}/>
                    <div className="bar-l">{x.d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div style={{fontFamily:"Fraunces",fontWeight:700,marginBottom:".9rem"}}>💚 Donation Status</div>
              {[["Completed",ds.comp,"#16a34a"],["In Transit",ds.trans,"#0284c7"],["Pending",ds.pend,"#d97706"]].map(([l,v,c])=>(
                <div key={l} style={{marginBottom:".75rem"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:".8rem",marginBottom:".25rem"}}>
                    <span style={{fontWeight:600}}>{l}</span><span style={{color:c,fontWeight:700}}>{v}</span>
                  </div>
                  <div className="pbar"><div className="pfill" style={{width:`${donations.length>0?(v/donations.length)*100:0}%`,background:c}}/></div>
                </div>
              ))}
            </div>
          </div>
          <div className="alert alert-g">🤖 <strong>AI Insight:</strong> Lahore has highest food rescue rate (+42%). Tuesday–Thursday are peak donation days.</div>
        </>
      )}

      {tab==="revenue"&&(
        <>
          <div className="stats" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
            {[{i:"💰",v:`₨${rev.toLocaleString()}`,l:"Total Revenue"},{i:"🧾",v:`₨${fee.toLocaleString()}`,l:"Transaction Fees"},{i:"📦",v:orders.length,l:"Orders"},{i:"📊",v:`₨${orders.length>0?Math.round(gmv/orders.length):0}`,l:"Avg Order"}].map((s,i)=>(
              <div key={i} className="sc"><div className="sc-i">{s.i}</div><div className="sc-v">{s.v}</div><div className="sc-l">{s.l}</div></div>
            ))}
          </div>
          <div className="g2" style={{marginBottom:"1.25rem"}}>
            <div className="card">
              <div style={{fontFamily:"Fraunces",fontWeight:700,marginBottom:".9rem"}}>💰 Revenue Sources</div>
              {[{src:"Transaction Fees (5%)",val:fee,pct:Math.max(1,Math.round((fee/(rev||1))*100))},{src:"Premium Subscriptions",val:28200,pct:Math.round((28200/rev)*100)},{src:"NGO Listing Fees",val:12000,pct:Math.round((12000/rev)*100)},{src:"AI Add-ons",val:8000,pct:Math.round((8000/rev)*100)}].map(r=>(
                <div key={r.src} style={{marginBottom:".8rem"}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:".8rem",marginBottom:".25rem"}}>
                    <span style={{fontWeight:500}}>{r.src}</span><span style={{fontWeight:700,color:"var(--g1)"}}>₨{r.val.toLocaleString()} ({r.pct}%)</span>
                  </div>
                  <div className="pbar"><div className="pfill" style={{width:`${r.pct}%`}}/></div>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{fontFamily:"Fraunces",fontWeight:700,marginBottom:".9rem"}}>🏪 By Restaurant</div>
              {REAL_RESTAURANTS.map((r,i)=>(
                <div key={r.id} style={{display:"flex",alignItems:"center",gap:".55rem",padding:".44rem 0",borderBottom:"1px solid var(--border)"}}>
                  <div style={{fontFamily:"Fraunces",fontWeight:800,color:"var(--g1)",width:20}}>#{i+1}</div>
                  <span>{r.logo}</span>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:".82rem"}}>{r.name}</div><div style={{fontSize:".7rem",color:"var(--muted)"}}>{r.city}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontFamily:"Fraunces",fontWeight:700,color:"var(--g1)"}}>₨{(r.revenue/1000).toFixed(0)}K</div><div style={{fontSize:".68rem",color:"var(--muted)"}}>{r.orders} orders</div></div>
                </div>
              ))}
            </div>
          </div>
          {orders.length===0&&<div className="alert alert-a">📊 No orders yet. Buy discounted food from Restaurants to see revenue analytics.</div>}
          {orders.length>0&&(
            <div className="tbl-wrap">
              <table><thead><tr><th>Food</th><th>Restaurant</th><th>Qty</th><th>Fee</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>{orders.map(o=>(
                <tr key={o.id}><td style={{fontWeight:500}}>{o.food}</td><td>{o.restaurant}</td><td>{o.qty}</td>
                <td style={{color:"var(--g2)"}}>₨{o.fee}</td><td style={{fontWeight:700}}>₨{o.total+o.fee}</td>
                <td><span className="badge bg-g">{o.status}</span></td></tr>
              ))}</tbody></table>
            </div>
          )}
        </>
      )}

      {tab==="donations"&&(
        <>
          <div className="stats" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
            {[{i:"💚",v:donations.length,l:"Total"},{i:"✅",v:ds.comp,l:"Completed"},{i:"🚚",v:ds.trans,l:"In Transit"},{i:"⏳",v:ds.pend,l:"Pending"}].map((s,i)=>(
              <div key={i} className="sc"><div className="sc-i">{s.i}</div><div className="sc-v">{s.v}</div><div className="sc-l">{s.l}</div></div>
            ))}
          </div>
          <div className="tbl-wrap">
            <table><thead><tr><th>#</th><th>Food</th><th>From</th><th>To NGO</th><th>Qty</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{donations.map((d,i)=>(
              <tr key={d.id}><td style={{color:"var(--muted)"}}>{i+1}</td><td style={{fontWeight:500}}>{d.food}</td>
              <td>{d.restaurant}</td><td>{d.ngo}</td><td>{d.qty}</td><td>{d.date}</td>
              <td><span className={`badge ${d.status==="completed"?"bg-g":d.status==="in-transit"?"bg-sk":"bg-a"}`}>{d.status}</span></td></tr>
            ))}</tbody></table>
          </div>
        </>
      )}

      {tab==="restaurants"&&(
        <>
          <div className="stats" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
            {[{i:"🏪",v:REAL_RESTAURANTS.length,l:"Total"},{i:"📦",v:REAL_RESTAURANTS.reduce((s,r)=>s+r.foods.length,0),l:"Food Items"},{i:"🛒",v:REAL_RESTAURANTS.reduce((s,r)=>s+r.orders,0).toLocaleString(),l:"All Orders"},{i:"💰",v:`₨${(REAL_RESTAURANTS.reduce((s,r)=>s+r.revenue,0)/1000).toFixed(0)}K`,l:"Total GMV"}].map((s,i)=>(
              <div key={i} className="sc"><div className="sc-i">{s.i}</div><div className="sc-v">{s.v}</div><div className="sc-l">{s.l}</div></div>
            ))}
          </div>
          <div className="tbl-wrap">
            <table><thead><tr><th>Restaurant</th><th>City</th><th>Rating</th><th>Items</th><th>Orders</th><th>Revenue</th><th>Free Today</th></tr></thead>
            <tbody>{REAL_RESTAURANTS.map(r=>(
              <tr key={r.id}>
                <td><div style={{display:"flex",gap:".35rem",alignItems:"center"}}><span>{r.logo}</span><span style={{fontWeight:600}}>{r.name}</span></div></td>
                <td>{r.city}</td><td><span className="badge bg-g">⭐ {r.rating}</span></td>
                <td>{r.foods.length}</td><td>{r.orders.toLocaleString()}</td>
                <td style={{fontWeight:700,color:"var(--g1)"}}>₨{(r.revenue/1000).toFixed(0)}K</td>
                <td><span className="badge bg-r">{r.foods.filter(f=>getExpiry(f.expiry).free).length}</span></td>
              </tr>
            ))}</tbody></table>
          </div>
        </>
      )}

      {tab==="ngos"&&(
        <>
          <div className="stats" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
            {[{i:"🤝",v:REAL_NGOS.length,l:"Total"},{i:"🚨",v:REAL_NGOS.filter(n=>n.urgent).length,l:"Urgent"},{i:"🍽",v:REAL_NGOS.reduce((s,n)=>s+n.served,0).toLocaleString(),l:"Meals Served"},{i:"✅",v:REAL_NGOS.filter(n=>n.verified).length,l:"Verified"}].map((s,i)=>(
              <div key={i} className="sc"><div className="sc-i">{s.i}</div><div className="sc-v">{s.v}</div><div className="sc-l">{s.l}</div></div>
            ))}
          </div>
          <div className="tbl-wrap">
            <table><thead><tr><th>NGO</th><th>City</th><th>Meals Served</th><th>Capacity</th><th>Urgent</th></tr></thead>
            <tbody>{REAL_NGOS.map(n=>(
              <tr key={n.id}>
                <td><div style={{display:"flex",gap:".35rem",alignItems:"center"}}><span>{n.logo}</span><span style={{fontWeight:600}}>{n.name}</span></div></td>
                <td>{n.city}</td><td style={{fontWeight:700,color:"var(--g1)"}}>{n.served.toLocaleString()}</td>
                <td>{n.capacity}/day</td>
                <td>{n.urgent?<span className="badge bg-r">Urgent</span>:<span className="badge bg-g">Normal</span>}</td>
              </tr>
            ))}</tbody></table>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════ CHATBOT ════════════════════════ */
function ChatbotPage({user,go}){
  const [history,setHistory]=useState([
    {role:"assistant",content:"👋 Assalamu Alaikum! I'm **Zero Hunger AI** — your smart food rescue assistant.\n\nMain aapki help kar sakta hoon:\n• 🤝 NGOs dhundne mein food donation ke liye\n• 🍽 Discounted food restaurants mein\n• 🥘 Recipes leftover ingredients se\n• 🧊 Food safety aur storage tips\n• 🌉 Private giving — silently help kisi ko\n\nKya poochna chahte hain?"}
  ]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const msgRef=useRef();

  const QUICK=["NGOs in Lahore?","Which restaurants have free food today?","Mere paas extra biryani hai","Food safety tips for summer","How does Zero Hunger work?","Recipe from rice and chicken","I want to help someone quietly","Private donation kaise karo?"];

  const scrollBot=()=>setTimeout(()=>msgRef.current?.scrollTo({top:99999,behavior:"smooth"}),60);

  const send=useCallback(async(msg)=>{
    const txt=(msg||input).trim();
    if(!txt||loading)return;
    setInput("");
    const userMsg={role:"user",content:txt};
    const newHist=[...history,userMsg];
    setHistory(newHist);
    setLoading(true);scrollBot();
    // Check if user wants silent bridge — guide them
    const silentKeywords=["silent","private donation","quietly","secretly","anonymous","help someone quietly","kisi ko quietly","chupke se"];
    const wantsSilent=silentKeywords.some(k=>txt.toLowerCase().includes(k));
    const apiMsgs=newHist.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.content}));
    try{
      const reply=await askClaude(apiMsgs,BOT_SYSTEM);
      const finalReply = wantsSilent
        ? reply+"\n\n🌉 **Silent Bridge** — I can guide you to our completely private giving feature where both the donor and recipient remain anonymous. [Click here to open it](/bridge)"
        : reply;
      setHistory(h=>[...h,{role:"assistant",content:finalReply,hasBridgeLink:wantsSilent}]);
    }catch{
      setHistory(h=>[...h,{role:"assistant",content:"Sorry, connection issue. Please try again 🙏"}]);
    }
    setLoading(false);scrollBot();
  },[input,history,loading]);

  const renderMsg=(txt,hasBridgeLink)=>{
    return txt.split("\n").map((line,i)=>{
      // Render bridge link as real button
      if(hasBridgeLink && line.includes("[Click here to open it](/bridge)")){
        const parts=line.split("[Click here to open it](/bridge)");
        return <div key={i} style={{lineHeight:1.65}}>{parts[0]}<button onClick={()=>go("bridge")} style={{background:"linear-gradient(135deg,#312e81,#4338ca)",color:"#fff",border:"none",borderRadius:7,padding:".3rem .75rem",fontSize:".82rem",fontWeight:600,cursor:"pointer",margin:"0 .25rem"}}>🌉 Open Silent Bridge</button>{parts[1]}</div>;
      }
      const html=line.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>");
      return <div key={i} dangerouslySetInnerHTML={{__html:html||"&nbsp;"}} style={{lineHeight:1.65}}/>;
    });
  };

  return(
    <div className="page" style={{padding:"1.1rem 1.25rem"}}>
      <div className="chat-wrap">
        <div className="chat-side">
          <div className="card" style={{padding:".9rem"}}>
            <div style={{fontFamily:"Fraunces",fontWeight:700,fontSize:".87rem",marginBottom:".6rem"}}>💡 Quick Questions</div>
            {QUICK.map((q,i)=>(
              <button key={i} onClick={()=>send(q)} disabled={loading}
                style={{display:"block",width:"100%",textAlign:"left",background:"none",border:"none",padding:".38rem .08rem",borderBottom:"1px solid var(--border)",fontSize:".75rem",color:"var(--g1)",cursor:"pointer",lineHeight:1.45,fontFamily:"Outfit",transition:".12s"}}
                onMouseEnter={e=>e.currentTarget.style.color="var(--g2)"}
                onMouseLeave={e=>e.currentTarget.style.color="var(--g1)"}>
                {q}
              </button>
            ))}
          </div>
          <div className="card" style={{padding:".9rem",background:"linear-gradient(135deg,#1e1b4b,#312e81)",border:"1px solid #4338ca"}}>
            <div style={{fontFamily:"Fraunces",fontWeight:700,fontSize:".87rem",marginBottom:".5rem",color:"#a5b4fc"}}>🌉 Silent Bridge</div>
            <div style={{fontSize:".74rem",color:"rgba(255,255,255,.55)",lineHeight:1.55,marginBottom:".75rem"}}>Give or receive food help anonymously. Zero Hunger is the trusted middleman.</div>
            <button className="btn btn-sb btn-sm" style={{width:"100%"}} onClick={()=>go("bridge")}>Open Privately →</button>
          </div>
          <button className="btn btn-gh btn-sm" style={{width:"100%"}} onClick={()=>setHistory([{role:"assistant",content:"Chat cleared! Main hoon yahan — kya madad chahiye? 🌱"}])}>🗑 Clear Chat</button>
        </div>

        <div className="chat-main">
          <div className="chat-top">
            <div className="chat-av">🤖</div>
            <div>
              <div style={{fontFamily:"Fraunces",fontWeight:700,fontSize:".97rem"}}>Zero Hunger AI</div>
              <div style={{fontSize:".7rem",opacity:.75}}>Claude-powered · {history.length-1} messages · Full conversation memory</div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:".3rem"}}>
              <div style={{width:6,height:6,background:loading?"#fbbf24":"#4ade80",borderRadius:"50%"}}/>
              <span style={{fontSize:".7rem",opacity:.8,marginLeft:".25rem"}}>{loading?"Thinking...":"Online"}</span>
            </div>
          </div>

          <div className="chat-msgs" ref={msgRef}>
            {history.map((m,i)=>(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
                <div className={`msg ${m.role==="assistant"?"msg-bot":"msg-user"}`}>
                  {renderMsg(m.content,m.hasBridgeLink)}
                </div>
                <div className="msg-t" style={{paddingLeft:m.role==="assistant"?".5rem":0,paddingRight:m.role==="user"?".5rem":0,alignSelf:m.role==="user"?"flex-end":"flex-start"}}>
                  {m.role==="assistant"?"🤖 Zero Hunger AI":user?`👤 ${user.name}`:"👤 You"} · {ts()}
                </div>
              </div>
            ))}
            {loading&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
                <div className="msg msg-bot" style={{display:"flex",gap:4,padding:".7rem .9rem",alignItems:"center"}}>
                  {[0,1,2].map(i=><span key={i} className="tdot" style={{animationDelay:`${i*0.18}s`}}/>)}
                </div>
              </div>
            )}
          </div>

          <div className="chat-bar">
            <textarea className="chat-in"
              placeholder="Ask about NGOs, food safety, silent giving, recipes... (English ya Urdu dono chalte hain 👍)"
              value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              rows={1}/>
            <button className="btn btn-g1" onClick={()=>send()} disabled={loading||!input.trim()} style={{minWidth:68,alignSelf:"flex-end"}}>
              {loading?<span className="spin"/>:"Send ↑"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ AUTH ═══════════════════════════ */
function AuthModal({mode,setMode,onClose,onAuth}){
  const [f,setF]=useState({name:"",email:"",password:"",role:"user",location:""});
  const [loading,setLoading]=useState(false);
  const submit=()=>{
    if(!f.email||!f.password)return;
    setLoading(true);
    setTimeout(()=>{onAuth({name:f.name||f.email.split("@")[0],email:f.email,role:f.role,location:f.location});setLoading(false);},700);
  };
  return(
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-t">{mode==="login"?"🔐 Sign In":"🌱 Join Zero Hunger"}</div>
        <div className="tabs" style={{marginBottom:"1rem"}}>
          <button className={`tab${mode==="login"?" on":""}`} onClick={()=>setMode("login")}>Sign In</button>
          <button className={`tab${mode==="signup"?" on":""}`} onClick={()=>setMode("signup")}>Sign Up</button>
        </div>
        {mode==="signup"&&<div className="fg"><label className="fl">Full Name</label><input className="fi" placeholder="Your name" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>}
        <div className="fg"><label className="fl">Email</label><input className="fi" type="email" placeholder="you@example.com" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
        <div className="fg"><label className="fl">Password</label><input className="fi" type="password" placeholder="••••••••" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></div>
        {mode==="signup"&&(
          <>
            <div className="fg"><label className="fl">I am a...</label>
              <select className="fi" value={f.role} onChange={e=>setF({...f,role:e.target.value})}>
                <option value="user">👤 General User</option>
                <option value="restaurant">🏪 Restaurant Owner</option>
                <option value="ngo">🤝 NGO / Orphanage</option>
              </select>
            </div>
            <div className="fg"><label className="fl">City</label><input className="fi" placeholder="e.g. Lahore" value={f.location} onChange={e=>setF({...f,location:e.target.value})}/></div>
          </>
        )}
        <div style={{display:"flex",gap:".55rem",marginTop:".4rem"}}>
          <button className="btn btn-g1" style={{flex:1}} onClick={submit} disabled={loading}>
            {loading?<><span className="spin"/> Processing...</>:mode==="login"?"Sign In →":"Create Account →"}
          </button>
          <button className="btn btn-gh" onClick={onClose}>Cancel</button>
        </div>
        {mode==="login"&&<div style={{fontSize:".73rem",color:"var(--muted)",textAlign:"center",marginTop:".7rem",cursor:"pointer"}} onClick={()=>setMode("signup")}>No account? <span style={{color:"var(--g2)",fontWeight:600}}>Sign up free →</span></div>}
      </div>
    </div>
  );
}