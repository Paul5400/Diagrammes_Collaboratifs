'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '../components/Logo';
import { Layers, Shield, Zap, Users2, Github, Check, ArrowRight, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans antialiased selection:bg-[var(--accent-primary)] selection:text-white">
      {/* Dynamic Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent-primary)] opacity-5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-[#3b82f6] opacity-5 blur-[100px] rounded-full animate-pulse [animation-delay:2s]"></div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8">
        {/* Navigation */}
        <nav className="flex justify-between items-center py-6 md:py-8 mb-8 border-b border-white/[0.03] relative z-20">
          <Logo size="md" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Fonctionnalités
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Tarifs
            </Link>
            {loading ? (
              <div className="w-24 h-9 bg-white/5 animate-pulse rounded-md"></div>
            ) : user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm md:text-base inline-flex items-center justify-center px-4 py-2 rounded-md text-base font-medium transition-all duration-200 border border-transparent bg-[var(--accent-primary)] text-white shadow-[0_0_10px_var(--accent-glow)] hover:bg-[var(--accent-hover)] hover:-translate-y-px"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border border-transparent bg-[var(--accent-primary)] text-white shadow-[0_0_10px_var(--accent-glow)] hover:bg-[var(--accent-hover)] hover:-translate-y-px"
                >
                  Se connecter
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Backdrop */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )}

          {/* Mobile Menu Navigation */}
          <div className={`
            fixed top-20 left-6 right-6 p-6 rounded-2xl bg-[#0f0f11] border border-white/10 shadow-2xl z-20 md:hidden
            transition-all duration-300 ease-out transform
            ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
          `}>
            <div className="flex flex-col gap-5">
              <Link
                href="#features"
                className="text-lg font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Fonctionnalités
              </Link>
              <Link
                href="#pricing"
                className="text-lg font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tarifs
              </Link>
              <div className="h-px bg-white/5 my-2"></div>
              {user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl text-base font-semibold bg-white text-black"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  Aller au Dashboard
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    className="flex items-center justify-center px-5 py-4 rounded-xl text-base font-semibold bg-[var(--accent-primary)] text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Se connecter
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section
          className="text-center py-20 border-b border-[var(--border-subtle)] mb-8"
          style={{ paddingTop: '120px' }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: '#222',
              fontSize: '14px',
              color: '#ccc',
              marginBottom: '32px',
              border: '1px solid #333',
            }}
          >
            Directement connecté à
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#fff',
                fontWeight: 500,
              }}
            >
              <svg
                height="20"
                viewBox="0 0 16 16"
                version="1.1"
                width="20"
                aria-hidden="true"
                style={{ fill: 'white' }}
              >
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.65.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
              GitHub
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tighter mb-4 bg-gradient-to-r from-white to-[#888] bg-clip-text text-transparent md:text-5xl text-center">
            Visualisez vos idées à
            <br />
            la vitesse de la pensée.
          </h1>
          <p className="text-sm mb-6 leading-relaxed text-[var(--text-secondary)] md:text-lg">
            Collaborez en temps réels sur vos diagrammes
            <br />
            directement liés à votre projet sur GitHub.
          </p>

          <div className="flex justify-center gap-4 mt-8">
            <Link
              href="/dashboard"
              className="text-sm md:text-base inline-flex items-center justify-center px-6 py-3 rounded-md text-base font-medium transition-all duration-200 border border-transparent bg-[var(--accent-primary)] text-white shadow-[0_0_10px_var(--accent-glow)] hover:bg-[var(--accent-hover)] hover:-translate-y-px"
            >
              Créer un diagramme
            </Link>
            <Link
              href="#features"
              className="text-sm md:text-base inline-flex items-center justify-center px-6 py-3 rounded-md text-base font-medium transition-all duration-200 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              Voir les fonctionnalités
            </Link>
          </div>

          {/* Fake UI Preview */}
          <div className="mt-16 border border-[#333] rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
            <img
              src="https://placehold.co/1000x600/161618/333?text=Editor+Preview+UI"
              alt="App Preview"
              style={{ width: '100%', display: 'block', opacity: 0.8 }}
            />
          </div>
        </section>


        {/* Sections Fonctionnalités et Tarifs */}
        <section id="features" className="py-24 border-b border-[var(--border-subtle)] scroll-mt-20">
          <h2 className="text-3xl font-bold text-center mb-16">Pourquoi choisir Diagrammer ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-zinc-400">
                <Users2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">Collaboration Réelle</h3>
              <p className="text-[var(--text-secondary)]">Éditez vos diagrammes à plusieurs en temps réel avec des curseurs visibles et une synchronisation instantanée.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-zinc-400">
                <Github size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">Flux Git Direct</h3>
              <p className="text-[var(--text-secondary)]">Sauvegardez vos diagrammes Mermaid directement dans vos repositories GitHub comme du code source.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-zinc-400">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">Performance</h3>
              <p className="text-[var(--text-secondary)]">Un éditeur léger et performant, conçu pour la productivité maximale des développeurs.</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24 scroll-mt-20">
          <h2 className="text-3xl font-bold text-center mb-16">Des tarifs simples et transparents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02]">
              <h3 className="text-xl font-bold mb-2">Gratuit</h3>
              <div className="text-4xl font-bold mb-6">0€ <span className="text-lg font-normal text-zinc-500">/ mois</span></div>
              <ul className="space-y-4 mb-8">
                {['5 projets GitHub', 'Historique 7 jours', 'Exports SVG/PNG'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                    <Check size={16} className="text-[var(--accent-primary)]" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="block w-full text-center py-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                Commencer
              </Link>
            </div>
            <div className="p-8 rounded-2xl border border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/[0.03] shadow-[0_0_30px_rgba(124,58,237,0.1)]">
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">12€ <span className="text-lg font-normal text-zinc-500">/ mois</span></div>
              <ul className="space-y-4 mb-8">
                {['Projets illimités', 'Historique complet', 'Support prioritaire'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-white text-sm">
                    <Check size={16} className="text-[var(--accent-primary)]" /> {f}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="block w-full text-center py-3 rounded-md bg-white/5 border border-white/5 text-zinc-500 cursor-not-allowed transition-colors font-medium"
              >
                Bientôt disponible
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/[0.03] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-[10px] text-zinc-600 font-medium">© 2026 Diagrammer.</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-xs text-zinc-500 hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="text-xs text-zinc-500 hover:text-white transition-colors">GitHub</Link>
            <Link href="#" className="text-xs text-zinc-500 hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="text-xs text-zinc-500 hover:text-white transition-colors">Privacy</Link>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes typing {
          0%, 10% { width: 0; }
          40%, 60% { width: 100%; }
          90%, 100% { width: 0; }
        }
        .animate-typing {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          animation: typing 6s steps(20, end) infinite;
        }

        @keyframes blink { 50% { opacity: 0; } }
        .animate-cursor-blink { animation: blink 0.8s infinite; }

        @keyframes drawPath { to { stroke-dashoffset: 0; } }
        .draw-path-1 { animation: drawPath 0.8s ease-out 0.5s forwards infinite; }
        .draw-path-2 { animation: drawPath 0.8s ease-out 1.2s forwards infinite; }
        .draw-path-3 { animation: drawPath 0.8s ease-out 2s forwards infinite; }
        .draw-path-4 { animation: drawPath 0.8s ease-out 2.8s forwards infinite; }

        @keyframes fadeInOut {
          0%, 10%, 100% { opacity: 0; transform: translateY(5px); }
          20%, 80% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-1 { animation: fadeInOut 6s ease-out 0.5s infinite; }
        .animate-fade-in-2 { animation: fadeInOut 6s ease-out 1.2s infinite; }
        .animate-fade-in-3 { animation: fadeInOut 6s ease-out 2s infinite; }
        .animate-fade-in-4 { animation: fadeInOut 6s ease-out 2.8s infinite; }

        @keyframes svgZoom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-svg-zoom {
          animation: svgZoom 12s ease-in-out infinite;
        }

        @keyframes premiumCursor1 {
          0%, 100% { transform: translate(120px, 140px); }
          50% { transform: translate(250px, 180px); }
        }
        @keyframes premiumCursor2 {
          0%, 100% { transform: translate(320px, 90px); }
          50% { transform: translate(200px, 240px); }
        }
        .cursor-premium-1 { animation: premiumCursor1 10s infinite ease-in-out; }
        .cursor-premium-2 { animation: premiumCursor2 12s infinite ease-in-out; }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
