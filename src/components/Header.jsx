import './Header.css'

const THEMES = [
  { id: 'teal', label: 'Teal', color: '#00c9a7' },
  { id: 'blue', label: 'Blue', color: '#3b82f6' },
  { id: 'green', label: 'Green', color: '#22c55e' },
  { id: 'purple', label: 'Purple', color: '#a855f7' },
  { id: 'orange', label: 'Orange', color: '#f97316' },
]

function BotLogo() {
  return (
    <div className="header-logo header-bot-logo">
      <img src="/logos/bot-logo.png" alt="Bot" />
    </div>
  )
}

function CompanyLogo() {
  return (
    <div className="header-logo header-company-logo">
      <img src="/logos/company-logo.jpg" alt="Company" />
    </div>
  )
}

export default function Header({ theme, onThemeChange }) {
  return (
    <header className="header">
      <div className="header-left">
        <BotLogo />
      </div>
      <h1 className="header-title">App Rationalization</h1>
      <div className="header-right header-right-wrap">
        <div className="theme-picker" role="group" aria-label="Theme color">
          <span className="theme-picker-label">Theme</span>
          <div className="theme-swatches">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-swatch ${theme === t.id ? 'theme-swatch-active' : ''}`}
                style={{ background: t.color }}
                onClick={() => onThemeChange(t.id)}
                title={t.label}
                aria-label={t.label}
                aria-pressed={theme === t.id}
              />
            ))}
          </div>
        </div>
        <CompanyLogo />
      </div>
    </header>
  )
}
