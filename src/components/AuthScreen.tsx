import Link from "next/link";
import { Globe2 } from "lucide-react";
import { AuthForm } from "./AuthForm";
import { Wordmark } from "./Brand";

function SurveyArt() {
  // Decorative blueprint, not a preview of the private save or a map tile.
  return (
    <svg aria-hidden="true" viewBox="0 0 480 290" fill="none" className="my-6 w-full max-w-[500px] flex-1" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="survey-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0v24" stroke="#a5c291" strokeOpacity=".19" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="478" height="288" rx="18" fill="url(#survey-grid)" stroke="#537059" />
      <path d="m45 171 173-104 194 108-174 94L45 171Z" fill="#21372a" stroke="#62866a" />
      <path d="m64 182 174-104m-145 120L267 94M123 216l174-106M153 232l173-105M183 248l173-104M213 264l173-104M74 154l195 103M103 137l197 105M132 119l199 105M160 102l202 105M189 84l199 106" stroke="#466954" />
      <path d="m94 151 55-33 48 27-54 32-49-26Zm87-49 37-22 46 26-37 22-46-26Zm103 51 48-26 54 31-48 27-54-32Zm-106 60 56-33 44 24-57 33-43-24Z" fill="#304e38" stroke="#86aa73" />
      <path d="m181 145 68-40 62 34-68 40-62-34Z" fill="#a6d660" fillOpacity=".16" stroke="#a6d660" strokeDasharray="4 4" />
      <path d="M195 126v-23l44 24v24l-44-25Zm44 25v-24l54-31v23l-54 32Z" fill="#578457" stroke="#bcf080" />
      <path d="m195 103 54-31 44 24-54 31-44-24Z" fill="#c9f95f" stroke="#dbff9c" />
      <path d="m212 104 38-22 27 15-38 22-27-15Z" stroke="#557826" />
      <path d="m249 72 29-28h125m-84 96 50-27h64M140 174l-39 17H40" stroke="#a5ba9b" strokeDasharray="4 4" />
      <path d="M30 25h13m-6.5-6.5v13M438 263h13m-6.5-6.5v13" stroke="#a5ba9b" />
      <circle cx="408" cy="44" r="5" fill="#c9f95f" />
      <circle cx="437" cy="113" r="4" fill="#9dc7e5" />
      <circle cx="40" cy="191" r="4" fill="#ef8868" />
    </svg>
  );
}

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[1192px] flex-col px-4 py-5 sm:px-7 sm:py-7 lg:px-10">
      <header className="flex items-center justify-between gap-4">
        <Wordmark />
        <span className="hidden font-mono text-[11px] font-semibold uppercase tracking-[.14em] text-ink-soft sm:inline">World simulator</span>
      </header>
      <main className="my-auto py-8 sm:py-12" id="main-content">
        <div className="mx-auto grid max-w-lg overflow-hidden rounded-[28px] border border-line bg-paper shadow-soft md:max-w-none md:grid-cols-[1.08fr_1fr]">
          <div className="hidden flex-col bg-[#1b2b20] p-8 text-paper md:flex lg:p-11" aria-hidden="true">
            <div className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-lime">
              <Globe2 size={16} /> Shared world
            </div>
            <SurveyArt />
            <p className="max-w-[14ch] text-balance font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-.045em]">A world built together.</p>
            <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-[#d5e3d1]">Shape spaces, plan new sites, and manage your simulated AI crew in one shared save.</p>
          </div>
          <div className="flex items-center px-5 py-8 sm:px-10 md:px-7 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-[24rem]">
              <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[.14em] text-ink-soft">Simplayz account</p>
              <h1 id="auth-heading" className="text-balance font-display text-[clamp(2rem,4vw,2.9rem)] font-bold tracking-[-.05em]">
                {registering ? "Create an account" : "Sign in"}
              </h1>
              <p className="mb-6 mt-3 text-sm leading-relaxed text-ink-soft">
                {registering ? "Choose a username and password to join the shared world. Everyone who signs in can edit it." : "Sign in to open the shared world and pick up where your crew left off."}
              </p>
              <AuthForm mode={mode} />
              <p className="mt-6 border-t border-line pt-5 text-sm text-ink-soft">
                {registering ? "Already have an account?" : "New to Simplayz?"}{" "}
                <Link href={registering ? "/login" : "/register"} className="font-bold text-ink underline decoration-ink/60 underline-offset-4 hover:decoration-ink">
                  {registering ? "Sign in" : "Create an account"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="flex items-center justify-between gap-3 text-xs text-ink-soft">
        <span>Simplayz</span>
        <span>One shared save</span>
      </footer>
    </div>
  );
}
