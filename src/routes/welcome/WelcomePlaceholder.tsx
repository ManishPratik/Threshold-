/**
 * Phase A placeholder. Replaced with the Mirror screen in Phase B.
 * Visible only during the Phase-A verification build.
 */
export function WelcomePlaceholder() {
  return (
    <section
      aria-labelledby="welcome-placeholder-heading"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '48px 32px',
        textAlign: 'center',
      }}
    >
      <h1 id="welcome-placeholder-heading" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 500, letterSpacing: 'var(--tracking-tight)' }}>
        Onboarding shell is live.
      </h1>
      <p style={{ marginTop: '12px', color: 'var(--color-text-muted)' }}>
        Content arrives in Phase B.
      </p>
    </section>
  );
}
