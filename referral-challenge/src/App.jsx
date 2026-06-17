import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";
import { LANGS, t } from "./i18n.js";

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
  centerWrap:{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20},
  authBox:{background:C.white,borderRadius:22,border:`1px solid ${C.border}`,boxShadow:"0 8px 40px rgba(0,181,239,0.12)",padding:"44px 40px",width:"100%",maxWidth:420,textAlign:"center"},
  card:{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,padding:"24px",marginBottom:16,boxShadow:"0 2px 14px rgba(0,181,239,0.07)"},
  cardLabel:{fontSize:10,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",color:C.textSoft,marginBottom:16},
  fieldWrap:{marginBottom:14,textAlign:"left"},
  fieldLabel:{display:"block",fontSize:12,fontWeight:600,color:C.textMid,marginBottom:5},
  input:{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 14px",fontSize:14,color:C.text,outline:"none",width:"100%",boxSizing:"border-box",transition:"border-color 0.15s"},
  inputFocus:{borderColor:C.blue},
  btnBlue:{background:C.blue,border:"none",borderRadius:10,padding:"11px 22px",color:C.white,fontWeight:700,fontSize:14,whiteSpace:"nowrap",boxShadow:"0 3px 12px rgba(0,181,239,0.28)"},
  btnBlueBlock:{background:C.blue,border:"none",borderRadius:12,padding:"13px",color:C.white,fontWeight:700,fontSize:15,width:"100%",boxShadow:"0 4px 14px rgba(0,181,239,0.30)"},
  btnOutline:{background:"none",border:`1px solid ${C.border}`,borderRadius:10,padding:"11px",color:C.textMid,fontWeight:500,fontSize:14,width:"100%",marginTop:10},
  btnGhost:{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 13px",fontSize:12,color:C.textMid},
  btnDanger:{background:"none",border:"1px solid #f8c2ce",borderRadius:7,color:C.red,padding:"4px 12px",fontSize:12},
  btnText:{background:"none",border:"none",color:C.blue,fontWeight:700,fontSize:13},
  msgOk:{background:C.greenBg,border:"1px solid #a8e6c2",borderRadius:9,padding:"10px 14px",fontSize:13,color:C.green,marginBottom:14},
  msgErr:{background:C.redBg,border:"1px solid #f8c2ce",borderRadius:9,padding:"10px 14px",fontSize:13,color:C.red,marginBottom:14},
  chip:{display:"inline-flex",alignItems:"center",background:C.blueLight,border:`1px solid ${C.blueMid}`,borderRadius:20,padding:"4px 10px 4px 9px",fontSize:12,color:C.blueDark,margin:"3px",fontWeight:500},
  th:{textAlign:"left",padding:"9px 11px",color:C.textSoft,fontWeight:700,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",whiteSpace:"nowrap"},
  td:{padding:"10px 11px",borderBottom:`1px solid ${C.border}`,fontSize:13},
};

// ── SMALL COMPONENTS ──────────────────────────────────────
function Spinner(){return <span style={{display:"inline-block",width:16,height:16,border:"2.5px solid rgba(255,255,255,0.35)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite",verticalAlign:"middle"}}/>;}
function Msg({state}){if(!state?.text)return null;return <div style={state.type==="ok"?S.msgOk:S.msgErr}>{state.text}</div>;}
function Field({label,...props}){
  const[focused,setFocused]=useState(false);
  return(<div style={S.fieldWrap}>{label&&<label style={S.fieldLabel}>{label}</label>}<input {...props} style={{...S.input,...(focused?S.inputFocus:{}),...(props.style||{})}} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/></div>);
}
function PageSpinner({lang}){return <div style={{textAlign:"center",padding:"70px 0",color:C.textSoft}}><div style={{width:34,height:34,margin:"0 auto 14px",border:`3px solid ${C.blueMid}`,borderTopColor:C.blue,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>{t(lang,"loading")}</div>;}
function MedalBadge({rank}){
  const m=rank===1?{bg:C.gold,fg:"#fff",txt:"🥇"}:rank===2?{bg:C.silver,fg:"#fff",txt:"🥈"}:rank===3?{bg:C.bronze,fg:"#fff",txt:"🥉"}:{bg:C.blueLight,fg:C.blue,txt:String(rank)};
  return <div style={{width:36,height:36,borderRadius:9,flexShrink:0,background:m.bg,color:m.fg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:rank<=3?18:13,marginRight:14,border:rank<=3?"none":`1px solid ${C.border}`}}>{m.txt}</div>;
}
function LangSwitcher({lang,setLang}){return <div style={{display:"flex",gap:4}}>{LANGS.map(l=><button key={l.code} onClick={()=>setLang(l.code)} style={{background:lang===l.code?C.blue:"none",border:`1px solid ${lang===l.code?C.blue:C.border}`,borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700,color:lang===l.code?C.white:C.textSoft,cursor:"pointer"}}>{l.label}</button>)}</div>;}
function Logo({lang}){return(
  <div style={{marginBottom:28}}>
    <div style={{marginBottom:16,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <span style={{fontSize:38,fontWeight:900,color:C.blue,letterSpacing:"0.08em",lineHeight:1}}>ATOMY</span>
      <div style={{width:120,height:1.5,background:C.blueMid}}/>
      <span style={{fontSize:13,fontWeight:700,color:C.blue,letterSpacing:"0.35em"}}>EUROPE</span>
    </div>
    <div style={{fontSize:20,fontWeight:900,color:C.text,letterSpacing:"-0.4px"}}>{t(lang,"appName")}</div>
    <div style={{fontSize:12,color:C.textSoft,marginTop:4}}>{t(lang,"appSub")}</div>
  </div>
);}
function TypeTag({type,seminar}){
  const isDist=type==="distribution";
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:3}}>
      <span style={{background:isDist?C.orangeLight:C.blueLight,color:isDist?C.orange:C.blue,border:`1px solid ${isDist?"#ffd4b8":C.blueMid}`,borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700,letterSpacing:"0.02em"}}>
        {isDist?"D":"C"}
      </span>
      {seminar&&<span style={{background:C.purpleLight,color:C.purple,border:"1px solid #d8ccf0",borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700}}>S</span>}
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
  const[form,setForm]=useState({name:"",member_no:"",email:"",password:""});
  const[busy,setBusy]=useState(false);const[msg,flash]=useMsg();
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  async function submit(){
    const{name,member_no,email,password}=form;
    const n=name.trim(),m=member_no.trim(),e=email.trim().toLowerCase(),pw=password;
    if(!n||!m||!e||!pw){flash("err",t(lang,"fillAll"));return;}
    if(!/^\d+$/.test(m)){flash("err",t(lang,"numbersOnly"));return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){flash("err",t(lang,"invalidEmail"));return;}
    if(pw.length<6){flash("err",t(lang,"weakPassword"));return;}
    setBusy(true);
    try{
      const{data:dup}=await supabase.from("members").select("member_no,email").or(`member_no.eq.${m},email.eq.${e}`);
      if(dup&&dup.length>0){if(dup[0].member_no===m){flash("err",t(lang,"duplicateMemberNo",{val:m}));return;}flash("err",t(lang,"duplicateEmail"));return;}
      const{data,error}=await supabase.from("members").insert({name:n,member_no:m,email:e,password:pw}).select().single();
      if(error)throw error;
      flash("ok",t(lang,"signupOk"));setTimeout(()=>onSuccess(data),1400);
    }catch(err){flash("err",err.message||t(lang,"errorGeneric"));}finally{setBusy(false);}
  }
  return(<div style={S.centerWrap}><div style={S.authBox}>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><LangSwitcher lang={lang} setLang={setLang}/></div>
    <Logo lang={lang}/>
    <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:20}}>{t(lang,"signup")}</div>
    <Msg state={msg}/>
    <Field label={t(lang,"name")} placeholder={t(lang,"namePlaceholder")} value={form.name} onChange={set("name")}/>
    <Field label={t(lang,"memberNo")} placeholder={t(lang,"memberNoPlaceholder")} value={form.member_no} onChange={set("member_no")} inputMode="numeric"/>
    <Field label={t(lang,"email")} type="email" placeholder={t(lang,"emailPlaceholder")} value={form.email} onChange={set("email")}/>
    <Field label={t(lang,"password")} type="password" placeholder={t(lang,"passwordPlaceholder")} value={form.password} onChange={set("password")} onKeyDown={e=>e.key==="Enter"&&submit()}/>
    <button style={{...S.btnBlueBlock,marginTop:6}} onClick={submit} disabled={busy}>{busy?<Spinner/>:t(lang,"signupBtn")}</button>
    <button style={S.btnOutline} onClick={onBack}>{t(lang,"hasAccount")} {t(lang,"loginHere")}</button>
  </div></div>);
}

// ── LOGIN ─────────────────────────────────────────────────
function LoginPage({lang,setLang,onSuccess,onSignup}){
  const[memberNo,setMemberNo]=useState("");const[pw,setPw]=useState("");
  const[busy,setBusy]=useState(false);const[msg,flash]=useMsg();const[showForgot,setShowForgot]=useState(false);
  async function submit(){
    const m=memberNo.trim();if(!m||!pw){flash("err",t(lang,"fillAll"));return;}
    setBusy(true);
    try{
      const{data,error}=await supabase.from("members").select("*").eq("member_no",m).eq("password",pw).maybeSingle();
      if(error)throw error;
      if(!data){const{data:ex}=await supabase.from("members").select("id").eq("member_no",m).maybeSingle();flash("err",ex?t(lang,"wrongPassword"):t(lang,"notRegistered"));return;}
      onSuccess(data);
    }catch(err){flash("err",err.message||t(lang,"errorGeneric"));}finally{setBusy(false);}
  }
  if(showForgot)return <ForgotPasswordPage lang={lang} setLang={setLang} onBack={()=>setShowForgot(false)}/>;
  return(<div style={S.centerWrap}><div style={S.authBox}>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><LangSwitcher lang={lang} setLang={setLang}/></div>
    <Logo lang={lang}/>
    <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:20}}>{t(lang,"login")}</div>
    <Msg state={msg}/>
    <Field label={t(lang,"memberNo")} placeholder={t(lang,"memberNoPlaceholder")} inputMode="numeric" value={memberNo} onChange={e=>setMemberNo(e.target.value)}/>
    <Field label={t(lang,"password")} type="password" placeholder={t(lang,"passwordPlaceholder")} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
    <div style={{textAlign:"right",marginTop:-6,marginBottom:16}}><button style={{...S.btnText,fontSize:12,color:C.textSoft}} onClick={()=>setShowForgot(true)}>{t(lang,"forgotPassword")}</button></div>
    <button style={{...S.btnBlueBlock,marginTop:2}} onClick={submit} disabled={busy}>{busy?<Spinner/>:t(lang,"loginBtn")}</button>
    <div style={{textAlign:"center",marginTop:20,fontSize:13,color:C.textSoft}}>{t(lang,"noAccount")} <button style={S.btnText} onClick={onSignup}>{t(lang,"signupHere")}</button></div>
  </div></div>);
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
      const tempPw=gen();const{error:ue}=await supabase.from("members").update({password:tempPw}).eq("id",data.id);
      if(ue)throw ue;setNewPw(tempPw);flash("ok",t(lang,"tempPwIssued",{name:data.name}));
    }catch(err){flash("err",err.message||t(lang,"errorGeneric"));}finally{setBusy(false);}
  }
  return(<div style={S.centerWrap}><div style={S.authBox}>
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}><LangSwitcher lang={lang} setLang={setLang}/></div>
    <Logo lang={lang}/>
    <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>{t(lang,"forgotPassword")}</div>
    <div style={{fontSize:13,color:C.textSoft,marginBottom:24}}>{t(lang,"forgotPasswordDesc")}</div>
    <Msg state={msg}/>
    {newPw?(<div style={{background:C.blueLight,border:`2px solid ${C.blue}`,borderRadius:12,padding:"20px",marginBottom:20}}>
      <div style={{fontSize:12,color:C.textMid,marginBottom:8,fontWeight:600}}>{t(lang,"tempPwLabel")}</div>
      <div style={{fontSize:28,fontWeight:900,color:C.blue,letterSpacing:"0.15em",fontFamily:"monospace"}}>{newPw}</div>
      <div style={{fontSize:11,color:C.textSoft,marginTop:8}}>{t(lang,"tempPwNote")}</div>
    </div>):(<>
      <Field label={t(lang,"email")} type="email" placeholder={t(lang,"emailPlaceholder")} value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
      <button style={{...S.btnBlueBlock,marginTop:6}} onClick={submit} disabled={busy}>{busy?<Spinner/>:t(lang,"resetPasswordBtn")}</button>
    </>)}
    <button style={S.btnOutline} onClick={onBack}>{t(lang,"backToLogin")}</button>
  </div></div>);
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
    if(!/^\d{7}$/.test(val)){flashRef("err",t(lang,"numbersOnly"));return;}
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

  return(<div style={S.page}>
    {/* 헤더 */}
    <header style={{background:C.white,borderBottom:`1px solid ${C.border}`,boxShadow:"0 2px 10px rgba(0,181,239,0.07)",position:"sticky",top:0,zIndex:50}}>
      <div style={{maxWidth:760,margin:"0 auto",padding:"0 20px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:20,fontWeight:900,color:C.blue,letterSpacing:"-0.5px"}}>ATOMY</span>
          <span style={{fontSize:10,fontWeight:700,color:C.blueDark,letterSpacing:"0.2em",borderLeft:`2px solid ${C.blueMid}`,paddingLeft:6}}>EUROPE</span>
          <span style={{fontSize:13,fontWeight:700,color:C.textMid,borderLeft:`1px solid ${C.border}`,paddingLeft:8,marginLeft:2}}>{t(lang,"appName")}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <LangSwitcher lang={lang} setLang={setLang}/>
          <div style={{background:C.blueLight,border:`1px solid ${C.blueMid}`,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600,color:C.blueDark}}>{user.is_admin?"⚙️":"👤"} {user.name}</div>
          <button style={S.btnGhost} onClick={onLogout}>{t(lang,"logout")}</button>
        </div>
      </div>
    </header>

    <main style={{maxWidth:760,margin:"0 auto",padding:"24px 20px 60px"}}>
      {busy?<PageSpinner lang={lang}/>:(
        <>
          {/* 공지사항 */}
          {notices.length>0&&(
            <div style={{...S.card,background:"linear-gradient(135deg,#E6F7FD,#fff)",border:`1.5px solid ${C.blue}30`}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.15em",textTransform:"uppercase",color:C.blue,marginBottom:12}}>{t(lang,"announcements")}</div>
              {notices.map(n=>(
                <div key={n.id} style={{marginBottom:notices.length>1?12:0,paddingBottom:notices.length>1?12:0,borderBottom:notices.length>1?`1px solid ${C.border}`:"none"}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:4}}>{n.title}</div>
                  <div style={{fontSize:13,color:C.textMid,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{n.content}</div>
                  <div style={{fontSize:11,color:C.textSoft,marginTop:4}}>{new Date(n.created_at).toLocaleDateString()}</div>
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
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:myRefs.length>0?20:0}}>
                  {/* 1행: Total 2칸 */}
                  <div style={{gridColumn:"1/-1",background:C.blue,borderRadius:12,padding:"16px",textAlign:"center",boxShadow:`0 4px 16px ${C.blue}40`}}>
                    <div style={{fontSize:30,fontWeight:900,lineHeight:1,color:C.white}}>{myRefs.length}</div>
                    <div style={{fontSize:11,marginTop:4,color:"rgba(255,255,255,0.8)"}}>{t(lang,"totalReferrals")}</div>
                  </div>
                  {/* 2행: Distribution + Consumer */}
                  <div style={{background:C.orangeLight,borderRadius:12,padding:"14px",textAlign:"center",border:`1px solid ${C.orange}30`}}>
                    <div style={{fontSize:24,fontWeight:900,lineHeight:1,color:C.orange}}>{myDist.length}</div>
                    <div style={{fontSize:11,marginTop:4,color:C.textMid}}>{t(lang,"distribution")}</div>
                  </div>
                  <div style={{background:C.blueLight,borderRadius:12,padding:"14px",textAlign:"center",border:`1px solid ${C.blueMid}`}}>
                    <div style={{fontSize:24,fontWeight:900,lineHeight:1,color:C.blue}}>{myCon.length}</div>
                    <div style={{fontSize:11,marginTop:4,color:C.textMid}}>{t(lang,"consumer")}</div>
                  </div>
                  {/* 3행: Seminar 2칸 반높이 + Rank */}
                  <div style={{background:C.purpleLight,borderRadius:12,padding:"10px 14px",textAlign:"center",border:`1px solid ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                    <div style={{fontSize:20,fontWeight:900,color:C.purple}}>{mySem.length}</div>
                    <div style={{fontSize:11,color:C.textMid}}>{t(lang,"seminar")}</div>
                  </div>
                  <div style={{background:C.tealLight,borderRadius:12,padding:"10px 14px",textAlign:"center",border:`1px solid ${C.teal}30`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                    <div style={{fontSize:20,fontWeight:900,color:C.teal}}>#{myRank}</div>
                    <div style={{fontSize:11,color:C.textMid}}>{t(lang,"currentRank")}</div>
                  </div>
                </div>
                {myRefs.length>0&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:C.textSoft,letterSpacing:"0.08em",marginBottom:8}}>{t(lang,"myList")}</div>
                    <div>{myRefs.map(r=><span key={r.id} style={S.chip}><TypeTag type={r.type} seminar={r.seminar}/><span style={{marginLeft:5}}>{r.referred_no}</span></span>)}</div>
                  </div>
                )}
              </div>

              {/* 추천 등록 */}
              <div style={S.card}>
                <div style={S.cardLabel}>{t(lang,"addReferralTitle")}</div>
                <div style={{background:C.blueLight,border:`1px solid ${C.blueMid}`,borderRadius:10,padding:"12px 15px",fontSize:13,color:C.blueDark,lineHeight:1.75,marginBottom:18}}>{t(lang,"addReferralDesc")}</div>
                <Msg state={refMsg}/>
                {/* 유형 선택 */}
                <div style={S.fieldWrap}>
                  <label style={S.fieldLabel}>{t(lang,"memberType")}</label>
                  <div style={{display:"flex",gap:10}}>
                    {[{val:"distribution",label:t(lang,"typeDistribution"),color:C.orange,light:C.orangeLight,border:"#ffd4b8"},{val:"consumer",label:t(lang,"typeConsumer"),color:C.blue,light:C.blueLight,border:C.blueMid}].map(opt=>(
                      <button key={opt.val} onClick={()=>setRefType(opt.val)} style={{flex:1,padding:"10px",borderRadius:10,border:`2px solid ${refType===opt.val?opt.color:C.border}`,background:refType===opt.val?opt.light:C.white,color:refType===opt.val?opt.color:C.textMid,fontWeight:refType===opt.val?700:500,fontSize:13,cursor:"pointer",transition:"all 0.15s"}}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                {/* 번호 입력 */}
                <div style={{display:"flex",gap:10,marginBottom:16}}>
                  <input style={{...S.input,flex:1}} placeholder={t(lang,"referralInput")} value={numInput} onChange={e=>setNumInput(e.target.value.replace(/\D/g,"").slice(0,7))} onKeyDown={e=>e.key==="Enter"&&addNum()} inputMode="numeric" maxLength={7}/>
                  <button style={S.btnBlue} onClick={addNum}>{t(lang,"registerBtn")}</button>
                </div>
                {/* 세미나 체크 */}
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:seminar?C.purpleLight:C.bg,border:`1.5px solid ${seminar?C.purple:C.border}`,borderRadius:10,marginBottom:24,transition:"all 0.15s"}}>
                  <input type="checkbox" checked={seminar} onChange={e=>setSeminar(e.target.checked)} style={{width:18,height:18,accentColor:C.purple,cursor:"pointer"}}/>
                  <span style={{fontSize:13,fontWeight:seminar?700:500,color:seminar?C.purple:C.textMid}}>{t(lang,"seminarCheck")}</span>
                </label>
                {/* 내 목록 */}
                <div style={{borderTop:`1px solid ${C.border}`,paddingTop:20}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.textMid}}>{t(lang,"myList")}</span>
                    <span style={{background:C.blue,color:C.white,borderRadius:20,padding:"3px 13px",fontSize:13,fontWeight:700}}>{myRefs.length}</span>
                  </div>
                  {myRefs.length===0
                    ?<div style={{color:C.textSoft,fontSize:13,textAlign:"center",padding:"24px 0",border:`1.5px dashed ${C.border}`,borderRadius:12}}>{t(lang,"emptyList")}</div>
                    :myRefs.map(r=><span key={r.id} style={S.chip}><TypeTag type={r.type} seminar={r.seminar}/><span style={{marginLeft:5}}>{r.referred_no}</span><button onClick={()=>removeNum(r.id)} style={{background:"none",border:"none",color:C.textSoft,cursor:"pointer",marginLeft:6,fontSize:16,lineHeight:1,padding:0}}>×</button></span>)
                  }
                  {/* 범례 */}
                  <div style={{display:"flex",gap:12,marginTop:14,flexWrap:"wrap"}}>
                    {[{tag:"D",label:t(lang,"distribution"),color:C.orange,light:C.orangeLight,border:"#ffd4b8"},{tag:"C",label:t(lang,"consumer"),color:C.blue,light:C.blueLight,border:C.blueMid},{tag:"S",label:t(lang,"seminar"),color:C.purple,light:C.purpleLight,border:"#d8ccf0"}].map(b=>(
                      <span key={b.tag} style={{fontSize:11,color:C.textSoft,display:"flex",alignItems:"center",gap:4}}>
                        <span style={{background:b.light,color:b.color,border:`1px solid ${b.border}`,borderRadius:10,padding:"1px 7px",fontWeight:700}}>{b.tag}</span>{b.label}
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
  const[noticeForm,setNoticeForm]=useState({title:"",content:""});
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
    const{error}=await supabase.from("members").insert({name:n,member_no:m,email:e,password:pw});
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
    const title=noticeForm.title.trim(),content=noticeForm.content.trim();
    if(!title||!content){flashNotice("err",t(lang,"fillAll"));return;}
    const{error}=await supabase.from("notices").insert({title,content});
    if(error){flashNotice("err",error.message);return;}
    setNoticeForm({title:"",content:""});flashNotice("ok",t(lang,"noticeAdded"));onRefresh();
  }
  async function deleteNotice(id){
    await supabase.from("notices").delete().eq("id",id);
    flashNotice("ok",t(lang,"noticeDeleted"));onRefresh();
  }

  // 엑셀 다운로드
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

  // 랭킹 데이터
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {/* 1행: Total Members 2칸 */}
        <div style={{gridColumn:"1/-1",background:C.blue,borderRadius:12,padding:"16px",textAlign:"center",boxShadow:`0 4px 16px ${C.blue}40`}}>
          <div style={{fontSize:30,fontWeight:900,color:C.white,lineHeight:1}}>{members.length}</div>
          <div style={{fontSize:11,marginTop:4,color:"rgba(255,255,255,0.8)"}}>{t(lang,"totalMembers")}</div>
        </div>
        {/* 2행: Registered 2칸 */}
        <div style={{gridColumn:"1/-1",background:C.tealLight,borderRadius:12,padding:"16px",textAlign:"center",border:`1px solid ${C.teal}30`}}>
          <div style={{fontSize:28,fontWeight:900,color:C.teal,lineHeight:1}}>{allNums.size}</div>
          <div style={{fontSize:11,marginTop:4,color:C.textMid}}>{t(lang,"totalRegistered")}</div>
        </div>
        {/* 3행: Distribution + Consumer */}
        <div style={{background:C.orangeLight,borderRadius:12,padding:"14px",textAlign:"center",border:`1px solid ${C.orange}30`}}>
          <div style={{fontSize:24,fontWeight:900,color:C.orange,lineHeight:1}}>{totalDist}</div>
          <div style={{fontSize:11,marginTop:4,color:C.textMid}}>{t(lang,"distribution")}</div>
        </div>
        <div style={{background:C.blueLight,borderRadius:12,padding:"14px",textAlign:"center",border:`1px solid ${C.blueMid}`}}>
          <div style={{fontSize:24,fontWeight:900,color:C.blue,lineHeight:1}}>{totalCon}</div>
          <div style={{fontSize:11,marginTop:4,color:C.textMid}}>{t(lang,"consumer")}</div>
        </div>
        {/* 4행: Seminar 2칸 반높이 */}
        <div style={{gridColumn:"1/-1",background:C.purpleLight,borderRadius:12,padding:"10px 14px",textAlign:"center",border:`1px solid ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
          <div style={{fontSize:22,fontWeight:900,color:C.purple}}>{totalSem}</div>
          <div style={{fontSize:11,color:C.textMid}}>{t(lang,"seminar")}</div>
        </div>
      </div>

      {/* TOP 1 하이라이트 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {[
          {title:"Overall #1",member:top1Overall,count:top1Overall?.referral_count,color:C.gold},
          {title:t(lang,"no1Distribution"),member:top1Dist,count:top1Dist?.distribution_count,color:C.orange},
          {title:t(lang,"no1Consumer"),member:top1Con,count:top1Con?.consumer_count,color:C.blue},
        ].map((s,i)=>s.member&&(
          <div key={i} style={{background:s.color+"12",border:`1.5px solid ${s.color}40`,borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:9,fontWeight:800,color:s.color,letterSpacing:"0.1em",marginBottom:6,textTransform:"uppercase"}}>{s.title}</div>
            <div style={{fontWeight:700,fontSize:14,color:C.text}}>{s.member.name}</div>
            <div style={{fontSize:11,color:C.textSoft}}>#{s.member.member_no}</div>
            <div style={{fontSize:22,fontWeight:900,color:s.color,marginTop:4}}>{s.count}</div>
          </div>
        ))}
      </div>
    </div>

    {/* 탭 패널 */}
    <div style={{background:C.white,borderRadius:16,border:`1px solid ${C.border}`,boxShadow:"0 2px 14px rgba(0,181,239,0.07)",marginBottom:16,overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`}}>
        {tabs.map(tab=>(
          <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{flex:1,background:"none",border:"none",padding:"13px 8px",fontSize:12,fontWeight:activeTab===tab.key?700:500,color:activeTab===tab.key?C.blue:C.textMid,borderBottom:activeTab===tab.key?`2.5px solid ${C.blue}`:"2.5px solid transparent",cursor:"pointer"}}>{tab.label}</button>
        ))}
      </div>

      <div style={{padding:"24px"}}>

        {/* 랭킹 */}
        {activeTab==="leaderboard"&&(<>
          {/* 랭킹 서브탭 */}
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            {rankTabs.map(rt=>(
              <button key={rt.key} onClick={()=>setRankTab(rt.key)} style={{padding:"7px 16px",borderRadius:20,border:`1.5px solid ${rankTab===rt.key?C.blue:C.border}`,background:rankTab===rt.key?C.blueLight:"none",color:rankTab===rt.key?C.blue:C.textMid,fontWeight:rankTab===rt.key?700:500,fontSize:13,cursor:"pointer"}}>{rt.label}</button>
            ))}
          </div>
          {currentRanking.length===0
            ?<div style={{color:C.textSoft,fontSize:13,textAlign:"center",padding:"24px 0"}}>No members yet</div>
            :currentRanking.map((m,i)=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",padding:"11px 14px",borderRadius:11,marginBottom:6,background:i===0?C.blueLight:C.white,border:`1px solid ${i===0?C.blueMid:C.border}`}}>
                <MedalBadge rank={i+1}/>
                <div style={{flex:1}}>
                  <span style={{fontWeight:600,fontSize:15,color:C.text}}>{m.name}</span>
                  <span style={{fontSize:12,color:C.textSoft,marginLeft:7}}>#{m.member_no}</span>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {rankTab==="overall"&&<>
                    <span style={{background:C.orangeLight,color:C.orange,borderRadius:12,padding:"2px 9px",fontSize:12,fontWeight:700}}>D {m.distribution_count}</span>
                    <span style={{background:C.blueLight,color:C.blue,borderRadius:12,padding:"2px 9px",fontSize:12,fontWeight:700}}>C {m.consumer_count}</span>
                  </>}
                  {m.seminar_count>0&&<span style={{background:C.purpleLight,color:C.purple,borderRadius:12,padding:"2px 9px",fontSize:12,fontWeight:700}}>S {m.seminar_count}</span>}
                  <span style={{background:i===0?C.blue:C.blueLight,color:i===0?C.white:C.blue,borderRadius:20,padding:"5px 13px",fontWeight:800,fontSize:14,marginLeft:4}}>{m[countKey]}</span>
                </div>
              </div>
            ))
          }
        </>)}

        {/* 상세 테이블 */}
        {activeTab==="details"&&(
          <div style={{overflowX:"auto"}}>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
              <button style={{...S.btnBlue,fontSize:13,padding:"8px 16px"}} onClick={downloadExcel}>⬇ {t(lang,"downloadExcel")}</button>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
                {[t(lang,"memberName"),t(lang,"memberNo"),"D","C","S",t(lang,"referralCount"),t(lang,"registeredNos")].map((h,i)=><th key={i} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {ranking.map((m,i)=>{
                  const refs=refMap[m.id]||[];
                  return(<tr key={m.id}>
                    <td style={{...S.td,fontWeight:600,color:C.text}}>{m.name}</td>
                    <td style={{...S.td,fontFamily:"monospace",color:C.textMid}}>{m.member_no}</td>
                    <td style={S.td}><span style={{color:C.orange,fontWeight:700}}>{m.distribution_count}</span></td>
                    <td style={S.td}><span style={{color:C.blue,fontWeight:700}}>{m.consumer_count}</span></td>
                    <td style={S.td}><span style={{color:C.purple,fontWeight:700}}>{m.seminar_count}</span></td>
                    <td style={S.td}><span style={{background:C.blue,color:C.white,borderRadius:12,padding:"3px 10px",fontWeight:700,fontSize:12}}>{m.referral_count}</span></td>
                    <td style={S.td}>
                      {refs.length===0?<span style={{color:C.textSoft}}>—</span>
                        :refs.map(r=><span key={r.id} style={{...S.chip,fontSize:11,margin:"2px",padding:"2px 7px"}}><TypeTag type={r.type} seminar={r.seminar}/><span style={{marginLeft:4}}>{r.referred_no}</span></span>)
                      }
                    </td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 회원 관리 */}
        {activeTab==="members"&&(<>
          <Msg state={adminMsg}/>
          <div style={{background:C.blueLight,border:`1px solid ${C.blueMid}`,borderRadius:12,padding:"16px",marginBottom:22}}>
            <div style={{fontSize:11,fontWeight:800,color:C.blue,letterSpacing:"0.1em",marginBottom:12}}>{t(lang,"addMemberTitle")}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[{k:"name",ph:t(lang,"name"),type:"text"},{k:"member_no",ph:t(lang,"memberNo"),type:"text",mode:"numeric"},{k:"email",ph:t(lang,"email"),type:"email"},{k:"password",ph:t(lang,"password"),type:"password"}].map(f=>(
                <input key={f.k} style={{...S.input,flex:1,minWidth:110}} type={f.type} placeholder={f.ph} inputMode={f.mode} value={newM[f.k]} onChange={set(f.k)}/>
              ))}
              <button style={S.btnBlue} onClick={addMember} disabled={adminBusy}>{adminBusy?<Spinner/>:t(lang,"addMember")}</button>
            </div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
                {[t(lang,"memberName"),t(lang,"memberNo"),t(lang,"email"),"D","C","S",t(lang,"joinDate"),""].map((h,i)=><th key={i} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {members.map(m=>{
                  const refs=refMap[m.id]||[];
                  return(<tr key={m.id}>
                    <td style={{...S.td,fontWeight:600,color:C.text}}>{m.name}</td>
                    <td style={{...S.td,fontFamily:"monospace",color:C.textMid}}>{m.member_no}</td>
                    <td style={{...S.td,color:C.textSoft,fontSize:12}}>{m.email}</td>
                    <td style={S.td}><span style={{color:C.orange,fontWeight:700}}>{refs.filter(r=>r.type==="distribution").length}</span></td>
                    <td style={S.td}><span style={{color:C.blue,fontWeight:700}}>{refs.filter(r=>r.type==="consumer").length}</span></td>
                    <td style={S.td}><span style={{color:C.purple,fontWeight:700}}>{refs.filter(r=>r.seminar).length}</span></td>
                    <td style={{...S.td,color:C.textSoft,fontSize:12,whiteSpace:"nowrap"}}>{new Date(m.created_at).toLocaleDateString()}</td>
                    <td style={S.td}><button style={S.btnDanger} onClick={()=>deleteMember(m.id,m.name)}>{t(lang,"delete")}</button></td>
                  </tr>);
                })}
                {members.length===0&&<tr><td colSpan={8} style={{...S.td,textAlign:"center",color:C.textSoft,padding:24}}>—</td></tr>}
              </tbody>
            </table>
          </div>
        </>)}

        {/* 공지사항 관리 */}
        {activeTab==="notices"&&(<>
          <Msg state={noticeMsg}/>
          <div style={{background:C.blueLight,border:`1px solid ${C.blueMid}`,borderRadius:12,padding:"16px",marginBottom:22}}>
            <div style={{fontSize:11,fontWeight:800,color:C.blue,letterSpacing:"0.1em",marginBottom:12}}>{t(lang,"addNotice")}</div>
            <input style={{...S.input,marginBottom:10}} placeholder={t(lang,"noticeTitle")} value={noticeForm.title} onChange={e=>setNoticeForm(p=>({...p,title:e.target.value}))}/>
            <textarea style={{...S.input,minHeight:80,resize:"vertical",marginBottom:10}} placeholder={t(lang,"noticeContent")} value={noticeForm.content} onChange={e=>setNoticeForm(p=>({...p,content:e.target.value}))}/>
            <button style={S.btnBlue} onClick={addNotice}>{t(lang,"addNotice")}</button>
          </div>
          {notices.length===0
            ?<div style={{color:C.textSoft,fontSize:13,textAlign:"center",padding:"24px 0"}}>{t(lang,"noNotices")}</div>
            :notices.map(n=>(
              <div key={n.id} style={{...S.card,marginBottom:12}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:6}}>{n.title}</div>
                    <div style={{fontSize:13,color:C.textMid,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{n.content}</div>
                    <div style={{fontSize:11,color:C.textSoft,marginTop:8}}>{new Date(n.created_at).toLocaleDateString()}</div>
                  </div>
                  <button style={S.btnDanger} onClick={()=>deleteNotice(n.id)}>{t(lang,"deleteNotice")}</button>
                </div>
              </div>
            ))
          }
        </>)}
      </div>
    </div>
  </>);
}
