<div align="center">

# 🧠 NexusAI — Your Omnipresent AI Assistant

**One brain. Every channel. Zero friction.**

Run your own private AI assistant that lives everywhere you do — WhatsApp, Telegram, Slack, Discord, SMS, email, and more. Powered by Claude, ChatGPT, or any LLM. Open source. Self-hosted. Yours.

</div>
<div align="center">

**Built by [Prajit Datta](https://prajitdatta.github.io/) | *MIT License***

</div>

---

## What is NexusAI?

**NexusAI** is a self-hosted, open-source AI assistant gateway that connects any large language model to every messaging platform and productivity tool you already use. No more switching between chat apps just to talk to your AI — NexusAI puts it everywhere.

You run a lightweight **Gateway** on your own machine or server. From that single control plane, your AI assistant becomes reachable on WhatsApp, Telegram, Slack, Discord, SMS, email, and more — all simultaneously, all with a single identity and persistent memory.

> *Think of it like having your own personal AI employee who has a seat in every room you're already in.*

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔌 **Multi-Channel Inbox** | WhatsApp, Telegram, Slack, Discord, SMS, Email, and more |
| 🧠 **Any LLM Backend** | Claude, GPT-4o, Gemini, Mistral, local Ollama — your choice |
| 🔒 **Privacy First** | Self-hosted, your data never leaves your infrastructure |
| 🗣️ **Voice Support** | Always-on wake word + push-to-talk on macOS, iOS & Android |
| 🤖 **Multi-Agent Routing** | Route different channels to different AI agents/personas |
| 🛠️ **Extensible Skills** | Plugin system for calendar, email, browser control, and more |
| 📅 **Automation & Cron** | Schedule tasks, set reminders, trigger webhooks |
| 🖥️ **Live Canvas** | Agent-driven visual workspace rendered in real time |
| 📱 **Companion Apps** | macOS menu bar, iOS & Android native nodes |
| 🐳 **Docker Ready** | One-command deployment with full sandboxing support |

---

## 🚀 Quick Start

**Requirements:** Node.js ≥ 22, npm or pnpm

```bash
# Install globally
npm install -g nexusai-assistant@latest

# Run the interactive setup wizard
nexusai onboard --install-daemon
```

The wizard walks you through:
1. Choosing your AI provider (Anthropic, OpenAI, local Ollama, etc.)
2. Connecting your first messaging channel
3. Installing the Gateway as a background daemon
4. Pairing your first device



---

## 📦 Installation Options

### npm / pnpm (recommended)

```bash
npm install -g nexusai-assistant@latest
# or
pnpm add -g nexusai-assistant@latest

nexusai onboard --install-daemon
```

### Docker

```bash
docker run -d \
  -p 19000:19000 \
  -v ~/.nexusai:/root/.nexusai \
  --name nexusai \
  ghcr.io/prajitdatta/nexusai:latest
```



### Build from Source

```bash
git clone https://github.com/prajitdatta/nexusai.git
cd nexusai

pnpm install
pnpm build

nexusai onboard --install-daemon

# Dev mode with hot reload
pnpm gateway:watch
```

---

## 🗺️ How It Works

```
WhatsApp · Telegram · Slack · Discord · SMS · Email · WebChat
                            │
                            ▼
          ┌─────────────────────────────────┐
          │           NexusAI Gateway        │
          │         (your control plane)     │
          │       ws://127.0.0.1:19000       │
          └──────────────┬──────────────────┘
                         │
          ┌──────────────┼──────────────────┐
          │              │                  │
     AI Agent        CLI Tools         Web Dashboard
  (Claude/GPT/etc)  (nexusai ...)    (localhost:19000)
          │
  ┌───────┴────────┐
  │                │
macOS App    iOS/Android Nodes
```

---

## 🤖 Supported AI Models

NexusAI works with any OpenAI-compatible API. Recommended:

```jsonc
// ~/.nexusai/nexusai.json
{
  "agent": {
    "model": "anthropic/claude-opus-4-6"   // recommended
  }
}
```

| Provider | Models | Notes |
|---|---|---|
| [Anthropic](https://www.anthropic.com) | Claude Opus 4.6, Sonnet 4.6, Haiku 4.5 | **Recommended** — best long-context + safety |
| [OpenAI](https://openai.com) | GPT-4o, GPT-4 Turbo, o3 | Full support |
| [Google](https://ai.google.dev) | Gemini 1.5 Pro, Gemini Flash | Via API |
| [Mistral](https://mistral.ai) | Mistral Large, Codestral | Self-hostable |
| [Ollama](https://ollama.ai) | Llama 3, Phi-3, Mistral, any GGUF | 100% local |


---

## ⚡ CLI Reference

```bash
# Start the gateway
nexusai gateway --port 19000 --verbose

# Send a message to any channel
nexusai message send --to +1234567890 --channel whatsapp --text "Hello from NexusAI"

# Run the AI agent directly
nexusai agent --message "Summarize my unread emails" --thinking high

# Pair a new device or channel
nexusai channels login

# Approve a new user
nexusai pairing approve telegram abc123

# Health check & diagnostics
nexusai doctor

# Update to latest version
nexusai update --channel stable
```

---

## 💬 In-Chat Commands

Send these directly in any connected chat (WhatsApp, Telegram, Slack, etc.):

| Command | Description |
|---|---|
| `/status` | Show session info: model, tokens, cost |
| `/new` or `/reset` | Start a fresh conversation |
| `/compact` | Summarize and compress context window |
| `/think <level>` | Set reasoning depth: `off`, `low`, `medium`, `high`, `max` |
| `/verbose on\|off` | Toggle verbose tool output |
| `/model <name>` | Switch the AI model mid-conversation |
| `/usage off\|tokens\|full` | Toggle per-response usage footer |
| `/help` | Show all available commands |

---

## 🛠️ Skills & Plugins

NexusAI has a plugin system called **Skills**. Install from the community hub or write your own.

```bash
# Browse and install skills
nexusai skills search "calendar"
nexusai skills install nexusai-skill-gcal

# List installed skills
nexusai skills list
```

### Built-in Skills

| Skill | Description |
|---|---|
| `browser` | Full web browsing via Playwright |
| `calendar` | Google Calendar read/write |
| `email` | Gmail read/compose/send |
| `code` | Execute code in a sandboxed environment |
| `memory` | Long-term vector memory across conversations |
| `search` | Web search via Brave or SerpAPI |
| `files` | Read/write files on the host machine |
| `cron` | Schedule recurring tasks |



---

## 🔒 Security Model

NexusAI connects to **real messaging surfaces** — treat all inbound messages as untrusted input.

**Defaults:**
- All new senders receive a pairing challenge and are blocked until approved
- Approve senders: `nexusai pairing approve <channel> <code>`
- Set `dmPolicy: "open"` only if you intentionally want public access
- Non-main sessions (groups, channels) run inside isolated Docker sandboxes by default

**Exposure options:**
- `gateway.bind: "loopback"` — local only (default, most secure)
- Tailscale Serve — tailnet-only HTTPS
- Tailscale Funnel — public HTTPS (requires password auth)
- SSH tunnel — manual port forwarding



---

## 🖥️ Platform Support

| Platform | Status | Notes |
|---|---|---|
| macOS (ARM + Intel) | ✅ Full | Menu bar app, Voice Wake, native notifications |
| Linux (x64, ARM) | ✅ Full | Systemd daemon, headless |
| Windows (WSL2) | ✅ Full | Strongly recommended over native |
| iOS | ✅ Node | Canvas, voice, camera via companion app |
| Android | ✅ Node | Canvas, voice, camera via companion app |
| Docker / Kubernetes | ✅ Full | Recommended for server deployments |
| Raspberry Pi | ✅ Full | ARMv7 + ARM64 |

---

## ⚙️ Configuration

Minimal `~/.nexusai/nexusai.json`:

```jsonc
{
  "agent": {
    "model": "anthropic/claude-opus-4-6"
  },
  "channels": {
    "telegram": {
      "botToken": "YOUR_BOT_TOKEN"
    },
    "discord": {
      "token": "YOUR_DISCORD_BOT_TOKEN"
    },
    "whatsapp": {
      "allowFrom": ["+1234567890"]
    }
  },
  "gateway": {
    "port": 19000,
    "bind": "loopback"
  }
}
```

---

## 🚦 Development Channels

| Channel | npm tag | Description |
|---|---|---|
| `stable` | `latest` | Tagged releases — production ready |
| `beta` | `beta` | Pre-release builds — new features |
| `dev` | `dev` | HEAD of `main` — bleeding edge |

Switch channels:

```bash
nexusai update --channel beta
```

---

## 🤝 Contributing

Contributions are warmly welcome! Whether it's bug fixes, new channel integrations, skill plugins, or documentation — all PRs are reviewed.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-new-channel`
3. Commit your changes: `git commit -m 'feat: add Notion channel'`
4. Push and open a Pull Request

Please read [CONTRIBUTING.md](https://github.com/prajitdatta/nexusai/blob/main/CONTRIBUTING.md) for guidelines, code style, and how to run tests.

AI-assisted PRs are welcome! 🤖

---

## 📜 License

NexusAI is open source under the [MIT License](https://github.com/prajitdatta/nexusai/blob/main/LICENSE).

---

## 💙 Community & Support

- **GitHub Discussions:** [github.com/prajitdatta/nexusai/discussions](https://github.com/prajitdatta/nexusai/discussions)
- **GitHub Issues:** [github.com/prajitdatta/nexusai/issues](https://github.com/prajitdatta/nexusai/issues) — bug reports and feature requests

---


<div align="center">

**Built by [Prajit Datta](https://prajitdatta.github.io/) | *MIT License***

[![GitHub](https://img.shields.io/badge/GitHub-prajitdatta-181717?style=for-the-badge&logo=github)](https://github.com/prajitdatta)&nbsp;&nbsp;
[![Portfolio](https://img.shields.io/badge/Portfolio-prajitdatta.github.io-4F46E5?style=for-the-badge&logo=google-chrome&logoColor=white)](https://prajitdatta.github.io/)

</div>
