import { useState, useEffect, useCallback } from "react";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase.js";
import { LANGS, t } from "./i18n.js";

// ── PASSWORD HELPERS ──────────────────────────────────────
// bcrypt 해시는 항상 "$2"로 시작함 → 평문 비밀번호와 구분하는 기준
function isHashed(pw){ return typeof pw==="string" && pw.startsWith("$2"); }
async function hashPw(pw){ return bcrypt.hash(pw, 10); }
async function verifyPw(inputPw, storedPw){
  if(isHashed(storedPw)) return bcrypt.compare(inputPw, storedPw);
  return inputPw===storedPw; // 기존 평문 비밀번호와 비교 (자동 전환용)
}

// ── DESIGN TOKENS ─────────────────────────────────────────
const C = {
  blue:"#00B5EF", blueDark:"#0090C8", blueLight:"#E6F7FD", blueMid:"#B3E8FA",
  white:"#FFFFFF", bg:"#F4FAFD", border:"#CBE9F7",
  text:"#0A2535", textMid:"#3D7290", textSoft:"#7EB3CC",
  gold:"#F5A800", silver:"#9BAAB5", bronze:"#B87040",
  red:"#D93050", redBg:"#FEF1F3", green:"#0BAF5A", greenBg:"#EDFAF3",
  orange:"#FF7A35", orangeLight:"#FFF1EB",
  purple:"#7B5EA7", purpleLight:"#F3EFFA",
  teal:"#00A896", tealLight:"#E0F5F3",
};

