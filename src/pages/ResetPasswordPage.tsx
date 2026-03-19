import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo_b.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getAuthCallbackError, hasAuthCodeInUrl, isRecoveryFlowUrl, stripAuthCallbackParamsFromUrl } from "@/lib/authUrl";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [linkReady, setLinkReady] = useState(false);
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const authError = getAuthCallbackError();
    if (authError) {
      toast.error(authError);
      stripAuthCallbackParamsFromUrl();
      navigate("/auth", { replace: true });
      return;
    }

    if (session) {
      setLinkReady(true);
      stripAuthCallbackParamsFromUrl();
      return;
    }

    if (isRecoveryFlowUrl() || hasAuthCodeInUrl()) {
      toast.error("유효하지 않거나 만료된 비밀번호 재설정 링크입니다.");
      stripAuthCallbackParamsFromUrl();
      navigate("/auth", { replace: true });
      return;
    }

    toast.error("유효하지 않은 비밀번호 재설정 링크입니다.");
    navigate("/auth", { replace: true });
  }, [authLoading, navigate, session]);

  const handleReset = async () => {
    if (!linkReady) return;

    if (password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setDone(true);
    window.setTimeout(() => navigate("/", { replace: true }), 2000);
  };

  if (authLoading || !linkReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-muted-foreground">비밀번호 재설정 링크를 확인하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">비밀번호가 변경되었습니다.</h2>
          <p className="text-muted-foreground mt-2">잠시 후 메인 화면으로 이동합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-app">
        <div className="bg-card rounded-xl shadow-md p-8 max-[640px]:p-6">
          <div className="text-center mb-8">
            <img src={logoImg} alt="INOPNC" className="w-[200px] h-auto mx-auto mb-5 object-contain" />
            <h1 className="text-xl font-bold text-foreground">새 비밀번호 설정</h1>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-muted-foreground">새 비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8자 이상 입력"
                  className="w-full h-12 rounded-lg border border-border px-4 pr-12 text-base bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground bg-transparent border-none cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-muted-foreground">비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="비밀번호를 다시 입력해 주세요."
                className="w-full h-12 rounded-lg border border-border px-4 text-base bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="w-full h-12 bg-header-navy text-white rounded-lg border-none text-base font-semibold cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "처리 중..." : "비밀번호 변경"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
