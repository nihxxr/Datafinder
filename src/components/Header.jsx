import { NavLink } from 'react-router-dom'
import { Database, Sparkles, ShieldCheck } from 'lucide-react'

// ─── Custom SVG Logo Icon ──────────────────────────────────────────────────
//
//  Geometry (viewBox 0 0 40 40, center 20 20):
//  • Hexagon outline  r=18  pointy-top  (subtle, outermost layer)
//  • Outer dashed ring  r=15  strokeDasharray="3.5 2"
//  • Solid ring  r=11  (main ring)
//  • Inner dashed ring  r=7   strokeDasharray="2 2"
//  • 4 data-point dots  r=1.8  at N/E/S/W on outer ring (r=15)
//  • Center filled circle  r=2.5
//
function LogoIcon({ size = 38 }) {
  // Hexagon points: pointy-top, r=18, center (20,20)
  // angles: 90°, 30°, -30°, -90°, -150°, 150° (= top, upper-right, lower-right, bottom, lower-left, upper-left)
  const hex = [
    [20,      2],        // top
    [35.588, 11],        // upper-right   20 + 18*sin(60), 20 - 18*cos(60)*... let me recalc
    [35.588, 29],        // lower-right
    [20,      38],       // bottom
    [4.412,  29],        // lower-left
    [4.412,  11],        // upper-left
  ]
  // Correct pointy-top hexagon at r=18, center (20,20):
  // angle k*60° starting from 270° (top)
  // x = 20 + 18*sin(k*60°), y = 20 - 18*cos(k*60°)
  // k=0: (20,  2)
  // k=1: (20+18*sin60, 20-18*cos60) = (20+15.59, 20-9) = (35.59, 11)
  // k=2: (20+18*sin120, 20-18*cos120) = (20+15.59, 20+9) = (35.59, 29)
  // k=3: (20, 20+18) = (20, 38)
  // k=4: (20-15.59, 29) = (4.41, 29)
  // k=5: (4.41, 11)
  const hexPoints = '20,2 35.59,11 35.59,29 20,38 4.41,29 4.41,11'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Hexagon outline — outermost, subtle */}
      <polygon
        points={hexPoints}
        stroke="var(--logo-muted)"
        strokeWidth="0.65"
        fill="none"
        strokeLinejoin="round"
      />

      {/* Outer dashed ring — r=15 */}
      <circle
        cx="20" cy="20" r="15"
        stroke="var(--logo-muted)"
        strokeWidth="0.8"
        strokeDasharray="3.5 2.2"
        strokeLinecap="round"
      />

      {/* Solid middle ring — r=11 */}
      <circle
        cx="20" cy="20" r="11"
        stroke="var(--logo-primary)"
        strokeWidth="1.1"
      />

      {/* Inner dashed ring — r=7 */}
      <circle
        cx="20" cy="20" r="7"
        stroke="var(--logo-muted)"
        strokeWidth="0.75"
        strokeDasharray="2.2 2"
        strokeLinecap="round"
      />

      {/* Data-point dots at N / E / S / W on the outer ring (r=15) */}
      <circle cx="20" cy="5"  r="1.9" fill="var(--logo-primary)" />  {/* N */}
      <circle cx="35" cy="20" r="1.9" fill="var(--logo-primary)" />  {/* E */}
      <circle cx="20" cy="35" r="1.9" fill="var(--logo-primary)" />  {/* S */}
      <circle cx="5"  cy="20" r="1.9" fill="var(--logo-primary)" />  {/* W */}

      {/* Center filled circle */}
      <circle cx="20" cy="20" r="2.6" fill="var(--logo-primary)" />
    </svg>
  )
}

// ─── Wordmark ──────────────────────────────────────────────────────────────
function LogoWordmark() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        userSelect: 'none',
      }}
    >
      {/* "DatasetFinder" */}
      <span
        style={{
          fontSize: 15,
          lineHeight: 1,
          color: 'var(--logo-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        <span style={{ fontWeight: 500 }}>Dataset</span>
        <span style={{ fontWeight: 400 }}>Finder</span>
      </span>

      {/* Attribution */}
      <span
        style={{
          fontSize: 9,
          color: 'var(--logo-muted)',
          lineHeight: 1,
        }}
      >
        by Nihar G
      </span>
    </div>
  )
}

// ─── Nav items ─────────────────────────────────────────────────────────────
const navItems = [
  { to: '/',         label: 'Search',      icon: Database    },
  { to: '/recommend', label: 'Recommender', icon: Sparkles    },
  { to: '/quality',   label: 'Quality',     icon: ShieldCheck },
]

// ─── Header ────────────────────────────────────────────────────────────────
export default function Header() {
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(3, 7, 18, 0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-3 group"
            style={{ textDecoration: 'none' }}
          >
            <LogoIcon size={38} />
            <LogoWordmark />
          </NavLink>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-violet-300'
                      : 'text-slate-500 hover:text-slate-300'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  boxShadow: '0 0 16px rgba(139, 92, 246, 0.1)',
                } : {
                  background: 'transparent',
                  border: '1px solid transparent',
                }}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Live indicator */}
          <div className="hidden md:flex items-center">
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, color: '#334155',
                padding: '5px 11px', borderRadius: 999,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 6px #34d399',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              4 sources live
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
