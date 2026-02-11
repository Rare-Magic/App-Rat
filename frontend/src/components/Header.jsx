import './Header.css'

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
      <img src="/logos/company-logo.png" alt="Company" />
    </div>
  )
}

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <BotLogo />
      </div>
      <h1 className="header-title">Application Portfolio Rationalization</h1>
      <div className="header-right">
        <CompanyLogo />
      </div>
    </header>
  )
}
