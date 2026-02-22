"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const V = {
  bg: "#F8F7F6",
  green: "#90E9B8",
  greenDark: "#5CC98A",
  dark: "#2A2A2A",
  copy: "#1E1E1E",
  muted: "#71717A",
  danger: "#EF4444",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: { hd: "viax.io" },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: V.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: "48px 40px", width: 380, textAlign: "center", border: "1px solid #E4E4E7" }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: V.green, marginBottom: 4 }}>viax</div>
        <div style={{ fontSize: 11, color: V.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 32 }}>Co-Innovation Dashboard</div>

        {error === "unauthorized_domain" && (
          <div style={{ background: "#FEF2F2", color: V.danger, fontSize: 13, padding: "10px 14px", borderRadius: 8, marginBottom: 20 }}>
            Only @viax.io accounts are allowed.
          </div>
        )}
        {error === "auth_failed" && (
          <div style={{ background: "#FEF2F2", color: V.danger, fontSize: 13, padding: "10px 14px", borderRadius: 8, marginBottom: 20 }}>
            Authentication failed. Please try again.
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%", padding: "12px 20px", borderRadius: 8, border: `1px solid #E4E4E7`,
            background: "#fff", color: V.copy, fontSize: 14, fontWeight: 500, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "background 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#F4F4F5")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z" fill="#4285F4"/><path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17Z" fill="#34A853"/><path d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07Z" fill="#FBBC05"/><path d="M8.98 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.59A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.9Z" fill="#EA4335"/></svg>
          Sign in with Google
        </button>

        <div style={{ fontSize: 12, color: V.muted, marginTop: 20 }}>
          Restricted to @viax.io accounts
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: V.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: V.muted }}>Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
