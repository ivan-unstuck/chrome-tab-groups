# Chrome Tab Groups

Auto-organize your Chrome tabs into color-coded groups. One click. No setup.

## The Problem

You have 40+ tabs open. Gmail is next to GitHub is next to Figma is next to some article you'll never read. Chrome added tab groups in 2020, but nobody uses them because **creating groups manually is a chore** — right-click, name it, color it, drag tabs in, repeat for every group, every session.

Existing extensions don't help much:

- **Group-by-domain** extensions are too dumb — they create a separate group for every single domain, which is just a different kind of mess
- **Manual organizers** require you to configure everything upfront, which is the same problem as doing it by hand
- **Most are abandoned** — Chrome's tab group API changed, and half the extensions in the Web Store are broken

## The Solution

Chrome Tab Groups takes a different approach: **a curated database of 200+ popular domains pre-mapped to sensible categories**, plus custom rules you can add, plus optional AI for everything else.

Install it. Click the icon. Your tabs are organized. That's it.

### Three levels of intelligence

**1. Smart Defaults — zero config, works immediately**

The extension ships with a hand-curated mapping of 200+ domains into 18 categories:

| Category | Example Sites |
|---|---|
| Email | Gmail, Outlook, Proton Mail, Superhuman, Hey |
| Calendar | Google Calendar, Calendly, Cal.com, Reclaim |
| Dev | GitHub, GitLab, Stack Overflow, Vercel, Supabase, AWS, npm |
| Design | Figma, Canva, Framer, Miro, Dribbble, Webflow |
| Docs | Google Docs/Drive, Notion, Dropbox, Confluence, Coda |
| Chat | Slack, Discord, Telegram, Teams, WhatsApp, Zoom |
| AI Tools | ChatGPT, Claude, Perplexity, Gemini, Midjourney, Replicate |
| Finance | Stripe, Brex, Mercury, PayPal, QuickBooks, Ramp |
| Sales & CRM | HubSpot, Salesforce, Apollo, Clay, Outreach, Gong |
| PM | Linear, Asana, Jira, ClickUp, Trello, Monday |
| Social | X/Twitter, LinkedIn, Reddit, Product Hunt |
| News | Hacker News, TechCrunch, Substack, Medium |
| Video | YouTube, Vimeo, Twitch, Loom, TikTok |
| Shopping | Amazon, eBay, Walmart, Etsy |
| Analytics | Google Analytics, Mixpanel, PostHog, Amplitude |
| Music | Spotify, Apple Music, SoundCloud, Bandcamp |
| Learning | Coursera, Udemy, LeetCode, freeCodeCamp |
| Hiring | Lever, Greenhouse, Dover, Ashby, Indeed |

80% of your tabs will auto-group with zero configuration.

**2. Custom Rules — for your specific workflow**

Your company's internal tools, your favorite niche apps, your client portals — add custom URL patterns through the popup UI. Custom rules take priority over defaults.

Example:
- Group name: `Work`
- URL patterns: `mycompany.com, internal-app.io, client-portal.net`
- Color: Green

**3. AI Auto-Group — catches everything else (optional)**

For tabs that don't match any rule, the extension can call Claude or GPT to categorize them based on the domain name and page title. You bring your own API key. The AI learns — assignments are saved as rules, so next time the same domain groups automatically without an API call.

Privacy: only domain names and page titles are sent. Never full URLs. Never cookies or page content.

## Install

1. Clone or download this repo
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** → select the repo folder
5. Click the extension icon in the toolbar → **Group Tabs**

## Keyboard Shortcut

**`Alt+G`** — groups all tabs instantly from anywhere.

Customize at `chrome://extensions/shortcuts`.

## Privacy

- **Nothing leaves your browser** unless you opt in to AI mode
- AI mode sends only domain names + page titles (not full URLs, not cookies, not page content)
- API keys stored locally in Chrome storage — never transmitted anywhere except your chosen provider
- No analytics. No tracking. No accounts. No telemetry.
- Fully open source — read every line yourself

## Tech

- Chrome Extension Manifest V3
- Chrome Tabs API + Tab Groups API
- Anthropic Claude API / OpenAI API (optional, user-provided key)
- Zero dependencies. No build step. No framework. Just vanilla JS.

## Contributing

PRs welcome. Two easy ways to contribute:

1. **Add domains** — edit `defaults.js` and add sites to existing categories
2. **Add categories** — propose a new category in `defaults.js` and `CATEGORY_COLORS`

## License

MIT
