import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo_b.png";
import { toast } from "sonner";
import { clearUserRoleCache, getUserRole } from "@/lib/userRole";

type SignupAffiliation = "worker_inopnc" | "partner_company";

const AFFILIATION_OPTIONS: Array<{ value: SignupAffiliation; label: string }> = [
  { value: "worker_inopnc", label: "이노피앤씨" },
  { value: "partner_company", label: "파트너" },
];

const PARTNER_DATALIST_ID = "partner-company-suggestions";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [signupAffiliation, setSignupAffiliation] = useState<SignupAffiliation>("worker_inopnc");
  const [partnerCompany, setPartnerCompany] = useState("");
  const [partnerSuggestions, setPartnerSuggestions] = useState<string[]>([]);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const isPartnerSignup = signupAffiliation === "partner_company";

  useEffect(() => {
    if (isLogin || showForgot || !isPartnerSignup) return;

    let active = true;

    void supabase.rpc("list_signup_partner_companies").then(({ data, error }) => {
      if (!active || error) return;

      const next = [...new Set((data || []).map((row) => row.company_name?.trim()).filter(Boolean) as string[])].sort((a, b) =>
        a.localeCompare(b, "ko-KR"),
      );
      setPartnerSuggestions(next);
    });

    return () => {
      active = false;
    };
  }, [isLogin, isPartnerSignup, showForgot]);

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
  const normalizedPhone = phone.replace(/[^0-9]/g, "");

  const partnerHint = useMemo(() => {
    if (!isPartnerSignup) return "";
    if (partnerSuggestions.length === 0) return "새 회사명도 직접 입력할 수 있습니다.";
    return "기존 파트너 회사명이 자동완성으로 제안됩니다.";
  }, [isPartnerSignup, partnerSuggestions.length]);

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
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 올바르지 않습니다." : error.message);
      return;
    }

    const userId = data.user?.id;
    let destination = "/";

    if (userId) {
      clearUserRoleCache(userId);
      const role = await getUserRole(userId);
      if (role === "admin" || role === "manager") {
        destination = "/admin";
      }
    }

    toast.success("로그인되었습니다.");
    navigate(destination);
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("필수 항목을 모두 입력하세요.");
      return;
    }

    if (isPartnerSignup && !partnerCompany.trim()) {
      toast.error("파트너 회사명을 입력하세요.");
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
      toast.error("이용약관 및 개인정보 처리방침에 동의해주세요.");
      return;
    }

    const metadata: Record<string, string> = {
      name: name.trim(),
      phone: normalizedPhone || "",
      affiliation: signupAffiliation,
      verification_method: "email_link",
    };

    if (isPartnerSignup) {
      metadata.partner_name = partnerCompany.trim();
      if (jobTitle.trim()) {
        metadata.job_title = jobTitle.trim();
      }
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("회원가입이 완료되었습니다. 이메일 인증 링크를 확인해주세요.");
    setIsLogin(true);
    setShowForgot(false);
    resetSignupFields();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("이메일을 입력하세요.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("비밀번호 재설정 링크를 이메일로 전송했습니다.");
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
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-5">
      <div className="w-full max-w-app">
        <div className="bg-card rounded-xl shadow-md p-8 max-[640px]:p-6 w-full">
          {!isSupabaseConfigured && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">환경 설정이 필요합니다</p>
              <p className="mt-1 text-amber-700">
                프로젝트 루트에 <code className="rounded bg-amber-100 px-1">.env</code> 파일을 만들고{" "}
                <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code>,{" "}
                <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code> 값을 설정해 주세요.
              </p>
            </div>
          )}
          <div className="text-center mb-8">
            <div className="mb-3 flex items-center justify-center gap-3 max-[640px]:gap-2 max-[420px]:gap-1.5">
              <img
                src={logoImg}
                alt="INOPNC 로고"
                className="h-auto w-[188px] max-[640px]:w-[138px] max-[420px]:w-[124px] shrink-0 object-contain"
              />
              <h1 className="whitespace-nowrap text-[26px] max-[640px]:text-[20px] max-[420px]:text-[18px] leading-none font-bold text-header-navy">
                {showForgot ? "비밀번호 찾기" : isLogin ? "로그인" : "회원가입"}
              </h1>
            </div>
            <p className="text-[14px] text-text-sub">
              {showForgot
                ? "가입한 이메일을 입력하세요."
                : isLogin
                  ? "계정으로 로그인하세요."
                  : "필요한 정보를 입력해 회원가입을 완료하세요."}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {!isLogin && !showForgot && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-text-sub flex items-center gap-1">
                    소속 정보 <span className="text-destructive text-[16px]">*</span>
                  </label>
                  <div className="relative w-full">
                    <select
                      value={signupAffiliation}
                      onChange={(event) => setSignupAffiliation(event.target.value as SignupAffiliation)}
                      className="h-12 w-full appearance-none rounded-lg border border-border bg-card px-4 pr-12 text-[16px] text-foreground outline-none transition-colors focus:border-primary max-[640px]:h-11"
                    >
                      {AFFILIATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                {isPartnerSignup ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[14px] font-semibold text-text-sub flex items-center gap-1">
                        회사명 <span className="text-destructive text-[16px]">*</span>
                      </label>
                      <input
                        type="text"
                        list={PARTNER_DATALIST_ID}
                        value={partnerCompany}
                        onChange={(event) => setPartnerCompany(event.target.value)}
                        placeholder="파트너 회사명을 입력하세요"
                        className="h-12 rounded-lg border border-border px-4 text-[16px] bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary max-[640px]:h-11"
                      />
                      <datalist id={PARTNER_DATALIST_ID}>
                        {partnerSuggestions.map((company) => (
                          <option key={company} value={company} />
                        ))}
                      </datalist>
                      <p className="text-[12px] text-text-sub">{partnerHint}</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[14px] font-semibold text-text-sub">직함</label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(event) => setJobTitle(event.target.value)}
                        placeholder="예: 소장 / 기사 / 대표"
                        className="h-12 rounded-lg border border-border px-4 text-[16px] bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary max-[640px]:h-11"
                      />
                    </div>
                  </>
                ) : null}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-text-sub flex items-center gap-1">
                    이름 <span className="text-destructive text-[16px]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="이름을 입력하세요"
                    className="h-12 rounded-lg border border-border px-4 text-[16px] bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary max-[640px]:h-11"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-text-sub">연락처</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="010-1234-5678"
                    className="h-12 rounded-lg border border-border px-4 text-[16px] bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary max-[640px]:h-11"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-semibold text-text-sub flex items-center gap-1">
                이메일 <span className="text-destructive text-[16px]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@email.com"
                className="h-12 rounded-lg border border-border px-4 text-[16px] bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary max-[640px]:h-11"
              />
            </div>

            {!showForgot && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-semibold text-text-sub flex items-center gap-1">
                  비밀번호 <span className="text-destructive text-[16px]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isLogin ? "비밀번호를 입력하세요" : "영문, 숫자, 특수문자 조합 8자 이상"}
                    className="h-12 w-full rounded-lg border border-border px-4 pr-12 text-[16px] bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary max-[640px]:h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent text-muted-foreground"
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
                  <label className="text-[14px] font-semibold text-text-sub flex items-center gap-1">
                    비밀번호 확인 <span className="text-destructive text-[16px]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="비밀번호를 다시 입력하세요"
                      className="h-12 w-full rounded-lg border border-border px-4 pr-12 text-[16px] bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary max-[640px]:h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent text-muted-foreground"
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

                <p className="text-[12px] text-text-sub">가입 완료 후 이메일 인증 링크를 통해 계정을 활성화합니다.</p>
              </>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-none bg-header-navy text-[16px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 max-[640px]:h-11"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {showForgot ? "재설정 링크 전송" : isLogin ? "로그인" : "회원가입"}
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
