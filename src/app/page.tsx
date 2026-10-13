import {
    LayoutDashboard,
    ChartNoAxesCombined,
    Swords,
    Gamepad2,
    Clapperboard,
    Radio,
    Trophy,
    CreditCard,
    UserRound,
    Search,
    Bell,
    ChevronDown,
} from "lucide-react";

const matches = [
    {
        game: "League of Legends",
        result: "WIN",
        kda: "6.67",
        score: "2,800",
        time: "34 min ago",
    },
    {
        game: "League of Legends",
        result: "LOSS",
        kda: "1.43",
        score: "1,700",
        time: "2h ago",
    },
    {
        game: "League of Legends",
        result: "WIN",
        kda: "5.00",
        score: "3,200",
        time: "4h ago",
    },
];

const games = [
    {
        code: "LOL",
        name: "League of Legends",
        username: "ClutchKing",
        region: "EUW",
    },
    {
        code: "VAL",
        name: "Valorant",
        username: "Not connected",
        region: "—",
    },
    {
        code: "CS2",
        name: "Counter-Strike 2",
        username: "Not connected",
        region: "—",
    },
    {
        code: "RL",
        name: "Rocket League",
        username: "Not connected",
        region: "—",
    },
];

export default function Home() {
    return (
        <main className="app-shell">
            <aside className="sidebar">
                <div>
                    <div className="brand">
                        <div className="brand-mark">
                            <span className="logo-c">C</span>
                            <span className="logo-m">M</span>
                        </div>

                        <div>
                            <strong>ClutchMetrics</strong>
                            <span>Performance Hub</span>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <p className="nav-label">Workspace</p>

                        <a className="nav-item active" href="#">
                            <LayoutDashboard size={17} strokeWidth={1.8} />
                            <span>Overview</span>
                        </a>

                        <a className="nav-item" href="#">
                            <ChartNoAxesCombined size={17} strokeWidth={1.8} />
                            <span>Analytics</span>
                        </a>

                        <a className="nav-item" href="#">
                            <Swords size={17} strokeWidth={1.8} />
                            <span>Matches</span>
                        </a>

                        <a className="nav-item" href="#">
                            <Gamepad2 size={17} strokeWidth={1.8} />
                            <span>Game Accounts</span>
                        </a>

                        <p className="nav-label nav-label-spaced">Community</p>

                        <a className="nav-item" href="#">
                            <Clapperboard size={17} strokeWidth={1.8} />
                            <span>Clips</span>
                        </a>

                        <a className="nav-item" href="#">
                            <Radio size={17} strokeWidth={1.8} />
                            <span>Feed</span>
                        </a>

                        <a className="nav-item" href="#">
                            <Trophy size={17} strokeWidth={1.8} />
                            <span>Challenges</span>
                        </a>

                        <p className="nav-label nav-label-spaced">Account</p>

                        <a className="nav-item" href="#">
                            <CreditCard size={17} strokeWidth={1.8} />
                            <span>Subscription</span>
                        </a>

                        <a className="nav-item" href="#">
                            <UserRound size={17} strokeWidth={1.8} />
                            <span>Profile</span>
                        </a>
                    </nav>
                </div>

                <div className="sidebar-bottom">
                    <div className="plan-card">
                        <span className="plan-pill">FREE PLAN</span>
                        <strong>Unlock more analytics</strong>
                        <p>Upgrade for unlimited insights and exports.</p>
                        <button>View Premium</button>
                    </div>

                    <div className="sidebar-user">
                        <div className="avatar">C</div>

                        <div>
                            <strong>clutchplayer</strong>
                            <span>Player</span>
                        </div>

                        <span className="user-more">•••</span>
                    </div>
                </div>
            </aside>

            <section className="main-content">
                <header className="topbar">
                    <div>
                        <span className="topbar-eyebrow">OVERVIEW</span>
                        <h1>Performance Dashboard</h1>
                    </div>

                    <div className="topbar-actions">
                        <button className="topbar-tool">
                            <Search size={17} strokeWidth={1.8} />
                            <span>Search</span>
                        </button>

                        <button className="notification-button" aria-label="Notifications">
                            <Bell size={17} strokeWidth={1.8} />
                            <span className="notification-dot" />
                        </button>

                        <div className="profile-chip">
                            <div className="avatar small-avatar">C</div>

                            <div className="profile-info">
                                <strong>clutchplayer</strong>
                                <span>EUW</span>
                            </div>

                            <ChevronDown
                                className="profile-chevron"
                                size={15}
                                strokeWidth={1.8}
                            />
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    <section className="welcome-row">
                        <div>
                            <p className="eyebrow">YOUR PERFORMANCE</p>
                            <h2>Welcome back, clutchplayer.</h2>
                            <p className="muted">
                                Here&apos;s how you&apos;ve been performing across your
                                latest matches.
                            </p>
                        </div>

                        <div className="filters">
                            <button className="filter-button">
                                League of Legends
                                <span>⌄</span>
                            </button>

                            <button className="filter-button">
                                Last 30 days
                                <span>⌄</span>
                            </button>
                        </div>
                    </section>

                    <section className="metrics-grid">
                        <article className="metric-card">
                            <div className="metric-top">
                                <span>KDA RATIO</span>
                                <span className="trend positive">+8.2%</span>
                            </div>

                            <strong className="metric-number">4.26</strong>
                            <p>Last 10 matches</p>
                        </article>

                        <article className="metric-card">
                            <div className="metric-top">
                                <span>WIN RATE</span>
                                <span className="trend positive">+4.1%</span>
                            </div>

                            <strong className="metric-number">61.2%</strong>
                            <p>3 wins in last 5</p>
                        </article>

                        <article className="metric-card">
                            <div className="metric-top">
                                <span>MATCHES</span>
                                <span className="neutral-badge">30D</span>
                            </div>

                            <strong className="metric-number">48</strong>
                            <p>19h 32m played</p>
                        </article>

                        <article className="metric-card">
                            <div className="metric-top">
                                <span>AVG. KILLS</span>
                                <span className="trend positive">+1.7</span>
                            </div>

                            <strong className="metric-number">9.7</strong>
                            <p>Per match</p>
                        </article>
                    </section>

                    <section className="dashboard-grid">
                        <article className="panel performance-panel">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">ANALYTICS</p>
                                    <h3>KDA evolution</h3>
                                </div>

                                <button className="ghost-button">View analytics</button>
                            </div>

                            <div className="chart-summary">
                                <div>
                                    <strong>4.26</strong>
                                    <span>Average KDA</span>
                                </div>

                                <span className="trend positive">↗ 8.2%</span>
                            </div>

                            <div className="chart-wrapper">
                                <div className="chart-labels">
                                    <span>7.0</span>
                                    <span>5.0</span>
                                    <span>3.0</span>
                                    <span>1.0</span>
                                </div>

                                <svg
                                    className="performance-chart"
                                    viewBox="0 0 760 240"
                                    preserveAspectRatio="none"
                                    aria-label="KDA performance chart"
                                >
                                    <defs>
                                        <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#6d5dfc" />
                                            <stop offset="100%" stopColor="#22d3ee" />
                                        </linearGradient>

                                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop
                                                offset="0%"
                                                stopColor="#765ffb"
                                                stopOpacity="0.26"
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#765ffb"
                                                stopOpacity="0"
                                            />
                                        </linearGradient>
                                    </defs>

                                    <line x1="0" y1="30" x2="760" y2="30" />
                                    <line x1="0" y1="90" x2="760" y2="90" />
                                    <line x1="0" y1="150" x2="760" y2="150" />
                                    <line x1="0" y1="210" x2="760" y2="210" />

                                    <path
                                        className="chart-area"
                                        d="
                      M0,174
                      C55,158 75,92 130,108
                      C180,121 205,155 255,137
                      C310,117 336,62 386,82
                      C438,102 462,143 512,118
                      C565,91 594,111 639,77
                      C682,45 711,65 760,40
                      L760,240
                      L0,240
                      Z
                    "
                                    />

                                    <path
                                        className="chart-line"
                                        d="
                      M0,174
                      C55,158 75,92 130,108
                      C180,121 205,155 255,137
                      C310,117 336,62 386,82
                      C438,102 462,143 512,118
                      C565,91 594,111 639,77
                      C682,45 711,65 760,40
                    "
                                    />

                                    <circle cx="760" cy="40" r="5" />
                                </svg>

                                <div className="chart-dates">
                                    <span>Sep 14</span>
                                    <span>Sep 21</span>
                                    <span>Sep 28</span>
                                    <span>Oct 05</span>
                                    <span>Oct 13</span>
                                </div>
                            </div>
                        </article>

                        <article className="panel challenge-panel">
                            <div className="challenge-accent" />

                            <div className="challenge-brand">
                                <span>SPONSORED CHALLENGE</span>
                                <strong>LOGITECH G</strong>
                            </div>

                            <div>
                                <span className="game-tag">LEAGUE OF LEGENDS</span>
                                <h3>Victory Protocol</h3>
                                <p>Win 5 ranked matches before the challenge expires.</p>
                            </div>

                            <div className="challenge-progress">
                                <div className="progress-label">
                                    <span>Progress</span>
                                    <strong>4 / 5 wins</strong>
                                </div>

                                <div className="progress-track">
                                    <div className="progress-value" />
                                </div>
                            </div>

                            <div className="reward-box">
                                <span>REWARD</span>
                                <strong>Logitech G Pro X Headset</strong>
                            </div>

                            <div className="challenge-footer">
                                <span>2 days left</span>
                                <button>View challenge</button>
                            </div>
                        </article>
                    </section>

                    <section className="bottom-grid">
                        <article className="panel">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">RECENT ACTIVITY</p>
                                    <h3>Latest matches</h3>
                                </div>

                                <button className="ghost-button">View all</button>
                            </div>

                            <div className="matches-list">
                                {matches.map((match, index) => (
                                    <div className="match-row" key={index}>
                                        <div className="match-game">
                                            <div className="game-icon">L</div>

                                            <div>
                                                <strong>{match.game}</strong>
                                                <span>{match.time}</span>
                                            </div>
                                        </div>

                                        <span
                                            className={
                                                match.result === "WIN"
                                                    ? "result win"
                                                    : "result loss"
                                            }
                                        >
                      {match.result}
                    </span>

                                        <div className="match-stat">
                                            <span>KDA</span>
                                            <strong>{match.kda}</strong>
                                        </div>

                                        <div className="match-stat">
                                            <span>Score</span>
                                            <strong>{match.score}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>

                        <article className="panel">
                            <div className="panel-heading">
                                <div>
                                    <p className="eyebrow">ACCOUNTS</p>
                                    <h3>Your games</h3>
                                </div>

                                <button className="ghost-button">Manage</button>
                            </div>

                            <div className="games-grid">
                                {games.map((game) => (
                                    <div className="game-card" key={game.code}>
                                        <div className={`game-badge badge-${game.code.toLowerCase()}`}>
                                            {game.code}
                                        </div>

                                        <div>
                                            <strong>{game.name}</strong>
                                            <span
                                                className={
                                                    game.username === "Not connected"
                                                        ? "account-status disconnected"
                                                        : "account-status connected"
                                                }
                                            >
  {game.username}
</span>
                                        </div>

                                        <span className="region">{game.region}</span>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </section>
                </div>
            </section>

            <button className="chat-button" aria-label="Open Clutch Assistant">
                CM
                <span className="chat-status" />
            </button>
        </main>
    );
}
