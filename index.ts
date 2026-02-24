#!/usr/bin/env node

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ─── CLI colors (inline, no chalk dependency at startup) ──────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  blue: "\x1b[34m",
};

function banner() {
  console.log(`
${c.cyan}${c.bold}  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗ █████╗ ██╗${c.reset}
${c.cyan}${c.bold}  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝██╔══██╗██║${c.reset}
${c.cyan}${c.bold}  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗███████║██║${c.reset}
${c.cyan}${c.bold}  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║██╔══██║██║${c.reset}
${c.cyan}${c.bold}  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║██║  ██║██║${c.reset}
${c.cyan}${c.bold}  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝${c.reset}
${c.gray}  Your omnipresent AI assistant — one brain, every channel${c.reset}
`);
}

const args = process.argv.slice(2);
const command = args[0];

// ─── Print version ────────────────────────────────────────────────────────────
if (command === "--version" || command === "-v") {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf-8")) as { version: string };
  console.log(pkg.version);
  process.exit(0);
}

// ─── Help ─────────────────────────────────────────────────────────────────────
if (!command || command === "--help" || command === "-h" || command === "help") {
  banner();
  console.log(`${c.bold}Usage:${c.reset} nexusai <command> [options]

${c.bold}Commands:${c.reset}
  ${c.cyan}gateway${c.reset}           Start the NexusAI Gateway server
  ${c.cyan}onboard${c.reset}           Interactive setup wizard
  ${c.cyan}agent${c.reset}             Send a one-off message to the AI
  ${c.cyan}pairing${c.reset}           Manage user pairing / approvals
  ${c.cyan}sessions${c.reset}          View active sessions
  ${c.cyan}channels${c.reset}          Manage channel connections
  ${c.cyan}config${c.reset}            View or edit configuration
  ${c.cyan}doctor${c.reset}            Run health checks
  ${c.cyan}update${c.reset}            Update NexusAI to latest version

${c.bold}Options:${c.reset}
  ${c.gray}--version, -v${c.reset}     Show version
  ${c.gray}--help, -h${c.reset}        Show help
  ${c.gray}--verbose${c.reset}         Enable verbose logging

${c.bold}Examples:${c.reset}
  nexusai onboard --install-daemon
  nexusai gateway --port 19000 --verbose
  nexusai agent --message "What's the weather like?"
  nexusai pairing approve telegram A3F9B2
  nexusai doctor
`);
  process.exit(0);
}

// ─── Command routing ──────────────────────────────────────────────────────────

const verbose = args.includes("--verbose");

if (verbose) {
  const { setVerbose } = await import("../utils/logger.js");
  setVerbose(true);
}

switch (command) {
  case "gateway":
    await (await import("./commands/gateway.js")).default(args.slice(1));
    break;

  case "onboard":
    await (await import("./commands/onboard.js")).default(args.slice(1));
    break;

  case "agent":
    await (await import("./commands/agent.js")).default(args.slice(1));
    break;

  case "pairing":
    await (await import("./commands/pairing.js")).default(args.slice(1));
    break;

  case "sessions":
    await (await import("./commands/sessions.js")).default(args.slice(1));
    break;

  case "config":
    await (await import("./commands/config.js")).default(args.slice(1));
    break;

  case "doctor":
    await (await import("./commands/doctor.js")).default(args.slice(1));
    break;

  case "channels":
    await (await import("./commands/channels.js")).default(args.slice(1));
    break;

  case "update":
    console.log(`${c.yellow}To update NexusAI, run:${c.reset}`);
    console.log("  npm install -g nexusai-assistant@latest");
    break;

  default:
    console.error(`${c.red}Unknown command: ${command}${c.reset}`);
    console.log(`Run ${c.cyan}nexusai --help${c.reset} for available commands.`);
    process.exit(1);
}
