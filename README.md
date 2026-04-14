# TabFlow

One-click Chrome tab organization. Smart defaults for 200+ domains, custom rules, and optional AI auto-grouping.

**No setup required** — install and click. Gmail goes to Email, GitHub goes to Dev, Figma goes to Design. Instantly.

## Why TabFlow

Chrome has tab groups, but creating them manually is painful. Other extensions either group by domain (too dumb) or require complex configuration (too much work).

TabFlow hits the sweet spot:

- **200+ pre-mapped domains** — works out of the box for most sites
- **Custom rules** — add your own URL patterns for niche tools
- **AI auto-grouping** — optional Claude/OpenAI integration catches everything else
- **One click or keyboard shortcut** — `Alt+G` groups all tabs instantly

## Install

1. Download or clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `tabflow` folder

## How It Works

### Level 1: Smart Defaults (no setup)

TabFlow ships with a curated database of 200+ popular domains mapped to categories:

| Category | Example Sites |
|---|---|
| Email | Gmail, Outlook, Proton Mail, Superhuman |
| Dev | GitHub, VS Code, Vercel, Supabase, AWS |
| Docs | Google Docs, Notion, Dropbox, Confluence |
| Design | Figma, Canva, Framer, Miro |
| Chat | Slack, Discord, Telegram, Teams |
| AI Tools | ChatGPT, Claude, Perplexity, Midjourney |
| Finance | Stripe, Brex, Mercury, QuickBooks |
| Sales & CRM | HubSpot, Salesforce, Apollo, Clay |
| PM | Linear, Asana, Jira, ClickUp |
| Social | X/Twitter, LinkedIn, Reddit |
| And more... | Video, Music, News, Shopping, Analytics, Learning, Hiring |

### Level 2: Custom Rules

Add your own rules in the popup. Custom rules take priority over defaults.

Example: map your company's internal tools to a "Work" group:

- Group: `Work`
- Patterns: `mycompany.com, internal.tools.co`
- Color: Green

### Level 3: AI Auto-Group (optional)

For tabs that don't match any rule, TabFlow can use Claude or GPT to categorize them automatically.

1. Open Settings in the popup
2. Choose your AI provider (Anthropic or OpenAI)
3. Add your API key
4. Click **AI Auto-Group**

The AI only sees domain names and page titles (not full URLs). Assignments are saved as rules so the same sites auto-group next time without AI.

## Privacy

- **No data leaves your browser** unless you use AI auto-grouping
- AI mode sends only domain names and page titles to your chosen provider
- API keys are stored locally in Chrome — never transmitted elsewhere
- No analytics, no tracking, no accounts
- Fully open source

## Keyboard Shortcut

Default: `Alt+G` — groups all tabs instantly.

Customize at `chrome://extensions/shortcuts`.

## Built With

- Chrome Extension Manifest V3
- Chrome Tabs & Tab Groups API
- Anthropic Claude API / OpenAI API (optional)

## Contributing

PRs welcome. If you want to add domains to the smart defaults database, edit `defaults.js` and submit a PR.

## License

MIT
