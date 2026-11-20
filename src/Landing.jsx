import '@fontsource-variable/bricolage-grotesque';
import './Landing.css';

// Background photo of central Abuja; credit text lives in heroCredit.js.
import { HERO_CREDIT } from './heroCredit';

const STEPS = [
  { n: '1', title: 'Snap it', text: 'Take a photo of the pothole, flood or broken pipe.' },
  { n: '2', title: 'Pin it', text: 'Drop a pin on the Abuja map where it is.' },
  { n: '3', title: 'Follow it', text: 'See when it is checked, assigned and fixed.' },
];

export default function Landing({
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  authError,
  setAuthError,
  onSubmit,
}) {
  const isLogin = authMode === 'login';

  return (
    <div className="landing">
      <picture className="landing-bg">
        <source
          type="image/webp"
          srcSet="/hero/abuja-900.webp 900w, /hero/abuja-1600.webp 1600w, /hero/abuja-2400.webp 2400w"
          sizes="100vw"
        />
        <img
          src="/hero/abuja-1600.jpg"
          alt=""
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="landing-shade" aria-hidden="true" />

      <header className="landing-top">
        <span className="landing-logo">
          <span className="landing-pulse" aria-hidden="true" />
          PulseCity
        </span>
        <span className="landing-place">Abuja, FCT</span>
      </header>

      <main className="landing-main">
        <section className="landing-copy">
          <p className="landing-eyebrow">For people who live and work in Abuja</p>
          <h1>
            Seen a pothole on your street?
            <span> Put it on the map.</span>
          </h1>
          <p className="landing-lead">
            Report broken roads, flooding, water and power problems in a minute. Your
            report goes to the people responsible, and everyone can see when it gets fixed.
          </p>

          <ol className="landing-steps">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="landing-step-n">{s.n}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-card" aria-label={isLogin ? 'Sign in' : 'Create an account'}>
          <h2>{isLogin ? 'Welcome back' : 'Join PulseCity'}</h2>
          <p className="landing-card-sub">
            {isLogin ? 'Sign in to report and follow issues.' : 'It is free. You only need an email.'}
          </p>

          <form onSubmit={onSubmit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? 'Your password' : 'At least 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="landing-submit">
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {authError && <p className="landing-error" role="status">{authError}</p>}

          <p className="landing-switch">
            {isLogin ? 'New here? ' : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setAuthMode(isLogin ? 'signup' : 'login');
                setAuthError('');
              }}
            >
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </section>
      </main>

      <footer className="landing-credit">
        Photo: {HERO_CREDIT.what}, by{' '}
        <a href={HERO_CREDIT.source} target="_blank" rel="noreferrer">{HERO_CREDIT.author}</a>
        {', '}
        <a href={HERO_CREDIT.licenceUrl} target="_blank" rel="noreferrer">{HERO_CREDIT.licence}</a>
      </footer>
    </div>
  );
}
