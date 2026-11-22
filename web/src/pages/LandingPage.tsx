import { useState } from 'react'
import { Link } from 'react-router-dom'
import { featuredMentors as mentors } from '@/data/featuredMentors'
import { InitialsAvatar } from '@/components/ui/initials-avatar'

const navLinks = [
  { label: 'Home', to: '#home' },
  { label: 'Explore Mentors', to: '#mentors' },
  { label: 'How It Works', to: '#how-it-works' },
  { label: 'Success Stories', to: '#' },
]

const steps = [
  {
    number: '01',
    icon: 'target',
    title: '1. Define Your Ambition',
    description:
      'Set your tech goals, skill focus, target engineering levels, and career aspirations in our smart onboarding flow tailored to East Africa\u2019s ecosystem.',
    badgeIcon: 'checklist',
    badge: 'Self-assessment in 4 minutes',
    iconClass:
      'w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all',
  },
  {
    number: '02',
    icon: 'workspace_premium',
    iconFilled: true,
    title: '2. Match with a Malkia Leader',
    description:
      'Our intelligent algorithm pairs you with vetted senior women leaders in your domain based on tech stacks, lived experiences, and shared career horizons.',
    badgeIcon: 'handshake',
    badge: '100% Vetted Female Leaders',
    iconClass:
      'w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary group-hover:bg-secondary-container group-hover:text-on-secondary-container transition-all',
  },
  {
    number: '03',
    icon: 'trending_up',
    title: '3. Crown Your Potential',
    description:
      'Schedule bi-weekly 1:1 sessions, track milestone roadmaps, review code, prepare for global interviews, and unlock sovereign leadership roles.',
    badgeIcon: 'verified_user',
    badge: 'Milestone Tracking & Badges',
    iconClass:
      'w-12 h-12 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary group-hover:bg-tertiary-container group-hover:text-on-tertiary transition-all',
  },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <span
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline-sm font-extrabold shadow-sm"
              aria-hidden="true"
            >
              M
            </span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary leading-tight font-extrabold">
                Malkia Mentor
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold tracking-wider uppercase text-[10px]">
                by Malkia Labs
              </span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={link.label}
                href={link.to}
                aria-current={i === 0 ? 'page' : undefined}
                className={
                  i === 0
                    ? 'transition-colors text-primary font-bold'
                    : 'font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors'
                }
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center justify-center font-label-md text-label-md text-primary bg-surface-container-low hover:bg-surface-container-high hover:text-on-surface px-5 py-2.5 rounded-full transition-all"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center font-label-md text-label-md text-on-primary bg-primary-container hover:bg-primary px-6 py-2.5 rounded-full shadow-[0_4px_14px_rgba(124,58,237,0.3)] transition-all font-semibold"
            >
              Join Malkia
            </Link>
            <button
              aria-label="Toggle Mobile Menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            >
              <span className="material-symbols-outlined">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="lg:hidden bg-surface-container-lowest border-t border-outline-variant/40 px-6 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.to}
                onClick={() => setMenuOpen(false)}
                className="font-label-md text-label-md text-on-surface-variant hover:text-primary py-2 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="font-label-md text-label-md text-primary py-2 transition-colors"
            >
              Log In
            </Link>
          </nav>
        )}
      </header>

      <main className="w-full pt-20 bg-surface">
        <div className="flex flex-col w-full">
          {/* HERO SECTION */}
          <section
            id="home"
            className="relative w-full overflow-hidden bg-surface min-h-[560px] lg:min-h-[640px] flex items-center"
          >
            <img
              src="/hero.svg"
              alt="Two women at a desk looking at a laptop under a golden crown"
              className="absolute inset-0 h-full w-full object-cover"
              width={1600}
              height={900}
            />
            <div className="absolute inset-0 bg-surface/80 lg:hidden" />
            <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-surface via-surface/80 to-transparent" />
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
              <div className="max-w-2xl flex flex-col items-start">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface-container-lowest/90 backdrop-blur shadow-sm mb-6">
                  <span className="text-base leading-none">🇰🇪</span>
                  <span className="font-label-sm text-label-sm text-primary font-bold tracking-wide">
                    Malkia Labs Initiative · Empowering African Women in Tech
                  </span>
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-6">
                  Crowning{' '}
                  <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                    African Tech.
                  </span>
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface max-w-xl mb-8 leading-relaxed">
                  Connecting ambitious girls and women across Kenya and East
                  Africa with experienced engineering leaders, product builders,
                  and tech pioneers to accelerate their careers.
                </p>
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                  <Link
                    to="/mentors"
                    className="inline-flex items-center justify-center font-label-md text-label-md text-on-primary bg-primary-container hover:bg-primary px-8 py-3.5 rounded-full shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span
                      className="material-symbols-outlined mr-2 text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      workspace_premium
                    </span>
                    Find a Mentor
                  </Link>
                  <Link
                    to="/register?role=mentor"
                    className="inline-flex items-center justify-center font-label-md text-label-md text-primary bg-surface-container-lowest/90 backdrop-blur hover:bg-surface-container-low px-8 py-3.5 rounded-full shadow-md shadow-primary/5 transition-all duration-200"
                  >
                    Become a Mentor
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS SECTION */}
          <section
            id="how-it-works"
            className="w-full py-20 bg-surface-container-low relative"
          >
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-widest bg-surface-container-high px-4 py-1.5 rounded-full">
                  Methodology
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface mt-4 mb-3">
                  How It Works in 3 Steps
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  An intentional, structured journey engineered for verifiable
                  technical acceleration and sovereign leadership.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <span className="font-headline-xl text-headline-xl text-primary font-extrabold opacity-40 group-hover:opacity-100 transition-opacity">
                        {step.number}
                      </span>
                      <div className={step.iconClass}>
                        <span
                          className="material-symbols-outlined text-[26px]"
                          style={
                            step.iconFilled
                              ? { fontVariationSettings: "'FILL' 1" }
                              : undefined
                          }
                        >
                          {step.icon}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 font-bold">
                        {step.title}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    <div className="mt-8 pt-4 bg-surface-container-low p-3 rounded-xl flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                      <span className="material-symbols-outlined text-[18px]">
                        {step.badgeIcon}
                      </span>
                      {step.badge}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURED MENTORS PREVIEW */}
          <section id="mentors" className="w-full py-20 bg-surface">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
                <div>
                  <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-widest bg-surface-container-high px-4 py-1.5 rounded-full">
                    Sovereign Directory
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface mt-3">
                    Featured Mentors
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">
                    Learn from senior women navigating the frontier of African
                    and global tech.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/mentors"
                    className="font-label-md text-label-md text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    Explore All Mentors
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mentors.map((mentor) => (
                  <div
                    key={mentor.name}
                    className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <InitialsAvatar
                          initials={mentor.initials}
                          accent={mentor.accent}
                          className="w-16 h-16 rounded-2xl text-title-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-headline-sm text-title-md text-on-surface font-bold">
                            {mentor.name}
                          </h3>
                          <p className="font-body-sm text-body-sm text-primary font-semibold leading-snug">
                            {mentor.role}
                          </p>
                        </div>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 leading-normal">
                        {mentor.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FINAL CTA BANNER */}
          <section className="w-full py-20 bg-surface relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
              <div className="bg-gradient-to-br from-surface-container to-surface-container-high rounded-3xl p-10 lg:p-16 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest text-primary font-label-sm text-label-sm font-bold shadow-sm mb-4">
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      stars
                    </span>
                    Next Cohort Matching Closes Soon
                  </div>
                  <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-4">
                    Ready to crown your tech journey?
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant">
                    Join the continent’s most distinguished circle of women
                    engineers, leaders, and pioneers. Claim your seat at the
                    engineering decision tables.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full sm:w-auto shrink-0">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center font-label-md text-label-md text-on-primary bg-primary-container hover:bg-primary px-10 py-4 rounded-full shadow-lg shadow-primary/25 font-bold transition-all duration-200 hover:scale-[1.02] text-center"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    to="/register?role=mentor"
                    className="inline-flex items-center justify-center font-label-md text-label-md text-primary bg-surface-container-lowest hover:bg-surface px-8 py-3.5 rounded-full font-bold transition-all text-center"
                  >
                    Schedule a Discovery Call
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full bg-surface-container-low py-12 mt-12 shadow-[0_-1px_6px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                Malkia Mentor
              </span>
              <span className="font-label-sm text-label-sm text-secondary bg-secondary-fixed px-2 py-0.5 rounded-full font-semibold">
                Pan-African Tech
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Elevating, connecting, and coronating the next generation of
              African women in tech.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-1">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              © {new Date().getFullYear()} Malkia Labs. All rights reserved.
            </p>
            <p className="font-label-sm text-label-sm text-primary font-semibold">
              Dignity • Growth • Sovereign Leadership
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}