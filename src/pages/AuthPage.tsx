import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo_b.png";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { clearUserRoleCache, getUserRole } from "@/lib/userRole";
import { buildAppUrl, getAuthCallbackError, stripAuthCallbackParamsFromUrl } from "@/lib/authUrl";

type SignupAffiliation = "worker_inopnc" | "partner_company";

const AFFILIATION_OPTIONS: Array<{
  value: SignupAffiliation;
  label: string;
  title: string;
  description: string;
}> = [
  {
    value: "worker_inopnc",
    label: "내부 직원",
    title: "이노피앤씨 내부 직원",
    description: "현장/문서/출력은 관리자 승인 후 바로 사용할 수 있습니다.",
  },
  {
    value: "partner_company",
    label: "협력사",
    title: "협력사 사용자",
    description: "회사명은 관리자만 확인하며, 승인 후 해당 회사 현장만 열립니다.",
  },
];

function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, initialized } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [signupAffiliation, setSignupAffiliation] = useState<SignupAffiliation>("worker_inopnc");
  const [partnerCompany, setPartnerCompany] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const isPartnerSignup = signupAffiliation === "partner_company";
  const redirectAfterLogin = useMemo(() => {
    const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
    if (!from?.pathname || from.pathname === "/auth" || from.pathname === "/reset-password") return null;
    return `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`;
  }, [location.state]);

  useEffect(() => {
    const authError = getAuthCallbackError();
    if (!authError) return;

    toast.error(authError);
    stripAuthCallbackParamsFromUrl();
  }, []);

  useEffect(() => {
    if (!initialized || !session?.user?.id) return;

    let isMounted = true;

    const redirectAuthenticatedUser = async () => {
      const role = await getUserRole(session.user.id);
      if (!isMounted) return;

      if (!role) {
        navigate("/pending-approval", { replace: true });
        return;
      }

      let destination = redirectAfterLogin ?? "/";
      if (!redirectAfterLogin && (role === "admin" || role === "manager")) {
        destination = "/admin";
      }

      navigate(destination, { replace: true });
    };

    void redirectAuthenticatedUser();

    return () => {
      isMounted = false;
    };
  }, [initialized, navigate, redirectAfterLogin, session?.user?.id]);

  useEffect(() => {
    if (!isPartnerSignup) {
      setPartnerCompany("");
      setJobTitle("");
    }
  }, [isPartnerSignup]);

  const getStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabel = strength === 0 ? "입력 필요" : strength === 1 ? "약함" : strength <= 3 ? "보통" : "강함";
  const strengthColor = strength === 0 ? "bg-border" : strength === 1 ? "bg-destructive" : strength <= 3 ? "bg-amber-500" : "bg-emerald-500";
  const normalizedPhone = normalizePhone(phone);

  const resetSignupFields = () => {
    setPassword("");
    setConfirmPassword("");
    setName("");
    setJobTitle("");
    setPhone("");
    setPartnerCompany("");
    setSignupAffiliation("worker_inopnc");
    setAgreeTerms(false);
  };

  const handleLogin = async () => {
    if (!isSupabaseConfigured) {
      toast.error("로그인 설정이 완료되지 않았습니다. 관리자에게 Supabase 환경변수 확인을 요청해 주세요.");
      return;
    }

    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setLoading(false);

    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 올바르지 않습니다." : error.message);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      toast.error("로그인 사용자 정보를 확인할 수 없습니다.");
      return;
    }

    clearUserRoleCache(userId);
    const role = await getUserRole(userId);
    if (!role) {
      toast.success("로그인되었습니다. 관리자 승인 후 이용할 수 있습니다.");
      navigate("/pending-approval", { replace: true });
      return;
    }

    let destination = redirectAfterLogin ?? "/";
    if (!redirectAfterLogin && (role === "admin" || role === "manager")) {
      destination = "/admin";
    }

    toast.success("로그인되었습니다.");
    navigate(destination);
  };

  const handleSignup = async () => {
    if (!isSupabaseConfigured) {
      toast.error("회원가입 설정이 완료되지 않았습니다. 관리자에게 Supabase 환경변수 확인을 요청해 주세요.");
      return;
    }

    if (!name.trim() || !email.trim() || !normalizedPhone) {
      toast.error("이름, 이메일, 연락처를 모두 입력해 주세요.");
      return;
    }

    if (isPartnerSignup && !partnerCompany.trim()) {
      toast.error("회사명을 입력해 주세요.");
      return;
    }

    if (password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!agreeTerms) {
      toast.error("이용약관 및 개인정보 처리방침에 동의해 주세요.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const metadata: Record<string, string> = {
      name: name.trim(),
      phone: normalizedPhone,
      affiliation: signupAffiliation,
      signup_request_type: isPartnerSignup ? "partner" : "internal",
      verification_method: "email_link",
    };

    if (isPartnerSignup) {
      metadata.partner_name = partnerCompany.trim();
      metadata.requested_company_name = partnerCompany.trim();
      if (jobTitle.trim()) {
        metadata.job_title = jobTitle.trim();
      }
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: buildAppUrl("/"),
        data: metadata,
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (!data.user?.id) {
      setLoading(false);
      toast.error("가입 요청 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setLoading(false);

    toast.success(
      isPartnerSignup
        ? "협력사 가입 요청이 접수되었습니다. 관리자 승인 후 해당 회사 현장만 열립니다."
        : "가입 요청이 접수되었습니다. 관리자 승인 후 이용할 수 있습니다.",
    );
    setIsLogin(true);
    setShowForgot(false);
    resetSignupFields();
  };

  const handleForgotPassword = async () => {
    if (!isSupabaseConfigured) {
      toast.error("비밀번호 재설정 설정이 완료되지 않았습니다. 관리자에게 Supabase 환경변수 확인을 요청해 주세요.");
      return;
    }

    if (!email) {
      toast.error("이메일을 입력해 주세요.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: buildAppUrl("/reset-password"),
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("비밀번호 재설정 메일을 보냈습니다.");
    setShowForgot(false);
  };

  const handleSubmit = () => {
    if (showForgot) {
      void handleForgotPassword();
      return;
    }

    if (isLogin) {
      void handleLogin();
      return;
    }

    void handleSignup();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5 py-8">
      <div className="w-full max-w-[420px]">
        <div className="w-full bg-white">
          {!isSupabaseConfigured && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">환경 설정이 필요합니다.</p>
              <p className="mt-1 text-amber-700">
                프로젝트 루트의 <code className="rounded bg-amber-100 px-1">.env</code> 또는 Vercel 환경변수에{" "}
                <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code>,{" "}
                <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code> 값을 넣어 주세요.
              </p>
            </div>
          )}

          <div className="mb-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-3 max-[640px]:gap-2 max-[420px]:gap-1.5">
              <img
                src={logoImg}
                alt="INOPNC 로고"
                className="h-auto w-[188px] shrink-0 object-contain max-[640px]:w-[138px] max-[420px]:w-[124px]"
              />
              <h1 className="whitespace-nowrap text-[26px] font-bold leading-none text-header-navy max-[640px]:text-[20px] max-[420px]:text-[18px]">
                {showForgot ? "비밀번호 찾기" : isLogin ? "로그인" : "회원가입"}
              </h1>
            </div>
            <p className="text-[14px] leading-6 text-slate-500">
              {showForgot
                ? "가입한 이메일을 입력해 주세요."
                : isLogin
                  ? "계정으로 로그인해 주세요."
                  : "관리자 승인형 가입 흐름입니다. 승인 전에는 현장 데이터가 열리지 않습니다."}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {!isLogin && !showForgot && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {AFFILIATION_OPTIONS.map((option) => {
                    const active = signupAffiliation === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSignupAffiliation(option.value)}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition-all",
                          active ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "border-slate-200 bg-white",
                        )}
                      >
                        <div className="text-[12px] font-bold text-primary">{option.label}</div>
                        <div className="mt-1 text-[15px] font-semibold text-slate-900">{option.title}</div>
                        <p className="mt-2 text-[12px] leading-5 text-slate-500">{option.description}</p>
                      </button>
                    );
                  })}
                </div>

                {isPartnerSignup ? (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[12px] leading-5 text-slate-600">
                      회사명은 신청자에게 공개 목록으로 보여주지 않습니다. 자유입력으로 제출되며, 관리자가 확인 후 조직을 지정합니다.
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-1 text-[14px] font-semibold text-text-sub">
                        회사명 <span className="text-[16px] text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={partnerCompany}
                        onChange={(event) => setPartnerCompany(event.target.value)}
                        placeholder="소속 회사명을 직접 입력해 주세요"
                        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-[16px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-slate-300 focus:ring-4 focus:ring-slate-100 max-[640px]:h-11"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[14px] font-semibold text-text-sub">직책</label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(event) => setJobTitle(event.target.value)}
                        placeholder="예: 현장소장 / 기사 / 대리"
                        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-[16px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-slate-300 focus:ring-4 focus:ring-slate-100 max-[640px]:h-11"
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[12px] leading-5 text-slate-600">
                    내부 직원 가입은 더 단순하게 접수됩니다. 관리자 승인 후 전체 운영 현장을 사용할 수 있습니다.
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1 text-[14px] font-semibold text-text-sub">
                    이름 <span className="text-[16px] text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="이름을 입력해 주세요"
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-[16px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-slate-300 focus:ring-4 focus:ring-slate-100 max-[640px]:h-11"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-text-sub">연락처</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="010-1234-5678"
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-[16px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-slate-300 focus:ring-4 focus:ring-slate-100 max-[640px]:h-11"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1 text-[14px] font-semibold text-text-sub">
                이메일 <span className="text-[16px] text-destructive">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@email.com"
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-[16px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-slate-300 focus:ring-4 focus:ring-slate-100 max-[640px]:h-11"
              />
            </div>

            {!showForgot && (
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1 text-[14px] font-semibold text-text-sub">
                  비밀번호 <span className="text-[16px] text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isLogin ? "비밀번호를 입력해 주세요" : "영문, 숫자, 특수문자 포함 8자 이상"}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-[16px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-slate-300 focus:ring-4 focus:ring-slate-100 max-[640px]:h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {!isLogin ? (
                  <>
                    <div className="mt-2 flex gap-1">
                      {[0, 1, 2, 3].map((index) => (
                        <div key={index} className={cn("h-1 flex-1 rounded-sm transition-colors", index < strength ? strengthColor : "bg-border")} />
                      ))}
                    </div>
                    <span className="mt-1 text-[12px] text-text-sub">비밀번호 강도: {strengthLabel}</span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="mt-1 self-end border-none bg-transparent text-[13px] text-primary hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </button>
                )}
              </div>
            )}

            {!isLogin && !showForgot && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1 text-[14px] font-semibold text-text-sub">
                    비밀번호 확인 <span className="text-[16px] text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="비밀번호를 다시 입력해 주세요"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-[16px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-slate-300 focus:ring-4 focus:ring-slate-100 max-[640px]:h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent text-slate-400 transition-colors hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="mt-1 flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(event) => setAgreeTerms(event.target.checked)}
                      className="h-[18px] w-[18px] accent-primary"
                    />
                    <span className="whitespace-nowrap text-[14px] text-text-sub max-[640px]:text-[13px]">
                      이용약관 및 개인정보 처리방침 동의 <span className="text-destructive">*</span>
                    </span>
                  </label>
                </div>

                <p className="text-[12px] text-text-sub">
                  가입 후 이메일 인증을 완료해도, 관리자 승인 전에는 현장 데이터에 접근할 수 없습니다.
                </p>
              </>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-none bg-header-navy text-[16px] font-semibold text-white transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 max-[640px]:h-11"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {showForgot ? "재설정 메일 보내기" : isLogin ? "로그인" : "가입 요청 보내기"}
            </button>

            <div className="mt-4 text-center text-[14px] text-text-sub">
              {showForgot ? (
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="border-none bg-transparent font-semibold text-primary hover:underline"
                >
                  로그인으로 돌아가기
                </button>
              ) : isLogin ? (
                <>
                  계정이 없으신가요?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setShowForgot(false);
                    }}
                    className="border-none bg-transparent font-semibold text-primary hover:underline"
                  >
                    회원가입하기
                  </button>
                </>
              ) : (
                <>
                  이미 계정이 있으신가요?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setShowForgot(false);
                    }}
                    className="border-none bg-transparent font-semibold text-primary hover:underline"
                  >
                    로그인하기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
