import './Hero.css'

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-bg-grid" />
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-dot" />
          Applications Open — 2026 Batch
        </div>
        <h1 className="hero-title">
          RUKF – IIBMP<br />
          <span className="hero-accent">Admissions 2026</span>
        </h1>
        <p className="hero-desc">
          Integrated International Bachelor &amp; Master Programme<br />
          Join the elite dual-degree program in collaboration with<br />
          <strong>Reutlingen University Knowledge Foundation, Germany</strong>
        </p>

        <div className="hero-programs">
          <div className="prog-card">
            <span className="prog-icon">💻</span>
            <div>
              <div className="prog-title">B.Tech in CSE</div>
              <div className="prog-sub">+ M.Sc in Professional Software Engineering</div>
            </div>
          </div>
          <div className="prog-card">
            <span className="prog-icon">📡</span>
            <div>
              <div className="prog-title">B.Tech in ECE</div>
              <div className="prog-sub">+ M.Sc in Digital Business Management</div>
            </div>
          </div>
        </div>

        <div className="hero-cta">
          <a href="#apply-now" className="btn btn-primary">Apply Now</a>
          <a href="#about-iibmp" className="btn btn-ghost">Learn More</a>
        </div>
      </div>

      <div className="hero-stats">
        {[
          { num: '5+', label: 'Year Program' },
          { num: '2', label: 'Dual Degrees' },
          { num: 'Indo–German', label: 'Collaboration' },
          { num: '2026', label: 'Batch Open' },
        ].map((s, i, arr) => (
          <div key={s.label} className="stat-row">
            <div className="stat-item">
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
            {i < arr.length - 1 && <div className="stat-divider" />}
          </div>
        ))}
      </div>
    </section>
  )
}