const S = {
  page:{minHeight:"100vh",background:C.bg},
  card:{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,padding:"18px 16px",marginBottom:12,boxShadow:"0 2px 14px rgba(0,181,239,0.07)"},
  cardLabel:{fontSize:10,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",color:C.textSoft,marginBottom:14},
  fieldWrap:{marginBottom:14,textAlign:"left"},
  fieldLabel:{display:"block",fontSize:13,fontWeight:600,color:C.textMid,marginBottom:5},
  input:{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"13px 14px",fontSize:16,color:C.text,outline:"none",width:"100%",boxSizing:"border-box",transition:"border-color 0.15s"},
  inputFocus:{borderColor:C.blue},
  btnBlue:{background:C.blue,border:"none",borderRadius:10,padding:"13px 20px",color:C.white,fontWeight:700,fontSize:15,whiteSpace:"nowrap",boxShadow:"0 3px 12px rgba(0,181,239,0.28)"},
  btnBlueBlock:{background:C.blue,border:"none",borderRadius:12,padding:"15px",color:C.white,fontWeight:700,fontSize:16,width:"100%",boxShadow:"0 4px 14px rgba(0,181,239,0.30)"},
  btnOutline:{background:"none",border:`1px solid ${C.border}`,borderRadius:10,padding:"13px",color:C.textMid,fontWeight:500,fontSize:15,width:"100%",marginTop:10},
  btnGhost:{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 14px",fontSize:13,color:C.textMid},
  btnDanger:{background:"none",border:"1px solid #f8c2ce",borderRadius:7,color:C.red,padding:"6px 14px",fontSize:13},
  btnText:{background:"none",border:"none",color:C.blue,fontWeight:700,fontSize:14},
  msgOk:{background:C.greenBg,border:"1px solid #a8e6c2",borderRadius:9,padding:"12px 14px",fontSize:14,color:C.green,marginBottom:14},
  msgErr:{background:C.redBg,border:"1px solid #f8c2ce",borderRadius:9,padding:"12px 14px",fontSize:14,color:C.red,marginBottom:14},
  chip:{display:"inline-flex",alignItems:"center",background:C.blueLight,border:`1px solid ${C.blueMid}`,borderRadius:20,padding:"5px 11px 5px 10px",fontSize:13,color:C.blueDark,margin:"3px",fontWeight:500},
  th:{textAlign:"left",padding:"9px 8px",color:C.textSoft,fontWeight:700,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",whiteSpace:"nowrap"},
  td:{padding:"10px 8px",borderBottom:`1px solid ${C.border}`,fontSize:13},
};

// ── SMALL COMPONENTS ──────────────────────────────────────
function Spinner(){return <span style={{display:"inline-block",width:18,height:18,border:"2.5px solid rgba(255,255,255,0.35)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite",verticalAlign:"middle"}}/>;}
function Msg({state}){if(!state?.text)return null;return <div style={state.type==="ok"?S.msgOk:S.msgErr}>{state.text}</div>;}
function Field({label,...props}){
  const[focused,setFocused]=useState(false);
  return(<div style={S.fieldWrap}>{label&&<label style={S.fieldLabel}>{label}</label>}<input {...props} style={{...S.input,...(focused?S.inputFocus:{}),...(props.style||{})}} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/></div>);
}
function PageSpinner({lang}){return <div style={{textAlign:"center",padding:"70px 0",color:C.textSoft}}><div style={{width:36,height:36,margin:"0 auto 14px",border:`3px solid ${C.blueMid}`,borderTopColor:C.blue,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>{t(lang,"loading")}</div>;}
function MedalBadge({rank}){
  const m=rank===1?{bg:C.gold,fg:"#fff",txt:"🥇"}:rank===2?{bg:C.silver,fg:"#fff",txt:"🥈"}:rank===3?{bg:C.bronze,fg:"#fff",txt:"🥉"}:{bg:C.blueLight,fg:C.blue,txt:String(rank)};
  return <div style={{width:36,height:36,borderRadius:9,flexShrink:0,background:m.bg,color:m.fg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:rank<=3?18:13,marginRight:12,border:rank<=3?"none":`1px solid ${C.border}`}}>{m.txt}</div>;
}
function LangSwitcher({lang,setLang}){
  const[open,setOpen]=useState(false);
  const ref=useCallback(node=>{
    if(!node)return;
    const handler=e=>{if(!node.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);
    document.addEventListener("touchstart",handler);
    return()=>{document.removeEventListener("mousedown",handler);document.removeEventListener("touchstart",handler);};
  },[]);
  const current=LANGS.find(l=>l.code===lang)||LANGS[0];
  return(
    <div style={{position:"relative"}} ref={ref}>
      <button onClick={()=>setOpen(p=>!p)}
        style={{display:"flex",alignItems:"center",gap:6,background:C.white,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"7px 12px",fontSize:13,fontWeight:700,color:C.text,cursor:"pointer",minWidth:72}}>
        <span style={{fontSize:15}}>🌐</span>
        <span>{current.label}</span>
        <span style={{fontSize:10,color:C.textSoft,marginLeft:2}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,background:C.white,border:`1.5px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,0.10)",zIndex:200,overflow:"hidden",minWidth:110}}>
          {LANGS.map(l=>(
            <button key={l.code} onClick={()=>{setLang(l.code);setOpen(false);}}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:lang===l.code?C.blueLight:"none",border:"none",padding:"11px 16px",fontSize:14,fontWeight:lang===l.code?700:400,color:lang===l.code?C.blue:C.text,cursor:"pointer",textAlign:"left"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:lang===l.code?C.blue:"transparent",flexShrink:0,display:"inline-block"}}/>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function Logo({lang}){return(
  <div style={{marginBottom:24}}>
    <div style={{marginBottom:14,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <span style={{fontSize:36,fontWeight:900,color:C.blue,letterSpacing:"0.08em",lineHeight:1}}>ATOMY</span>
      <div style={{width:110,height:1.5,background:C.blueMid}}/>
      <span style={{fontSize:12,fontWeight:700,color:C.blue,letterSpacing:"0.35em"}}>EUROPE</span>
    </div>
    <div style={{fontSize:17,fontWeight:900,color:C.text,letterSpacing:"-0.3px",lineHeight:1.3}}>{t(lang,"appName")}</div>
    <div style={{fontSize:12,color:C.textSoft,marginTop:4}}>{t(lang,"appSub")}</div>
  </div>
);}
function TypeTag({type,seminar}){
  const isDist=type==="distribution";
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:3}}>
      <span style={{background:isDist?C.orangeLight:C.blueLight,color:isDist?C.orange:C.blue,border:`1px solid ${isDist?"#ffd4b8":C.blueMid}`,borderRadius:10,padding:"2px 8px",fontSize:12,fontWeight:700}}>
        {isDist?"D":"C"}
      </span>
      {seminar&&<span style={{background:C.purpleLight,color:C.purple,border:"1px solid #d8ccf0",borderRadius:10,padding:"2px 7px",fontSize:11,fontWeight:700}}>S</span>}
    </span>
  );
}
function useMsg(){
  const[state,setState]=useState({type:"",text:""});
  const flash=useCallback((type,text,ms=3500)=>{setState({type,text});setTimeout(()=>setState({type:"",text:""}),ms);},[]);
  return[state,flash];
}

// ── ROOT ──────────────────────────────────────────────────
export default function App(){
  const[screen,setScreen]=useState("login");
  const[user,setUser]=useState(null);
  const[lang,setLang]=useState("en");
  useEffect(()=>{
    const sl=localStorage.getItem("rc_lang");if(sl)setLang(sl);
    try{const s=sessionStorage.getItem("rc_user");if(s){setUser(JSON.parse(s));setScreen("main");}}catch{}
  },[]);
  function changeLang(l){setLang(l);localStorage.setItem("rc_lang",l);}
  function handleLogin(m){setUser(m);sessionStorage.setItem("rc_user",JSON.stringify(m));setScreen("main");}
  function handleLogout(){setUser(null);sessionStorage.removeItem("rc_user");setScreen("login");}
  if(screen==="main"&&user)return <MainPage user={user} lang={lang} setLang={changeLang} onLogout={handleLogout}/>;
  if(screen==="signup")return <SignupPage lang={lang} setLang={changeLang} onSuccess={handleLogin} onBack={()=>setScreen("login")}/>;
  return <LoginPage lang={lang} setLang={changeLang} onSuccess={handleLogin} onSignup={()=>setScreen("signup")}/>;
}

// ── SIGNUP ────────────────────────────────────────────────
function SignupPage({lang,setLang,onSuccess,onBack}){
  const[form,setForm]=useState({name:"",member_no:"",email:"",password:"",mastership:""});
  const[busy,setBusy]=useState(false);const[msg,flash]=useMsg();
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  async function submit(){
    const{name,member_no,email,password,mastership}=form;
    const n=name.trim(),m=member_no.trim(),e=email.trim().toLowerCase(),pw=password;
    if(!n||!m||!e||!pw){flash("err",t(lang,"fillAll"));return;}
    if(!/^\d{8}$/.test(m)){flash("err",t(lang,"numbersOnly"));return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){flash("err",t(lang,"invalidEmail"));return;}
    if(pw.length<6){flash("err",t(lang,"weakPassword"));return;}
    setBusy(true);
    try{
      const{data:dup}=await supabase.from("members").select("member_no,email").or(`member_no.eq.${m},email.eq.${e}`);
      if(dup&&dup.length>0){if(dup[0].member_no===m){flash("err",t(lang,"duplicateMemberNo",{val:m}));return;}flash("err",t(lang,"duplicateEmail"));return;}
      const hashedPw=await hashPw(pw);
      const{data,error}=await supabase.from("members").insert({name:n,member_no:m,email:e,password:hashedPw,mastership}).select().single();
      if(error)throw error;
      flash("ok",t(lang,"signupOk"));setTimeout(()=>onSuccess(data),1400);
    }catch(err){flash("err",err.message||t(lang,"errorGeneric"));}finally{setBusy(false);}
  }
  return(
    <div style={{minHeight:"100vh",background:C.bg,padding:"0 0 40px"}}>
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <span style={{fontSize:18,fontWeight:900,color:C.blue}}>ATOMY <span style={{fontSize:11,color:C.blueDark,letterSpacing:"0.2em"}}>EUROPE</span></span>
        <LangSwitcher lang={lang} setLang={setLang}/>
      </div>
      <div style={{padding:"24px 16px"}}>
        <Logo lang={lang}/>
        <div style={{fontSize:17,fontWeight:800,color:C.text,marginBottom:20}}>{t(lang,"signup")}</div>
        <Msg state={msg}/>
        <Field label={t(lang,"name")} placeholder={t(lang,"namePlaceholder")} value={form.name} onChange={set("name")}/>
        <Field label={t(lang,"memberNo")} placeholder={t(lang,"memberNoPlaceholder")} value={form.member_no} onChange={e=>setForm(p=>({...p,member_no:e.target.value.replace(/\D/g,"").slice(0,8)}))} inputMode="numeric" maxLength={8}/>
        <Field label={t(lang,"email")} type="email" placeholder={t(lang,"emailPlaceholder")} value={form.email} onChange={set("email")}/>
        <Field label={t(lang,"password")} type="password" placeholder={t(lang,"passwordPlaceholder")} value={form.password} onChange={set("password")}/>
        <div style={S.fieldWrap}>
          <label style={S.fieldLabel}>{t(lang,"mastership")}</label>
          <select value={form.mastership} onChange={set("mastership")} style={{...S.input,color:form.mastership?C.text:C.textSoft}}>
            <option value="" disabled>{t(lang,"mastershipPlaceholder")}</option>
            <option value="NONE">{t(lang,"noMastership")}</option>
            {["SM","DM","SRM","STM","RM","CM","IM"].map(ms=><option key={ms} value={ms}>{ms}</option>)}
          </select>
        </div>
        <button style={{...S.btnBlueBlock,marginTop:6}} onClick={submit} disabled={busy}>{busy?<Spinner/>:t(lang,"signupBtn")}</button>
        <button style={S.btnOutline} onClick={onBack}>{t(lang,"hasAccount")} {t(lang,"loginHere")}</button>
      </div>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────
function LoginPage({lang,setLang,onSuccess,onSignup}){
  const[memberNo,setMemberNo]=useState("");const[pw,setPw]=useState("");
  const[busy,setBusy]=useState(false);const[msg,flash]=useMsg();const[showForgot,setShowForgot]=useState(false);
  const[pubNotices,setPubNotices]=useState([]);const[loadingNotices,setLoadingNotices]=useState(true);
  useEffect(()=>{
    supabase.from("notices").select("*").eq("is_active",true).order("created_at",{ascending:false})
      .then(({data})=>{setPubNotices(data||[]);setLoadingNotices(false);});
  },[]);
  async function submit(){
    const m=memberNo.trim();if(!m||!pw){flash("err",t(lang,"fillAll"));return;}
    setBusy(true);
    try{
      const{data,error}=await supabase.from("members").select("*").eq("member_no",m).maybeSingle();
      if(error)throw error;
      if(!data){flash("err",t(lang,"notRegistered"));return;}
      const ok=await verifyPw(pw,data.password);
      if(!ok){flash("err",t(lang,"wrongPassword"));return;}
      // 자동 전환: 평문 비밀번호였다면 로그인 성공 시 암호화해서 재저장
      if(!isHashed(data.password)){
        const newHash=await hashPw(pw);
        await supabase.from("members").update({password:newHash}).eq("id",data.id);
      }
      onSuccess(data);
    }catch(err){flash("err",err.message||t(lang,"errorGeneric"));}finally{setBusy(false);}
  }
  const filteredNotices=pubNotices.filter(n=>!n.language||n.language==="all"||n.language===lang);
  if(showForgot)return <ForgotPasswordPage lang={lang} setLang={setLang} onBack={()=>setShowForgot(false)}/>;
  return(
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40}}>
      {/* 헤더 */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <span style={{fontSize:18,fontWeight:900,color:C.blue}}>ATOMY <span style={{fontSize:11,color:C.blueDark,letterSpacing:"0.2em"}}>EUROPE</span></span>
        <LangSwitcher lang={lang} setLang={setLang}/>
      </div>
      <div style={{padding:"24px 16px"}}>
        <Logo lang={lang}/>
        <div style={{fontSize:17,fontWeight:800,color:C.text,marginBottom:18}}>{t(lang,"login")}</div>
        <Msg state={msg}/>
        <Field label={t(lang,"memberNo")} placeholder={t(lang,"memberNoPlaceholder")} inputMode="numeric" value={memberNo} onChange={e=>setMemberNo(e.target.value)}/>
        <Field label={t(lang,"password")} type="password" placeholder={t(lang,"passwordPlaceholder")} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
        <div style={{textAlign:"right",marginTop:-8,marginBottom:16}}>
          <button style={{...S.btnText,fontSize:13,color:C.textSoft}} onClick={()=>setShowForgot(true)}>{t(lang,"forgotPassword")}</button>
        </div>
        <button style={{...S.btnBlueBlock}} onClick={submit} disabled={busy}>{busy?<Spinner/>:t(lang,"loginBtn")}</button>
        <div style={{textAlign:"center",marginTop:18,fontSize:14,color:C.textSoft}}>{t(lang,"noAccount")} <button style={S.btnText} onClick={onSignup}>{t(lang,"signupHere")}</button></div>

        {/* 구분선 */}
        <div style={{borderTop:`1px solid ${C.border}`,margin:"28px 0 20px"}}/>

        {/* 사용방법 */}
        <HowToSection lang={lang}/>

        {/* 공지사항 */}
        {!loadingNotices&&<PublicNoticesSection lang={lang} notices={filteredNotices}/>}
      </div>
    </div>
  );
}

// ── HOW TO SECTION ────────────────────────────────────────
function HowToSection({lang}){
  const steps=[
    {n:1,title:t(lang,"howToStep1Title"),desc:t(lang,"howToStep1Desc")},
    {n:2,title:t(lang,"howToStep2Title"),desc:t(lang,"howToStep2Desc")},
    {n:3,title:t(lang,"howToStep3Title"),desc:t(lang,"howToStep3Desc")},
  ];
  return(
    <div style={{...S.card,marginBottom:12}}>
      <div style={S.cardLabel}>{t(lang,"howToTitle")}</div>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {steps.map(s=>(
          <div key={s.n} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:32,height:32,borderRadius:9,background:C.blue,color:C.white,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,flexShrink:0,marginTop:1}}>{s.n}</div>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:3}}>{s.title}</div>
              <div style={{fontSize:13,color:C.textMid,lineHeight:1.65}}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PUBLIC NOTICES SECTION ────────────────────────────────
function PublicNoticesSection({lang,notices}){
  if(notices.length===0)return null;
  return(
    <div style={{...S.card,background:"linear-gradient(135deg,#E6F7FD,#fff)",border:`1.5px solid ${C.blue}30`,marginBottom:12}}>
      <div style={S.cardLabel}>{t(lang,"announcements")}</div>
      {notices.map((n,i)=>(
        <div key={n.id} style={{marginBottom:i<notices.length-1?18:0,paddingBottom:i<notices.length-1?18:0,borderBottom:i<notices.length-1?`1px solid ${C.border}`:"none"}}>
          <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:5}}>{n.title}</div>
          <div style={{fontSize:13,color:C.textMid,lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:n.video_url?12:0}}>{n.content}</div>
          {n.video_url&&(
            <a href={n.video_url} target="_blank" rel="noopener noreferrer"
              style={{display:"inline-flex",alignItems:"center",gap:7,background:"#FF0000",color:"#fff",borderRadius:9,padding:"9px 16px",fontSize:13,fontWeight:700,textDecoration:"none",marginTop:2}}>
              <span style={{fontSize:16,lineHeight:1}}>▶</span>{t(lang,"watchTutorial")}
            </a>
          )}
          <div style={{fontSize:11,color:C.textSoft,marginTop:8}}>{new Date(n.created_at).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );
}

// ── FORGOT PASSWORD ───────────────────────────────────────
function ForgotPasswordPage({lang,setLang,onBack}){
  const[email,setEmail]=useState("");const[busy,setBusy]=useState(false);const[msg,flash]=useMsg();const[newPw,setNewPw]=useState("");
  function gen(){const c="ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";return Array.from({length:8},()=>c[Math.floor(Math.random()*c.length)]).join("");}
  async function submit(){
    const e=email.trim().toLowerCase();if(!e){flash("err",t(lang,"fillAll"));return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){flash("err",t(lang,"invalidEmail"));return;}
    setBusy(true);
    try{
      const{data,error}=await supabase.from("members").select("id,name").eq("email",e).maybeSingle();
      if(error)throw error;if(!data){flash("err",t(lang,"emailNotFound"));return;}
      const tempPw=gen();const hashedTemp=await hashPw(tempPw);
      const{error:ue}=await supabase.from("members").update({password:hashedTemp}).eq("id",data.id);
      if(ue)throw ue;setNewPw(tempPw);flash("ok",t(lang,"tempPwIssued",{name:data.name}));
    }catch(err){flash("err",err.message||t(lang,"errorGeneric"));}finally{setBusy(false);}
  }
  return(
    <div style={{minHeight:"100vh",background:C.bg,paddingBottom:40}}>
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <span style={{fontSize:18,fontWeight:900,color:C.blue}}>ATOMY <span style={{fontSize:11,color:C.blueDark,letterSpacing:"0.2em"}}>EUROPE</span></span>
        <LangSwitcher lang={lang} setLang={setLang}/>
      </div>
      <div style={{padding:"24px 16px"}}>
        <Logo lang={lang}/>
        <div style={{fontSize:17,fontWeight:800,color:C.text,marginBottom:8}}>{t(lang,"forgotPassword")}</div>
        <div style={{fontSize:13,color:C.textSoft,marginBottom:24,lineHeight:1.6}}>{t(lang,"forgotPasswordDesc")}</div>
        <Msg state={msg}/>
        {newPw?(
          <div style={{background:C.blueLight,border:`2px solid ${C.blue}`,borderRadius:14,padding:"22px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>{t(lang,"tempPwLabel")}</div>
            <div style={{fontSize:30,fontWeight:900,color:C.blue,letterSpacing:"0.15em",fontFamily:"monospace"}}>{newPw}</div>
            <div style={{fontSize:12,color:C.textSoft,marginTop:10}}>{t(lang,"tempPwNote")}</div>
          </div>
        ):(
          <>
            <Field label={t(lang,"email")} type="email" placeholder={t(lang,"emailPlaceholder")} value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            <button style={{...S.btnBlueBlock,marginTop:6}} onClick={submit} disabled={busy}>{busy?<Spinner/>:t(lang,"resetPasswordBtn")}</button>
          </>
        )}
        <button style={S.btnOutline} onClick={onBack}>{t(lang,"backToLogin")}</button>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────
function MainPage({user,lang,setLang,onLogout}){
  const[myRefs,setMyRefs]=useState([]);
  const[ranking,setRanking]=useState([]);
  const[allNums,setAllNums]=useState(new Set());
  const[notices,setNotices]=useState([]);
  const[busy,setBusy]=useState(true);
  const[numInput,setNumInput]=useState("");
  const[refType,setRefType]=useState("distribution");
  const[seminar,setSeminar]=useState(false);
  const[refMsg,flashRef]=useMsg();

  const load=useCallback(async()=>{
    setBusy(true);
    try{
      const{data:allR}=await supabase.from("referrals").select("referred_no");
      setAllNums(new Set((allR||[]).map(r=>r.referred_no)));
      if(!user.is_admin){
        const{data:mine}=await supabase.from("referrals").select("*").eq("recruiter_id",user.id).order("created_at");
        setMyRefs(mine||[]);
      }
      const{data:rank}=await supabase.from("ranking_view").select("*");
      setRanking(rank||[]);
      const{data:n}=await supabase.from("notices").select("*").eq("is_active",true).order("created_at",{ascending:false});
      setNotices(n||[]);
    }finally{setBusy(false);}
  },[user]);
  useEffect(()=>{load();},[load]);

  async function addNum(){
    const val=numInput.trim();if(!val)return;
    if(!/^\d{8}$/.test(val)){flashRef("err",t(lang,"numbersOnly"));return;}
    if(allNums.has(val)){
      const isMine=myRefs.some(r=>r.referred_no===val);
      if(isMine){flashRef("err",t(lang,"alreadyMine",{val}));return;}
      const{data:owner}=await supabase.from("referrals").select("recruiter_id").eq("referred_no",val).maybeSingle();
      const{data:ownerM}=owner?await supabase.from("members").select("name").eq("id",owner.recruiter_id).maybeSingle():{data:null};
      flashRef("err",t(lang,"alreadyOther",{val,name:ownerM?.name||"?"}));return;
    }
    const{error}=await supabase.from("referrals").insert({recruiter_id:user.id,referred_no:val,type:refType,seminar});
    if(error){flashRef("err",error.code==="23505"?t(lang,"alreadyMine",{val}):error.message);return;}
    setNumInput("");setSeminar(false);flashRef("ok",t(lang,"registerOk",{val}));load();
  }
  async function removeNum(id){await supabase.from("referrals").delete().eq("id",id);load();}

  const myDist=myRefs.filter(r=>r.type==="distribution");
  const myCon=myRefs.filter(r=>r.type==="consumer");
  const mySem=myRefs.filter(r=>r.seminar);
  const myRankIdx=ranking.findIndex(r=>r.id===user.id);
  const myRank=myRankIdx>=0?myRankIdx+1:"-";

  // 언어 필터링된 공지
  const filteredNotices=notices.filter(n=>!n.language||n.language==="all"||n.language===lang);

  return(<div style={S.page}>
    {/* 헤더 */}
    <header style={{background:C.white,borderBottom:`1px solid ${C.border}`,boxShadow:"0 2px 10px rgba(0,181,239,0.07)",position:"sticky",top:0,zIndex:50}}>
      <div style={{padding:"0 16px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:18,fontWeight:900,color:C.blue}}>ATOMY</span>
          <span style={{fontSize:10,fontWeight:700,color:C.blueDark,letterSpacing:"0.18em",borderLeft:`2px solid ${C.blueMid}`,paddingLeft:6}}>EUROPE</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <LangSwitcher lang={lang} setLang={setLang}/>
          <div style={{background:C.blueLight,border:`1px solid ${C.blueMid}`,borderRadius:20,padding:"5px 12px",fontSize:13,fontWeight:600,color:C.blueDark,whiteSpace:"nowrap"}}>{user.is_admin?"⚙️":"👤"} {user.name}</div>
          <button style={S.btnGhost} onClick={onLogout}>{t(lang,"logout")}</button>
        </div>
      </div>
    </header>

    <main style={{padding:"16px 16px 80px"}}>
      {busy?<PageSpinner lang={lang}/>:(
        <>
          {/* 공지사항 (언어 필터) */}
          {filteredNotices.length>0&&(
            <div style={{...S.card,background:"linear-gradient(135deg,#E6F7FD,#fff)",border:`1.5px solid ${C.blue}30`}}>
              <div style={S.cardLabel}>{t(lang,"announcements")}</div>
              {filteredNotices.map((n,i)=>(
                <div key={n.id} style={{marginBottom:i<filteredNotices.length-1?16:0,paddingBottom:i<filteredNotices.length-1?16:0,borderBottom:i<filteredNotices.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:4}}>{n.title}</div>
                  <div style={{fontSize:13,color:C.textMid,lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:n.video_url?10:0}}>{n.content}</div>
                  {n.video_url&&(
                    <a href={n.video_url} target="_blank" rel="noopener noreferrer"
                      style={{display:"inline-flex",alignItems:"center",gap:7,background:"#FF0000",color:"#fff",borderRadius:9,padding:"9px 16px",fontSize:13,fontWeight:700,textDecoration:"none"}}>
                      <span style={{fontSize:16,lineHeight:1}}>▶</span>{t(lang,"watchTutorial")}
                    </a>
                  )}
                  <div style={{fontSize:11,color:C.textSoft,marginTop:6}}>{new Date(n.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}

          {/* 일반 회원 */}
          {!user.is_admin&&(
            <>
              {/* 내 현황 */}
              <div style={S.card}>
                <div style={S.cardLabel}>{t(lang,"myStatus")}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:myRefs.length>0?18:0}}>
                  <div style={{gridColumn:"1/-1",background:C.blue,borderRadius:12,padding:"18px",textAlign:"center",boxShadow:`0 4px 16px ${C.blue}40`}}>
                    <div style={{fontSize:36,fontWeight:900,lineHeight:1,color:C.white}}>{myRefs.length}</div>
                    <div style={{fontSize:12,marginTop:5,color:"rgba(255,255,255,0.8)"}}>{t(lang,"totalReferrals")}</div>
                  </div>
                  <div style={{background:C.orangeLight,borderRadius:12,padding:"14px",textAlign:"center",border:`1px solid ${C.orange}30`}}>
                    <div style={{fontSize:28,fontWeight:900,lineHeight:1,color:C.orange}}>{myDist.length}</div>
                    <div style={{fontSize:11,marginTop:5,color:C.textMid}}>{t(lang,"distribution")}</div>
                  </div>
                  <div style={{background:C.blueLight,borderRadius:12,padding:"14px",textAlign:"center",border:`1px solid ${C.blueMid}`}}>
                    <div style={{fontSize:28,fontWeight:900,lineHeight:1,color:C.blue}}>{myCon.length}</div>
                    <div style={{fontSize:11,marginTop:5,color:C.textMid}}>{t(lang,"consumer")}</div>
                  </div>
                  <div style={{background:C.purpleLight,borderRadius:12,padding:"12px 14px",textAlign:"center",border:`1px solid ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                    <div style={{fontSize:22,fontWeight:900,color:C.purple}}>{mySem.length}</div>
                    <div style={{fontSize:12,color:C.textMid}}>{t(lang,"seminar")}</div>
                  </div>
                  <div style={{background:C.tealLight,borderRadius:12,padding:"12px 14px",textAlign:"center",border:`1px solid ${C.teal}30`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                    <div style={{fontSize:22,fontWeight:900,color:C.teal}}>#{myRank}</div>
                    <div style={{fontSize:12,color:C.textMid}}>{t(lang,"currentRank")}</div>
                  </div>
                </div>
                {myRefs.length>0&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:C.textSoft,letterSpacing:"0.08em",marginBottom:8}}>{t(lang,"myList")}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{myRefs.map(r=><span key={r.id} style={S.chip}><TypeTag type={r.type} seminar={r.seminar}/><span style={{marginLeft:5}}>{r.referred_no}</span></span>)}</div>
                  </div>
                )}
              </div>

              {/* 추천 등록 */}
              <div style={S.card}>
                <div style={S.cardLabel}>{t(lang,"addReferralTitle")}</div>
                <div style={{background:C.blueLight,border:`1px solid ${C.blueMid}`,borderRadius:10,padding:"12px 14px",fontSize:13,color:C.blueDark,lineHeight:1.75,marginBottom:18}}>{t(lang,"addReferralDesc")}</div>
                <Msg state={refMsg}/>
                {/* 유형 선택 */}
                <div style={S.fieldWrap}>
                  <label style={S.fieldLabel}>{t(lang,"memberType")}</label>
                  <div style={{display:"flex",gap:10}}>
                    {[{val:"distribution",label:t(lang,"typeDistribution"),color:C.orange,light:C.orangeLight,border:"#ffd4b8"},{val:"consumer",label:t(lang,"typeConsumer"),color:C.blue,light:C.blueLight,border:C.blueMid}].map(opt=>(
                      <button key={opt.val} onClick={()=>setRefType(opt.val)} style={{flex:1,padding:"13px 10px",borderRadius:10,border:`2px solid ${refType===opt.val?opt.color:C.border}`,background:refType===opt.val?opt.light:C.white,color:refType===opt.val?opt.color:C.textMid,fontWeight:refType===opt.val?700:500,fontSize:14,cursor:"pointer",transition:"all 0.15s"}}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                {/* 번호 입력 */}
                <div style={{display:"flex",gap:10,marginBottom:14}}>
                  <input style={{...S.input,flex:1}} placeholder={t(lang,"referralInput")} value={numInput} onChange={e=>setNumInput(e.target.value.replace(/\D/g,"").slice(0,8))} onKeyDown={e=>e.key==="Enter"&&addNum()} inputMode="numeric" maxLength={8}/>
                  <button style={S.btnBlue} onClick={addNum}>{t(lang,"registerBtn")}</button>
                </div>
                {/* 세미나 체크 */}
                <label style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"13px 14px",background:seminar?C.purpleLight:C.bg,border:`1.5px solid ${seminar?C.purple:C.border}`,borderRadius:10,marginBottom:22,transition:"all 0.15s"}}>
                  <input type="checkbox" checked={seminar} onChange={e=>setSeminar(e.target.checked)} style={{width:20,height:20,accentColor:C.purple,cursor:"pointer",flexShrink:0}}/>
                  <span style={{fontSize:14,fontWeight:seminar?700:500,color:seminar?C.purple:C.textMid}}>{t(lang,"seminarCheck")}</span>
                </label>
                {/* 내 목록 */}
                <div style={{borderTop:`1px solid ${C.border}`,paddingTop:18}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <span style={{fontSize:14,fontWeight:700,color:C.textMid}}>{t(lang,"myList")}</span>
                    <span style={{background:C.blue,color:C.white,borderRadius:20,padding:"4px 14px",fontSize:14,fontWeight:700}}>{myRefs.length}</span>
                  </div>
                  {myRefs.length===0
                    ?<div style={{color:C.textSoft,fontSize:13,textAlign:"center",padding:"24px 0",border:`1.5px dashed ${C.border}`,borderRadius:12}}>{t(lang,"emptyList")}</div>
                    :<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{myRefs.map(r=><span key={r.id} style={S.chip}><TypeTag type={r.type} seminar={r.seminar}/><span style={{marginLeft:5}}>{r.referred_no}</span><button onClick={()=>removeNum(r.id)} style={{background:"none",border:"none",color:C.textSoft,cursor:"pointer",marginLeft:6,fontSize:18,lineHeight:1,padding:0}}>×</button></span>)}</div>
                  }
                  <div style={{display:"flex",gap:12,marginTop:14,flexWrap:"wrap"}}>
                    {[{tag:"D",label:t(lang,"distribution"),color:C.orange,light:C.orangeLight,border:"#ffd4b8"},{tag:"C",label:t(lang,"consumer"),color:C.blue,light:C.blueLight,border:C.blueMid},{tag:"S",label:t(lang,"seminar"),color:C.purple,light:C.purpleLight,border:"#d8ccf0"}].map(b=>(
                      <span key={b.tag} style={{fontSize:12,color:C.textSoft,display:"flex",alignItems:"center",gap:5}}>
                        <span style={{background:b.light,color:b.color,border:`1px solid ${b.border}`,borderRadius:10,padding:"2px 8px",fontWeight:700}}>{b.tag}</span>{b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {user.is_admin&&<AdminPanel lang={lang} ranking={ranking} allNums={allNums} notices={notices} onRefresh={load}/>}
        </>
      )}
    </main>
  </div>);
}

// ── ADMIN PANEL ───────────────────────────────────────────
function AdminPanel({lang,ranking,allNums,notices,onRefresh}){
  const[members,setMembers]=useState([]);
  const[refMap,setRefMap]=useState({});
  const[newM,setNewM]=useState({name:"",member_no:"",email:"",password:""});
  const[adminBusy,setAdminBusy]=useState(false);
  const[adminMsg,flashAdmin]=useMsg();
  const[activeTab,setActiveTab]=useState("leaderboard");
  const[rankTab,setRankTab]=useState("overall");
  const initNoticeForm=()=>({_tab:"all",all:{title:"",content:"",video_url:""},en:{title:"",content:"",video_url:""},de:{title:"",content:"",video_url:""},es:{title:"",content:"",video_url:""},ro:{title:"",content:"",video_url:""},ru:{title:"",content:"",video_url:""}});
  const[noticeForm,setNoticeForm]=useState(initNoticeForm());
  const[editingNotice,setEditingNotice]=useState(null); // 수정 중인 notice id
  const[noticeMsg,flashNotice]=useMsg();

  const loadMembers=useCallback(async()=>{
    const{data:mem}=await supabase.from("members").select("*").eq("is_admin",false).order("created_at");
    setMembers(mem||[]);
    const{data:refs}=await supabase.from("referrals").select("*");
    const map={};(refs||[]).forEach(r=>{if(!map[r.recruiter_id])map[r.recruiter_id]=[];map[r.recruiter_id].push(r);});
    setRefMap(map);
  },[]);
  useEffect(()=>{loadMembers();},[loadMembers]);

  const set=k=>e=>setNewM(p=>({...p,[k]:e.target.value}));

  async function addMember(){
    const{name,member_no,email,password}=newM;
    const n=name.trim(),m=member_no.trim(),e=email.trim().toLowerCase(),pw=password;
    if(!n||!m||!e||!pw){flashAdmin("err",t(lang,"fillAll"));return;}
    if(!/^\d+$/.test(m)){flashAdmin("err",t(lang,"numbersOnlyNo"));return;}
    setAdminBusy(true);
    const hashedPw=await hashPw(pw);
    const{error}=await supabase.from("members").insert({name:n,member_no:m,email:e,password:hashedPw});
    setAdminBusy(false);
    if(error){flashAdmin("err",error.code==="23505"?t(lang,"duplicateEntry"):error.message);return;}
    setNewM({name:"",member_no:"",email:"",password:""});
    flashAdmin("ok",t(lang,"addOk",{name:n}));loadMembers();onRefresh();
  }
  async function deleteMember(id,name){
    if(!window.confirm(t(lang,"confirmDelete",{name})))return;
    await supabase.from("members").delete().eq("id",id);loadMembers();onRefresh();
  }
  async function addNotice(){
    const langs=["all","en","de","es","ro","ru"];
    const rows=langs
      .map(l=>({lang:l,...noticeForm[l]}))
      .filter(r=>r.title?.trim()&&r.content?.trim());
    if(rows.length===0){flashNotice("err",t(lang,"fillAll"));return;}
    const inserts=rows.map(r=>{
      const p={title:r.title.trim(),content:r.content.trim(),language:r.lang};
      if(r.video_url?.trim())p.video_url=r.video_url.trim();
      return p;
    });
    const{error}=await supabase.from("notices").insert(inserts);
    if(error){flashNotice("err",error.message);return;}
    setNoticeForm(initNoticeForm());flashNotice("ok",t(lang,"noticeAdded"));onRefresh();
  }
  async function deleteNotice(id){
    await supabase.from("notices").delete().eq("id",id);
    flashNotice("ok",t(lang,"noticeDeleted"));onRefresh();
  }
  function startEditNotice(n){
    // 해당 공지의 언어 탭으로 폼 세팅
    const lk=n.language||"all";
    setNoticeForm(p=>({
      ...initNoticeForm(),
      _tab:lk,
      [lk]:{title:n.title||"",content:n.content||"",video_url:n.video_url||""},
    }));
    setEditingNotice(n.id);
    // 폼 상단으로 스크롤
    setTimeout(()=>document.getElementById("notice-form-top")?.scrollIntoView({behavior:"smooth",block:"start"}),100);
  }
  async function updateNotice(){
    if(!editingNotice)return;
    const lk=noticeForm._tab;
    const title=noticeForm[lk]?.title?.trim();
    const content=noticeForm[lk]?.content?.trim();
    if(!title||!content){flashNotice("err",t(lang,"fillAll"));return;}
    const payload={title,content,language:lk};
    payload.video_url=noticeForm[lk]?.video_url?.trim()||"";
    const{error}=await supabase.from("notices").update(payload).eq("id",editingNotice);
    if(error){flashNotice("err",error.message);return;}
    setNoticeForm(initNoticeForm());setEditingNotice(null);
    flashNotice("ok","✅ Notice updated!");onRefresh();
  }

  function downloadExcel(){
    const rows=[["Member No","Name","Type","Referred No","Seminar","Date"]];
    members.forEach(m=>{
      const refs=refMap[m.id]||[];
      if(refs.length===0){rows.push([m.member_no,m.name,"","","",""]);}
      else{refs.forEach(r=>{rows.push([m.member_no,m.name,r.type,r.referred_no,r.seminar?"Yes":"No",new Date(r.created_at).toLocaleDateString()]);});}
    });
    const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const bom="\uFEFF";
    const blob=new Blob([bom+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`${t(lang,"excelFilename")}.csv`;a.click();URL.revokeObjectURL(url);
  }

  const rankingByDist=[...ranking].sort((a,b)=>b.distribution_count-a.distribution_count);
  const rankingByCon=[...ranking].sort((a,b)=>b.consumer_count-a.consumer_count);
  const top1Overall=ranking[0]||null;
  const top1Dist=rankingByDist[0]||null;
  const top1Con=rankingByCon[0]||null;

  const allRefs=Object.values(refMap).flat();
  const totalDist=allRefs.filter(r=>r.type==="distribution").length;
  const totalCon=allRefs.filter(r=>r.type==="consumer").length;
  const totalSem=allRefs.filter(r=>r.seminar).length;

  const tabs=[{key:"leaderboard",label:t(lang,"leaderboard")},{key:"details",label:t(lang,"referralDetails")},{key:"members",label:t(lang,"memberMgmt")},{key:"notices",label:t(lang,"notices")}];
  const rankTabs=[{key:"overall",label:t(lang,"overallRanking")},{key:"distribution",label:t(lang,"distributionRanking")},{key:"consumer",label:t(lang,"consumerRanking")}];
  const currentRanking=rankTab==="distribution"?rankingByDist:rankTab==="consumer"?rankingByCon:ranking;
  const countKey=rankTab==="distribution"?"distribution_count":rankTab==="consumer"?"consumer_count":"referral_count";

  return(<>
    {/* 통계 카드 */}
    <div style={S.card}>
      <div style={S.cardLabel}>{t(lang,"stats")}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div style={{gridColumn:"1/-1",background:C.blue,borderRadius:12,padding:"18px",textAlign:"center",boxShadow:`0 4px 16px ${C.blue}40`}}>
          <div style={{fontSize:36,fontWeight:900,color:C.white,lineHeight:1}}>{members.length}</div>
          <div style={{fontSize:12,marginTop:5,color:"rgba(255,255,255,0.8)"}}>{t(lang,"totalMembers")}</div>
        </div>
        <div style={{gridColumn:"1/-1",background:C.tealLight,borderRadius:12,padding:"16px",textAlign:"center",border:`1px solid ${C.teal}30`}}>
          <div style={{fontSize:32,fontWeight:900,color:C.teal,lineHeight:1}}>{allNums.size}</div>
          <div style={{fontSize:12,marginTop:5,color:C.textMid}}>{t(lang,"totalRegistered")}</div>
        </div>
        <div style={{background:C.orangeLight,borderRadius:12,padding:"14px",textAlign:"center",border:`1px solid ${C.orange}30`}}>
          <div style={{fontSize:28,fontWeight:900,color:C.orange,lineHeight:1}}>{totalDist}</div>
          <div style={{fontSize:11,marginTop:5,color:C.textMid}}>{t(lang,"distribution")}</div>
        </div>
        <div style={{background:C.blueLight,borderRadius:12,padding:"14px",textAlign:"center",border:`1px solid ${C.blueMid}`}}>
          <div style={{fontSize:28,fontWeight:900,color:C.blue,lineHeight:1}}>{totalCon}</div>
          <div style={{fontSize:11,marginTop:5,color:C.textMid}}>{t(lang,"consumer")}</div>
        </div>
        <div style={{gridColumn:"1/-1",background:C.purpleLight,borderRadius:12,padding:"12px 14px",textAlign:"center",border:`1px solid ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
          <div style={{fontSize:26,fontWeight:900,color:C.purple}}>{totalSem}</div>
          <div style={{fontSize:12,color:C.textMid}}>{t(lang,"seminar")}</div>
        </div>
      </div>
      {/* TOP 1 하이라이트 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[
          {title:"Overall #1",member:top1Overall,count:top1Overall?.referral_count,color:C.gold},
          {title:t(lang,"no1Distribution"),member:top1Dist,count:top1Dist?.distribution_count,color:C.orange},
          {title:t(lang,"no1Consumer"),member:top1Con,count:top1Con?.consumer_count,color:C.blue},
        ].map((s,i)=>s.member&&(
          <div key={i} style={{background:s.color+"12",border:`1.5px solid ${s.color}40`,borderRadius:12,padding:"10px 11px"}}>
            <div style={{fontSize:9,fontWeight:800,color:s.color,letterSpacing:"0.08em",marginBottom:5,textTransform:"uppercase"}}>{s.title}</div>
            <div style={{fontWeight:700,fontSize:13,color:C.text}}>
              {s.member.mastership&&s.member.mastership!=="NONE"&&<span style={{background:s.color,color:"#fff",borderRadius:6,padding:"1px 6px",fontSize:10,fontWeight:700,marginRight:4}}>{s.member.mastership}</span>}
              {s.member.name}
            </div>
            <div style={{fontSize:10,color:C.textSoft}}>#{s.member.member_no}</div>
            <div style={{fontSize:22,fontWeight:900,color:s.color,marginTop:3}}>{s.count}</div>
          </div>
        ))}
      </div>
    </div>

    {/* 탭 패널 */}
    <div style={{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 14px rgba(0,181,239,0.07)",marginBottom:16,overflow:"hidden"}}>
      {/* 탭 버튼 — 가로 스크롤 */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        {tabs.map(tab=>(
          <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
            style={{flexShrink:0,background:"none",border:"none",padding:"14px 16px",fontSize:13,fontWeight:activeTab===tab.key?700:500,color:activeTab===tab.key?C.blue:C.textMid,borderBottom:activeTab===tab.key?`2.5px solid ${C.blue}`:"2.5px solid transparent",cursor:"pointer",whiteSpace:"nowrap"}}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{padding:"18px 16px"}}>

        {/* 랭킹 */}
        {activeTab==="leaderboard"&&(<>
          {/* 랭킹 서브탭 — 가로 스크롤 */}
          <div style={{display:"flex",gap:8,marginBottom:18,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:4}}>
            {rankTabs.map(rt=>(
              <button key={rt.key} onClick={()=>setRankTab(rt.key)}
                style={{flexShrink:0,padding:"8px 16px",borderRadius:20,border:`1.5px solid ${rankTab===rt.key?C.blue:C.border}`,background:rankTab===rt.key?C.blueLight:"none",color:rankTab===rt.key?C.blue:C.textMid,fontWeight:rankTab===rt.key?700:500,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
                {rt.label}
              </button>
            ))}
          </div>
          {currentRanking.length===0
            ?<div style={{color:C.textSoft,fontSize:13,textAlign:"center",padding:"24px 0"}}>No members yet</div>
            :currentRanking.map((m,i)=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",padding:"12px 12px",borderRadius:11,marginBottom:6,background:i===0?C.blueLight:C.white,border:`1px solid ${i===0?C.blueMid:C.border}`}}>
                <MedalBadge rank={i+1}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    {m.mastership&&m.mastership!=="NONE"&&<span style={{background:C.blue,color:C.white,borderRadius:8,padding:"2px 8px",fontSize:11,fontWeight:700,flexShrink:0}}>{m.mastership}</span>}
                    <span style={{fontWeight:600,fontSize:15,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</span>
                  </div>
                  <div style={{fontSize:12,color:C.textSoft,marginTop:2}}>#{m.member_no}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0,marginLeft:8}}>
                  <span style={{background:i===0?C.blue:C.blueLight,color:i===0?C.white:C.blue,borderRadius:20,padding:"4px 12px",fontWeight:800,fontSize:15}}>{m[countKey]}</span>
                  {rankTab==="overall"&&(
                    <div style={{display:"flex",gap:4}}>
                      <span style={{background:C.orangeLight,color:C.orange,borderRadius:10,padding:"2px 7px",fontSize:11,fontWeight:700}}>D {m.distribution_count}</span>
                      <span style={{background:C.blueLight,color:C.blue,borderRadius:10,padding:"2px 7px",fontSize:11,fontWeight:700}}>C {m.consumer_count}</span>
                      {m.seminar_count>0&&<span style={{background:C.purpleLight,color:C.purple,borderRadius:10,padding:"2px 7px",fontSize:11,fontWeight:700}}>S {m.seminar_count}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        </>)}

        {/* 상세 테이블 */}
        {activeTab==="details"&&(
          <div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
              <button style={{...S.btnBlue,fontSize:14,padding:"10px 18px"}} onClick={downloadExcel}>⬇ {t(lang,"downloadExcel")}</button>
            </div>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:520}}>
                <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
                  {[t(lang,"memberName"),t(lang,"memberNo"),"MS","D","C","S",t(lang,"referralCount"),t(lang,"registeredNos")].map((h,i)=><th key={i} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {ranking.map((m)=>{
                    const refs=refMap[m.id]||[];
                    return(<tr key={m.id}>
                      <td style={{...S.td,fontWeight:600,color:C.text,whiteSpace:"nowrap"}}>{m.name}</td>
                      <td style={{...S.td,fontFamily:"monospace",color:C.textMid,whiteSpace:"nowrap"}}>{m.member_no}</td>
                      <td style={S.td}>{m.mastership&&m.mastership!=="NONE"?<span style={{background:C.blueLight,color:C.blue,border:`1px solid ${C.blueMid}`,borderRadius:8,padding:"2px 7px",fontSize:11,fontWeight:700}}>{m.mastership}</span>:<span style={{color:C.textSoft}}>—</span>}</td>
                      <td style={S.td}><span style={{color:C.orange,fontWeight:700}}>{m.distribution_count}</span></td>
                      <td style={S.td}><span style={{color:C.blue,fontWeight:700}}>{m.consumer_count}</span></td>
                      <td style={S.td}><span style={{color:C.purple,fontWeight:700}}>{m.seminar_count}</span></td>
                      <td style={S.td}><span style={{background:C.blue,color:C.white,borderRadius:10,padding:"3px 9px",fontWeight:700,fontSize:12}}>{m.referral_count}</span></td>
                      <td style={S.td}>
                        {refs.length===0?<span style={{color:C.textSoft}}>—</span>
                          :<div style={{display:"flex",flexWrap:"wrap",gap:3}}>{refs.map(r=><span key={r.id} style={{...S.chip,fontSize:11,margin:"1px",padding:"2px 7px"}}><TypeTag type={r.type} seminar={r.seminar}/><span style={{marginLeft:3}}>{r.referred_no}</span></span>)}</div>
                        }
                      </td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 회원 관리 */}
        {activeTab==="members"&&(<>
          <Msg state={adminMsg}/>
          <div style={{background:C.blueLight,border:`1px solid ${C.blueMid}`,borderRadius:12,padding:"16px",marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:800,color:C.blue,letterSpacing:"0.1em",marginBottom:12}}>{t(lang,"addMemberTitle")}</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[{k:"name",ph:t(lang,"name"),type:"text"},{k:"member_no",ph:t(lang,"memberNo"),type:"text",mode:"numeric"},{k:"email",ph:t(lang,"email"),type:"email"},{k:"password",ph:t(lang,"password"),type:"password"}].map(f=>(
                <input key={f.k} style={S.input} type={f.type} placeholder={f.ph} inputMode={f.mode} value={newM[f.k]} onChange={set(f.k)}/>
              ))}
              <button style={{...S.btnBlueBlock,marginTop:4}} onClick={addMember} disabled={adminBusy}>{adminBusy?<Spinner/>:t(lang,"addMember")}</button>
            </div>
          </div>
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
              <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
                {[t(lang,"memberName"),t(lang,"memberNo"),t(lang,"email"),"MS","D","C","S",t(lang,"joinDate"),""].map((h,i)=><th key={i} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {members.map(m=>{
                  const refs=refMap[m.id]||[];
                  return(<tr key={m.id}>
                    <td style={{...S.td,fontWeight:600,color:C.text,whiteSpace:"nowrap"}}>{m.name}</td>
                    <td style={{...S.td,fontFamily:"monospace",color:C.textMid,whiteSpace:"nowrap"}}>{m.member_no}</td>
                    <td style={{...S.td,color:C.textSoft,fontSize:12,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.email}</td>
                    <td style={S.td}>{m.mastership&&m.mastership!=="NONE"?<span style={{background:C.blueLight,color:C.blue,border:`1px solid ${C.blueMid}`,borderRadius:8,padding:"2px 7px",fontSize:11,fontWeight:700}}>{m.mastership}</span>:<span style={{color:C.textSoft}}>—</span>}</td>
                    <td style={S.td}><span style={{color:C.orange,fontWeight:700}}>{refs.filter(r=>r.type==="distribution").length}</span></td>
                    <td style={S.td}><span style={{color:C.blue,fontWeight:700}}>{refs.filter(r=>r.type==="consumer").length}</span></td>
                    <td style={S.td}><span style={{color:C.purple,fontWeight:700}}>{refs.filter(r=>r.seminar).length}</span></td>
                    <td style={{...S.td,color:C.textSoft,fontSize:12,whiteSpace:"nowrap"}}>{new Date(m.created_at).toLocaleDateString()}</td>
                    <td style={S.td}><button style={S.btnDanger} onClick={()=>deleteMember(m.id,m.name)}>{t(lang,"delete")}</button></td>
                  </tr>);
                })}
                {members.length===0&&<tr><td colSpan={9} style={{...S.td,textAlign:"center",color:C.textSoft,padding:24}}>—</td></tr>}
              </tbody>
            </table>
          </div>
        </>)}

        {/* 공지사항 관리 */}
        {activeTab==="notices"&&(<>
          <Msg state={noticeMsg}/>
          {/* 언어별 탭 입력 폼 */}
          <div id="notice-form-top" style={{background:editingNotice?"#FFF8E6":C.blueLight,border:`1.5px solid ${editingNotice?C.gold:C.blueMid}`,borderRadius:14,marginBottom:20,overflow:"hidden"}}>
            <div style={{padding:"14px 16px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:11,fontWeight:800,color:editingNotice?C.gold:C.blue,letterSpacing:"0.1em"}}>
                {editingNotice?"✏️ EDIT NOTICE":t(lang,"addNotice")}
              </span>
              {editingNotice&&(
                <button onClick={()=>{setEditingNotice(null);setNoticeForm(initNoticeForm());}}
                  style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 10px",fontSize:12,color:C.textMid,cursor:"pointer"}}>
                  ✕ Cancel
                </button>
              )}
            </div>
            {/* 언어 탭 */}
            <div style={{display:"flex",overflowX:"auto",WebkitOverflowScrolling:"touch",borderBottom:`1px solid ${C.blueMid}`,marginTop:12}}>
              {[{val:"all",label:t(lang,"noticeLangAll")},{val:"en",label:"🇬🇧 EN"},{val:"de",label:"🇩🇪 DE"},{val:"es",label:"🇪🇸 ES"},{val:"ro",label:"🇷🇴 RO"},{val:"ru",label:"🇷🇺 RU"}].map(opt=>{
                const filled=noticeForm[opt.val]?.title?.trim()||noticeForm[opt.val]?.content?.trim();
                return(
                  <button key={opt.val} onClick={()=>setNoticeForm(p=>({...p,_tab:opt.val}))}
                    style={{flexShrink:0,background:noticeForm._tab===opt.val?"#fff":"none",border:"none",borderBottom:noticeForm._tab===opt.val?`2.5px solid ${editingNotice?C.gold:C.blue}`:"2.5px solid transparent",padding:"10px 14px",fontSize:13,fontWeight:noticeForm._tab===opt.val?700:500,color:noticeForm._tab===opt.val?(editingNotice?C.gold:C.blue):C.textMid,cursor:"pointer",whiteSpace:"nowrap",position:"relative"}}>
                    {opt.label}
                    {filled&&<span style={{width:7,height:7,background:C.green,borderRadius:"50%",position:"absolute",top:8,right:6,display:"inline-block"}}/>}
                  </button>
                );
              })}
            </div>
            {/* 현재 탭 입력 필드 */}
            {[{val:"all",label:t(lang,"noticeLangAll")},{val:"en",label:"EN"},{val:"de",label:"DE"},{val:"es",label:"ES"},{val:"ro",label:"RO"},{val:"ru",label:"RU"}].map(opt=>
              noticeForm._tab===opt.val&&(
                <div key={opt.val} style={{padding:"14px 16px 16px"}}>
                  <div style={{fontSize:12,color:C.textMid,marginBottom:10,fontWeight:600}}>
                    {opt.label} — {t(lang,"noticeTitle")} / {t(lang,"noticeContent")}
                  </div>
                  <input style={{...S.input,marginBottom:10,background:"#fff"}}
                    placeholder={t(lang,"noticeTitle")}
                    value={noticeForm[opt.val]?.title||""}
                    onChange={e=>setNoticeForm(p=>({...p,[opt.val]:{...p[opt.val],title:e.target.value}}))}/>
                  <textarea style={{...S.input,minHeight:80,resize:"vertical",marginBottom:10,background:"#fff"}}
                    placeholder={t(lang,"noticeContent")}
                    value={noticeForm[opt.val]?.content||""}
                    onChange={e=>setNoticeForm(p=>({...p,[opt.val]:{...p[opt.val],content:e.target.value}}))}/>
                  <input style={{...S.input,marginBottom:0,background:"#fff"}}
                    placeholder={t(lang,"noticeVideoUrlPlaceholder")}
                    value={noticeForm[opt.val]?.video_url||""}
                    onChange={e=>setNoticeForm(p=>({...p,[opt.val]:{...p[opt.val],video_url:e.target.value}}))}/>
                </div>
              )
            )}
            {/* 저장/수정 버튼 */}
            <div style={{padding:"0 16px 16px",display:"flex",justifyContent:"flex-end",gap:8}}>
              {editingNotice?(
                <button style={{...S.btnBlue,background:C.gold,boxShadow:"0 3px 12px rgba(245,168,0,0.3)"}} onClick={updateNotice}>💾 Save Changes</button>
              ):(
                <button style={S.btnBlue} onClick={addNotice}>{t(lang,"addNotice")}</button>
              )}
            </div>
          </div>

          {/* 공지 목록 */}
          {notices.length===0
            ?<div style={{color:C.textSoft,fontSize:13,textAlign:"center",padding:"24px 0"}}>{t(lang,"noNotices")}</div>
            :notices.map(n=>(
              <div key={n.id} style={{...S.card,marginBottom:12,border:editingNotice===n.id?`2px solid ${C.gold}`:undefined}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                      <div style={{fontWeight:700,fontSize:15,color:C.text}}>{n.title}</div>
                      {n.language&&n.language!=="all"
                        ?<span style={{background:C.blue,color:C.white,borderRadius:10,padding:"2px 9px",fontSize:11,fontWeight:700,flexShrink:0}}>{n.language.toUpperCase()}</span>
                        :<span style={{background:C.blueLight,color:C.textMid,border:`1px solid ${C.border}`,borderRadius:10,padding:"2px 9px",fontSize:11,fontWeight:600,flexShrink:0}}>ALL</span>
                      }
                    </div>
                    <div style={{fontSize:13,color:C.textMid,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{n.content}</div>
                    {n.video_url&&<div style={{fontSize:12,color:C.blue,marginTop:6,wordBreak:"break-all",display:"flex",alignItems:"center",gap:5}}><span>▶</span>{n.video_url}</div>}
                    <div style={{fontSize:11,color:C.textSoft,marginTop:8}}>{new Date(n.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                    <button style={{...S.btnGhost,fontSize:13,padding:"6px 14px",borderColor:C.gold,color:C.gold}} onClick={()=>startEditNotice(n)}>✏️</button>
                    <button style={S.btnDanger} onClick={()=>deleteNotice(n.id)}>{t(lang,"deleteNotice")}</button>
                  </div>
                </div>
              </div>
            ))
          }
        </>)}
      </div>
    </div>
  </>);
}
