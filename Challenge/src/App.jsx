import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

// ═══════════════════════════════════════════════════════════
//  DESIGN TOKENS  —  PANTONE 2995C  (#00B5EF)
// ═══════════════════════════════════════════════════════════
const C = {
  blue:      "#00B5EF",
  blueDark:  "#0090C8",
  blueLight: "#E6F7FD",
  blueMid:   "#B3E8FA",
  white:     "#FFFFFF",
  bg:        "#F4FAFD",
  border:    "#CBE9F7",
  text:      "#0A2535",
  textMid:   "#3D7290",
  textSoft:  "#7EB3CC",
  gold:      "#F5A800",
  silver:    "#9BAAB5",
  bronze:    "#B87040",
  red:       "#D93050",
  redBg:     "#FEF1F3",
  green:     "#0BAF5A",
  greenBg:   "#EDFAF3",
};

// ═══════════════════════════════════════════════════════════
//  STYLE HELPERS
// ═══════════════════════════════════════════════════════════
const S = {
  // 레이아웃
  page: {
    minHeight: "100vh",
    background: C.bg,
  },
  centerWrap: {
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  authBox: {
    background: C.white,
    borderRadius: 22,
    border: `1px solid ${C.border}`,
    boxShadow: "0 8px 40px rgba(0,181,239,0.12)",
    padding: "48px 40px",
    width: "100%",
    maxWidth: 400,
  },
  content: {
    maxWidth: 740,
    margin: "0 auto",
    padding: "28px 24px 80px",
  },

  // 카드
  card: {
    background: C.white,
    borderRadius: 16,
    border: `1px solid ${C.border}`,
    padding: "26px",
    marginBottom: 16,
    boxShadow: "0 2px 14px rgba(0,181,239,0.07)",
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: C.textSoft,
    marginBottom: 16,
  },

  // 폼
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: C.textMid,
    marginBottom: 5,
  },
  input: {
    background: C.white,
    border: `1.5px solid ${C.border}`,
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 14,
    color: C.text,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  inputActive: { borderColor: C.blue },

  // 버튼
  btnBlue: {
    background: C.blue,
    border: "none",
    borderRadius: 10,
    padding: "11px 22px",
    color: C.white,
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: "nowrap",
    boxShadow: "0 3px 12px rgba(0,181,239,0.28)",
    transition: "opacity 0.15s",
  },
  btnBlueBlock: {
    background: C.blue,
    border: "none",
    borderRadius: 12,
    padding: "13px",
    color: C.white,
    fontWeight: 700,
    fontSize: 15,
    width: "100%",
    boxShadow: "0 4px 14px rgba(0,181,239,0.30)",
  },
  btnOutline: {
    background: "none",
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "11px",
    color: C.textMid,
    fontWeight: 500,
    fontSize: 14,
    width: "100%",
    marginTop: 10,
  },
  btnGhost: {
    background: "none",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "5px 13px",
    fontSize: 12,
    color: C.textMid,
  },
  btnDanger: {
    background: "none",
    border: "1px solid #f8c2ce",
    borderRadius: 7,
    color: C.red,
    padding: "4px 12px",
    fontSize: 12,
  },
  btnText: {
    background: "none",
    border: "none",
    color: C.blue,
    fontWeight: 700,
    fontSize: 13,
  },

  // 알림
  msgOk: {
    background: C.greenBg,
    border: "1px solid #a8e6c2",
    borderRadius: 9,
    padding: "10px 14px",
    fontSize: 13,
    color: C.green,
    marginBottom: 14,
  },
  msgErr: {
    background: C.redBg,
    border: "1px solid #f8c2ce",
    borderRadius: 9,
    padding: "10px 14px",
    fontSize: 13,
    color: C.red,
    marginBottom: 14,
  },

  // 칩
  chip: {
    display: "inline-flex",
    alignItems: "center",
    background: C.blueLight,
    border: `1px solid ${C.blueMid}`,
    borderRadius: 20,
    padding: "5px 11px 5px 10px",
    fontSize: 13,
    color: C.blueDark,
    margin: "3px",
    fontWeight: 500,
  },

  // 테이블
  th: {
    textAlign: "left",
    padding: "9px 11px",
    color: C.textSoft,
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 11px",
    borderBottom: `1px solid ${C.border}`,
    fontSize: 13,
  },
};

// ═══════════════════════════════════════════════════════════
//  SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════

function Spinner({ color = "#fff" }) {
  return (
    <span style={{
      display: "inline-block",
      width: 16, height: 16,
      border: `2.5px solid rgba(255,255,255,0.35)`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      verticalAlign: "middle",
    }} />
  );
}

function Msg({ state }) {
  if (!state.text) return null;
  return <div style={state.type === "ok" ? S.msgOk : S.msgErr}>{state.text}</div>;
}

function Field({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={S.fieldWrap}>
      {label && <label style={S.fieldLabel}>{label}</label>}
      <input
        {...props}
        style={{ ...S.input, ...(focused ? S.inputActive : {}), ...(props.style || {}) }}
        onFocus={e => { setFocused(true);  props.onFocus?.(e); }}
        onBlur={e  => { setFocused(false); props.onBlur?.(e);  }}
      />
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 32 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, fontSize: 22,
        background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
        boxShadow: `0 4px 14px rgba(0,181,239,0.35)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>🏆</div>
      <div>
        <div style={{ fontSize: 21, fontWeight: 900, color: C.text, letterSpacing: "-0.4px" }}>
          추천 <span style={{ color: C.blue }}>챌린지</span>
        </div>
        <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>Referral Challenge</div>
      </div>
    </div>
  );
}

function HeaderLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, fontSize: 15,
        background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>🏆</div>
      <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: "-0.3px" }}>
        추천 <span style={{ color: C.blue }}>챌린지</span>
      </span>
    </div>
  );
}

function PageLoading() {
  return (
    <div style={{ textAlign: "center", padding: "70px 0", color: C.textSoft }}>
      <div style={{
        width: 34, height: 34, margin: "0 auto 14px",
        border: `3px solid ${C.blueMid}`, borderTopColor: C.blue,
        borderRadius: "50%", animation: "spin 0.8s linear infinite",
      }} />
      데이터를 불러오는 중...
    </div>
  );
}

function EmptyBox({ text }) {
  return (
    <div style={{
      color: C.textSoft, fontSize: 13, textAlign: "center",
      padding: "26px 0", border: `1.5px dashed ${C.border}`, borderRadius: 12,
    }}>{text}</div>
  );
}

function StatBox({ value, label, highlight }) {
  return (
    <div style={{
      flex: 1, minWidth: 100, textAlign: "center",
      background: highlight ? C.blue : C.blueLight,
      borderRadius: 12, padding: "18px 14px",
      border: `1px solid ${highlight ? C.blueDark : C.blueMid}`,
      boxShadow: highlight ? "0 4px 16px rgba(0,181,239,0.25)" : "none",
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, color: highlight ? C.white : C.blue }}>
        {value}
      </div>
      <div style={{ fontSize: 11, marginTop: 5, color: highlight ? "rgba(255,255,255,0.75)" : C.textMid }}>
        {label}
      </div>
    </div>
  );
}

function MedalBadge({ rank }) {
  const map = {
    1: { bg: "#F5A800", fg: "#fff", text: "🥇" },
    2: { bg: "#9BAAB5", fg: "#fff", text: "🥈" },
    3: { bg: "#B87040", fg: "#fff", text: "🥉" },
  };
  const m = map[rank] || { bg: C.blueLight, fg: C.blue, text: String(rank) };
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
      background: m.bg, color: m.fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: rank <= 3 ? 18 : 13,
      marginRight: 14,
      border: rank <= 3 ? "none" : `1px solid ${C.border}`,
    }}>{m.text}</div>
  );
}

// ═══════════════════════════════════════════════════════════
//  HOOKS
// ═══════════════════════════════════════════════════════════
function useMsg() {
  const [state, setState] = useState({ type: "", text: "" });
  const flash = useCallback((type, text, ms = 3500) => {
    setState({ type, text });
    setTimeout(() => setState({ type: "", text: "" }), ms);
  }, []);
  return [state, flash];
}

// ═══════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("login"); // "login" | "signup" | "main"
  const [user,   setUser]   = useState(null);

  // 세션 복원 (새로고침 유지)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("rc_user");
      if (saved) { setUser(JSON.parse(saved)); setScreen("main"); }
    } catch {}
  }, []);

  function handleLogin(member) {
    setUser(member);
    sessionStorage.setItem("rc_user", JSON.stringify(member));
    setScreen("main");
  }

  function handleLogout() {
    setUser(null);
    sessionStorage.removeItem("rc_user");
    setScreen("login");
  }

  if (screen === "signup") return <SignupPage onSuccess={handleLogin} onBack={() => setScreen("login")} />;
  if (screen === "login")  return <LoginPage  onSuccess={handleLogin} onSignup={() => setScreen("signup")} />;
  return <MainPage user={user} onLogout={handleLogout} />;
}

// ═══════════════════════════════════════════════════════════
//  SIGNUP PAGE
// ═══════════════════════════════════════════════════════════
function SignupPage({ onSuccess, onBack }) {
  const [form, setForm]     = useState({ name: "", member_no: "", email: "" });
  const [busy, setBusy]     = useState(false);
  const [msg,  flash]       = useMsg();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    const { name, member_no, email } = form;
    const n = name.trim(), m = member_no.trim(), e = email.trim().toLowerCase();

    if (!n || !m || !e)          { flash("err", "모든 항목을 입력해주세요.");           return; }
    if (!/^\d+$/.test(m))        { flash("err", "회원번호는 숫자만 입력 가능합니다."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      flash("err", "올바른 이메일 주소를 입력해주세요."); return;
    }

    setBusy(true);
    try {
      // 중복 체크
      const { data: dup } = await supabase
        .from("members")
        .select("id, member_no, email")
        .or(`member_no.eq.${m},email.eq.${e}`);

      if (dup && dup.length > 0) {
        const dupe = dup[0];
        if (dupe.member_no === m) { flash("err", `회원번호 ${m}은 이미 사용 중입니다.`); return; }
        flash("err", "이미 등록된 이메일 주소입니다."); return;
      }

      const { data, error } = await supabase
        .from("members")
        .insert({ name: n, member_no: m, email: e })
        .select()
        .single();

      if (error) throw error;

      flash("ok", "✓ 가입 완료! 잠시 후 이동합니다.");
      setTimeout(() => onSuccess(data), 1400);
    } catch (err) {
      flash("err", err.message || "가입 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.centerWrap}>
      <div style={S.authBox}>
        <Logo />
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>회원가입</div>
        <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 24 }}>
          이름, 회원번호, 이메일로 가입하세요
        </div>

        <Msg state={msg} />

        <Field
          label="이름"
          placeholder="홍길동"
          value={form.name}
          onChange={set("name")}
        />
        <Field
          label="회원번호"
          placeholder="숫자만 입력 (예: 1001)"
          inputMode="numeric"
          value={form.member_no}
          onChange={set("member_no")}
        />
        <Field
          label="이메일"
          type="email"
          placeholder="example@email.com"
          value={form.email}
          onChange={set("email")}
          onKeyDown={e => e.key === "Enter" && submit()}
        />

        <button style={{ ...S.btnBlueBlock, marginTop: 6 }} onClick={submit} disabled={busy}>
          {busy ? <Spinner /> : "가입하기"}
        </button>
        <button style={S.btnOutline} onClick={onBack}>
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════
function LoginPage({ onSuccess, onSignup }) {
  const [memberNo, setMemberNo] = useState("");
  const [pw,       setPw]       = useState("");
  const [busy,     setBusy]     = useState(false);
  const [msg,      flash]       = useMsg();

  async function submit() {
    const m = memberNo.trim();
    if (!m) { flash("err", "회원번호를 입력해주세요."); return; }

    setBusy(true);
    try {
      const adminPw = import.meta.env.VITE_ADMIN_PASSWORD;

      // 관리자 로그인 (회원번호 + 비밀번호)
      if (pw) {
        if (pw !== adminPw) { flash("err", "비밀번호가 틀렸습니다."); return; }
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .eq("member_no", m)
          .eq("is_admin", true)
          .maybeSingle();
        if (error) throw error;
        if (!data) { flash("err", "관리자 계정을 찾을 수 없습니다."); return; }
        onSuccess(data);
        return;
      }

      // 일반 회원 로그인 (회원번호만)
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("member_no", m)
        .eq("is_admin", false)
        .maybeSingle();
      if (error) throw error;
      if (!data) { flash("err", "등록되지 않은 회원번호입니다. 먼저 가입해주세요."); return; }
      onSuccess(data);
    } catch (err) {
      flash("err", err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.centerWrap}>
      <div style={S.authBox}>
        <Logo />
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 6 }}>로그인</div>
        <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 24 }}>
          회원번호로 접속하세요
        </div>

        <Msg state={msg} />

        <Field
          label="회원번호"
          placeholder="회원번호 입력"
          inputMode="numeric"
          value={memberNo}
          onChange={e => setMemberNo(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        <Field
          label="비밀번호 (관리자만 입력)"
          type="password"
          placeholder="일반 회원은 비워두세요"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />

        <button style={{ ...S.btnBlueBlock, marginTop: 6 }} onClick={submit} disabled={busy}>
          {busy ? <Spinner /> : "로그인"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.textSoft }}>
          아직 회원이 아니신가요?{" "}
          <button style={S.btnText} onClick={onSignup}>
            지금 가입하기 →
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE (로그인 후)
// ═══════════════════════════════════════════════════════════
function MainPage({ user, onLogout }) {
  const [tab,    setTab]    = useState(user.is_admin ? "admin" : "manage");
  const [myRefs, setMyRefs] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [allNums, setAllNums] = useState(new Set());
  const [busy, setBusy]     = useState(true);
  const [numInput, setNumInput] = useState("");
  const [refMsg, flashRef]  = useMsg();

  const load = useCallback(async () => {
    setBusy(true);
    try {
      // 전체 추천 번호 집합
      const { data: allR } = await supabase.from("referrals").select("referred_no");
      setAllNums(new Set((allR || []).map(r => r.referred_no)));

      // 내 추천 목록
      if (!user.is_admin) {
        const { data: mine } = await supabase
          .from("referrals")
          .select("*")
          .eq("recruiter_id", user.id)
          .order("created_at");
        setMyRefs(mine || []);
      }

      // 랭킹
      const { data: rank } = await supabase.from("ranking_view").select("*");
      setRanking(rank || []);
    } finally {
      setBusy(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // 번호 추가
  async function addNum() {
    const val = numInput.trim();
    if (!val) return;
    if (!/^\d+$/.test(val)) { flashRef("err", "회원번호는 숫자만 입력 가능합니다."); return; }
    if (allNums.has(val)) {
      const isMine = myRefs.some(r => r.referred_no === val);
      flashRef("err", isMine
        ? `회원번호 ${val}은 이미 내 목록에 있습니다.`
        : `회원번호 ${val}은 이미 다른 회원이 등록했습니다.`
      );
      return;
    }
    const { error } = await supabase
      .from("referrals")
      .insert({ recruiter_id: user.id, referred_no: val });
    if (error) {
      flashRef("err", error.code === "23505"
        ? `회원번호 ${val}은 이미 등록된 번호입니다.`
        : error.message
      );
      return;
    }
    setNumInput("");
    flashRef("ok", `✓ 회원번호 ${val} 등록 완료!`);
    load();
  }

  // 번호 삭제
  async function removeNum(id) {
    await supabase.from("referrals").delete().eq("id", id);
    load();
  }

  const myRankIdx = ranking.findIndex(r => r.id === user.id);
  const myRank    = myRankIdx >= 0 ? myRankIdx + 1 : "-";

  return (
    <div style={S.page}>
      {/* ── 헤더 ── */}
      <header style={{
        background: C.white,
        borderBottom: `1px solid ${C.border}`,
        boxShadow: "0 2px 10px rgba(0,181,239,0.07)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 740, margin: "0 auto", padding: "0 24px",
          height: 62, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <HeaderLogo />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              background: C.blueLight, border: `1px solid ${C.blueMid}`,
              borderRadius: 20, padding: "5px 14px",
              fontSize: 13, fontWeight: 600, color: C.blueDark,
            }}>
              {user.is_admin ? "⚙️" : "👤"}&nbsp;{user.name}
            </div>
            <button style={S.btnGhost} onClick={onLogout}>로그아웃</button>
          </div>
        </div>

        {/* 탭 */}
        <nav style={{ maxWidth: 740, margin: "0 auto", padding: "0 24px", display: "flex" }}>
          {!user.is_admin && (
            <TabButton active={tab === "manage"} onClick={() => setTab("manage")}>
              ➕ 추천 등록
            </TabButton>
          )}
          {user.is_admin && (
            <TabButton active={tab === "admin"} onClick={() => setTab("admin")}>
              ⚙️ 관리자
            </TabButton>
          )}
        </nav>
      </header>

      {/* ── 본문 ── */}
      <main style={S.content}>
        {busy ? <PageLoading /> : (
          <>
            {/* 일반 회원 내 현황 */}
            {!user.is_admin && (
              <div style={S.card}>
                <div style={S.cardLabel}>내 현황</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: myRefs.length > 0 ? 20 : 0 }}>
                  <StatBox value={myRefs.length} label="추천 등록 수" highlight />
                  <StatBox value={`${myRank}위`}  label="현재 순위"   highlight={false} />
                </div>
                {myRefs.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSoft, letterSpacing: "0.08em", marginBottom: 8 }}>
                      내가 등록한 회원번호
                    </div>
                    <div>
                      {myRefs.map(r => (
                        <span key={r.id} style={S.chip}>{r.referred_no}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 추천 등록 탭 ── */}
            {tab === "manage" && !user.is_admin && (
              <div style={S.card}>
                <div style={S.cardLabel}>추천 회원번호 등록</div>

                <div style={{
                  background: C.blueLight, border: `1px solid ${C.blueMid}`,
                  borderRadius: 10, padding: "12px 15px",
                  fontSize: 13, color: C.blueDark, lineHeight: 1.75, marginBottom: 18,
                }}>
                  내가 가입시킨 회원의 <strong>회원번호</strong>를 입력하세요.<br />
                  이미 다른 회원이 등록한 번호는 중복 등록이 불가합니다.
                </div>

                <Msg state={refMsg} />

                <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
                  <input
                    style={{ ...S.input, flex: 1 }}
                    placeholder="회원번호 입력 (숫자만, 예: 1007)"
                    value={numInput}
                    onChange={e => setNumInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addNum()}
                    inputMode="numeric"
                  />
                  <button style={S.btnBlue} onClick={addNum}>등록</button>
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.textMid }}>내 추천 목록</span>
                    <span style={{
                      background: C.blue, color: C.white,
                      borderRadius: 20, padding: "3px 13px", fontSize: 13, fontWeight: 700,
                    }}>{myRefs.length}명</span>
                  </div>
                  {myRefs.length === 0
                    ? <EmptyBox text="아직 등록한 회원번호가 없습니다" />
                    : myRefs.map(r => (
                        <span key={r.id} style={S.chip}>
                          회원번호 {r.referred_no}
                          <button
                            onClick={() => removeNum(r.id)}
                            style={{ background: "none", border: "none", color: C.textSoft, cursor: "pointer", marginLeft: 6, fontSize: 16, lineHeight: 1, padding: 0 }}
                          >×</button>
                        </span>
                      ))
                  }
                </div>
              </div>
            )}

            {/* ── 관리자 탭 ── */}
            {tab === "admin" && user.is_admin && (
              <AdminPanel ranking={ranking} allNums={allNums} onRefresh={load} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  TAB BUTTON
// ─────────────────────────────────────────────────────────
function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", padding: "12px 18px",
      fontSize: 14, fontWeight: active ? 700 : 500,
      color: active ? C.blue : C.textMid,
      borderBottom: active ? `2.5px solid ${C.blue}` : "2.5px solid transparent",
      transition: "color 0.15s",
    }}>{children}</button>
  );
}

// ═══════════════════════════════════════════════════════════
//  ADMIN PANEL
// ═══════════════════════════════════════════════════════════
function AdminPanel({ ranking, allNums, onRefresh }) {
  const [members,   setMembers]  = useState([]);
  const [refMap,    setRefMap]   = useState({}); // id → referral[]
  const [newM,      setNewM]     = useState({ name: "", member_no: "", email: "" });
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMsg,  flashAdmin]  = useMsg();

  const loadMembers = useCallback(async () => {
    const { data: mem } = await supabase
      .from("members")
      .select("*")
      .eq("is_admin", false)
      .order("created_at");
    setMembers(mem || []);

    const { data: refs } = await supabase.from("referrals").select("*");
    const map = {};
    (refs || []).forEach(r => {
      if (!map[r.recruiter_id]) map[r.recruiter_id] = [];
      map[r.recruiter_id].push(r);
    });
    setRefMap(map);
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const set = k => e => setNewM(p => ({ ...p, [k]: e.target.value }));

  async function addMember() {
    const { name, member_no, email } = newM;
    const n = name.trim(), m = member_no.trim(), e = email.trim().toLowerCase();
    if (!n || !m || !e) { flashAdmin("err", "모든 항목을 입력하세요."); return; }
    if (!/^\d+$/.test(m)) { flashAdmin("err", "회원번호는 숫자만 가능합니다."); return; }

    setAdminBusy(true);
    const { error } = await supabase.from("members").insert({ name: n, member_no: m, email: e });
    setAdminBusy(false);

    if (error) {
      flashAdmin("err", error.code === "23505" ? "이미 존재하는 회원번호 또는 이메일입니다." : error.message);
      return;
    }
    setNewM({ name: "", member_no: "", email: "" });
    flashAdmin("ok", `✓ ${n} 회원 추가 완료.`);
    loadMembers();
    onRefresh();
  }

  async function deleteMember(id, name) {
    if (!window.confirm(`'${name}' 회원을 삭제하시겠습니까?\n추천 데이터도 함께 삭제됩니다.`)) return;
    await supabase.from("members").delete().eq("id", id);
    loadMembers();
    onRefresh();
  }

  const totalRefs = Object.values(refMap).flat().length;

  return (
    <>
      {/* ── 통계 ── */}
      <div style={S.card}>
        <div style={S.cardLabel}>전체 통계</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatBox value={members.length}                                       label="전체 회원"       highlight />
          <StatBox value={allNums.size}                                          label="등록된 회원번호" highlight={false} />
          <StatBox value={ranking.filter(r => r.referral_count > 0).length}    label="추천 참여자"     highlight={false} />
        </div>
      </div>

      {/* ── 전체 랭킹 ── */}
      <div style={S.card}>
        <div style={S.cardLabel}>전체 랭킹</div>
        {ranking.length === 0
          ? <EmptyBox text="아직 등록된 회원이 없습니다" />
          : ranking.map((m, i) => (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", padding: "11px 14px",
                borderRadius: 11, marginBottom: 6,
                background: i === 0 ? C.blueLight : C.white,
                border: `1px solid ${i === 0 ? C.blueMid : C.border}`,
              }}>
                <MedalBadge rank={i + 1} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{m.name}</span>
                  <span style={{ fontSize: 12, color: C.textSoft, marginLeft: 7 }}>No.{m.member_no}</span>
                </div>
                <div style={{
                  background: i === 0 ? C.blue : C.blueLight,
                  color: i === 0 ? C.white : C.blue,
                  borderRadius: 20, padding: "5px 15px",
                  fontWeight: 800, fontSize: 14,
                }}>{m.referral_count}명</div>
              </div>
            ))
        }
      </div>

      {/* ── 추천 현황 상세 ── */}
      <div style={S.card}>
        <div style={S.cardLabel}>추천 현황 상세</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["순위","이름","회원번호","이메일","추천 수","등록 번호"].map((h,i) => (
                  <th key={i} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranking.map((m, i) => {
                const nums = (refMap[m.id] || []).map(r => r.referred_no);
                const rankEmoji = [null,"🥇","🥈","🥉"][i + 1] || null;
                return (
                  <tr key={m.id}>
                    <td style={S.td}>
                      <span style={{ fontWeight: 700, fontSize: rankEmoji ? 18 : 13, color: rankEmoji ? "inherit" : C.textMid }}>
                        {rankEmoji || `#${i + 1}`}
                      </span>
                    </td>
                    <td style={{ ...S.td, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>{m.name}</td>
                    <td style={{ ...S.td, fontFamily: "monospace", color: C.textMid }}>{m.member_no}</td>
                    <td style={{ ...S.td, color: C.textSoft, fontSize: 12 }}>{m.email}</td>
                    <td style={S.td}>
                      <span style={{
                        background: m.referral_count > 0 ? C.blue : C.blueLight,
                        color: m.referral_count > 0 ? C.white : C.textSoft,
                        borderRadius: 12, padding: "3px 10px", fontWeight: 700, fontSize: 12,
                      }}>{m.referral_count}</span>
                    </td>
                    <td style={S.td}>
                      {nums.length === 0
                        ? <span style={{ color: C.textSoft }}>—</span>
                        : nums.map(n => (
                            <span key={n} style={{ ...S.chip, fontSize: 11, margin: "2px", padding: "3px 9px" }}>{n}</span>
                          ))
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 회원 관리 ── */}
      <div style={S.card}>
        <div style={S.cardLabel}>회원 관리</div>
        <Msg state={adminMsg} />

        {/* 신규 추가 폼 */}
        <div style={{
          background: C.blueLight, border: `1px solid ${C.blueMid}`,
          borderRadius: 12, padding: "16px", marginBottom: 22,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.blue, letterSpacing: "0.1em", marginBottom: 12 }}>
            신규 회원 직접 추가
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { k: "name",      ph: "이름",     type: "text",  mode: undefined },
              { k: "member_no", ph: "회원번호", type: "text",  mode: "numeric" },
              { k: "email",     ph: "이메일",   type: "email", mode: undefined },
            ].map(f => (
              <input
                key={f.k}
                style={{ ...S.input, flex: 1, minWidth: 110 }}
                type={f.type}
                placeholder={f.ph}
                inputMode={f.mode}
                value={newM[f.k]}
                onChange={set(f.k)}
              />
            ))}
            <button style={S.btnBlue} onClick={addMember} disabled={adminBusy}>
              {adminBusy ? <Spinner /> : "추가"}
            </button>
          </div>
        </div>

        {/* 회원 목록 테이블 */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["이름","회원번호","이메일","추천 수","가입일",""].map((h,i) => (
                  <th key={i} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td style={{ ...S.td, fontWeight: 600, color: C.text }}>{m.name}</td>
                  <td style={{ ...S.td, fontFamily: "monospace", color: C.textMid }}>{m.member_no}</td>
                  <td style={{ ...S.td, color: C.textSoft, fontSize: 12 }}>{m.email}</td>
                  <td style={S.td}>
                    <span style={{ color: C.blue, fontWeight: 700 }}>
                      {(refMap[m.id] || []).length}명
                    </span>
                  </td>
                  <td style={{ ...S.td, color: C.textSoft, fontSize: 12, whiteSpace: "nowrap" }}>
                    {new Date(m.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td style={S.td}>
                    <button style={S.btnDanger} onClick={() => deleteMember(m.id, m.name)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...S.td, textAlign: "center", color: C.textSoft, padding: "24px" }}>
                    등록된 회원이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
