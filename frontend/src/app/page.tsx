import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans antialiased" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)" }}>
      <div className="w-full max-w-[1200px] mx-auto p-8 flex-1">
        {/* Navigation */}
        <nav className="flex justify-between items-center pb-16">
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <Image src="/logo.png" alt="Logo" width={32} height={32} style={{ borderRadius: "8px" }} />
            <span>Diagrammer</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
              Fonctionnalités
            </Link>
            <Link href="#" className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
              Tarifs
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
              Log in
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border border-transparent bg-[var(--accent-primary)] text-white shadow-[0_0_10px_var(--accent-glow)] hover:bg-[var(--accent-hover)] hover:-translate-y-px">
              Sign up
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section
          className="text-center py-20 border-b border-[var(--border-subtle)] mb-8"
          style={{ paddingTop: "120px" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "20px",
              background: "#222",
              fontSize: "14px",
              color: "#ccc",
              marginBottom: "32px",
              border: "1px solid #333",
            }}
          >
            Directement connecté à
            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fff", fontWeight: 500 }}>
              <svg height="20" viewBox="0 0 16 16" version="1.1" width="20" aria-hidden="true" style={{ fill: "white" }}>
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.65.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
              </svg>
              GitHub
            </span>
          </div>
          <h1 className="text-5xl font-semibold tracking-tighter mb-4 bg-gradient-to-r from-white to-[#888] bg-clip-text text-transparent">
            Visualisez vos idées à
            <br />
            la vitesse de la pensée.
          </h1>
          <p className="text-lg mb-6 leading-relaxed text-[var(--text-secondary)]">
            Collaborez en temps réels sur vos diagrammes
            <br />
            directement liés à votre projets sur GitHub.
          </p>

          <div
            className="flex justify-center gap-4 mt-8"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md text-base font-medium transition-all duration-200 border border-transparent bg-[var(--accent-primary)] text-white shadow-[0_0_10px_var(--accent-glow)] hover:bg-[var(--accent-hover)] hover:-translate-y-px"
            >
              Créer un diagramme
            </Link>
            <Link
              href="#"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md text-base font-medium transition-all duration-200 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              Documentation
            </Link>
          </div>

          {/* Fake UI Preview */}
          <div
            className="mt-16 border border-[#333] rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
          >
            <img
              src="https://placehold.co/1000x600/161618/333?text=Editor+Preview+UI"
              alt="App Preview"
              style={{ width: "100%", display: "block", opacity: 0.8 }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
