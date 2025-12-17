"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Github } from "lucide-react";
import Image from "next/image";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3002";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setLoading(true);
      Cookies.set("diagrammer_token", token, { expires: 1 });
      router.push("/dashboard");
    }
  }, [router, searchParams]);

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/github`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)]">
        <div className="animate-pulse text-sm tracking-wide uppercase text-[var(--text-secondary)]">
          Connexion en cours...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-page)] p-4">
      <div className="w-full max-w-md bg-[#161618] border border-[var(--border-subtle)] rounded-2xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#1f1f22] border border-white/5 mb-4">
            <Image src="/logo.png" alt="Diagrammer" width={30} height={30} className="rounded-lg" />
          </div>
          <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">Bon retour !</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Connectez-vous via GitHub pour retrouver vos diagrammes reliés à vos projets.
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-[#24292e] text-white rounded-xl font-medium hover:bg-[#2f363d] transition-colors border border-[rgba(255,255,255,0.08)]"
        >
          <Github size={20} />
          Continuer avec GitHub
        </button>

        <p className="mt-8 text-center text-xs text-[var(--text-secondary)] leading-relaxed">
          En continuant, vous acceptez notre politique de confidentialité.<br />
          Le token est stocké localement pour simplifier le développement (prévoir un cookie HttpOnly en production).
        </p>
      </div>
    </div>
  );
}
