import type {
  ChannelAdapter,
  ChannelName,
  InboundMessage,
  OutboundMessage,
} from "../types.js";
import { agent } from "../agent/index.js";
import { pairingManager } from "./pairing.js";
import { eventBus } from "./events.js";
import { config } from "../config/manager.js";
import { createLogger } from "../utils/logger.js";
import { TelegramChannel } from "../channels/telegram.js";
import { DiscordChannel } from "../channels/discord.js";
import { SlackChannel } from "../channels/slack.js";
import { WebChatChannel } from "../channels/webchat.js";

const log = createLogger("gateway");

const PAIRING_MESSAGE = (code: string) =>
  `👋 Hi! I'm NexusAI, your personal AI assistant.\n\nTo get started, you need to approve this request.\n\nYour pairing code is: *${code}*\n\nAsk your admin to run:\n\`nexusai pairing approve <channel> ${code}\``;

export class Gateway {
  private channels: Map<ChannelName, ChannelAdapter> = new Map();
  private webchat?: WebChatChannel;

  async start(): Promise<void> {
    log.info("Starting NexusAI Gateway...");
    config.ensureWorkspace();

    const cfg = config.get();

    // ── Telegram ──────────────────────────────────────────────────
    if (cfg.channels?.telegram?.botToken) {
      await this.registerChannel(
        new TelegramChannel(cfg.channels.telegram.botToken)
      );
    }

    // ── Discord ───────────────────────────────────────────────────
    if (cfg.channels?.discord?.token) {
      await this.registerChannel(new DiscordChannel(cfg.channels.discord.token));
    }

    // ── Slack ─────────────────────────────────────────────────────
    if (cfg.channels?.slack?.botToken && cfg.channels?.slack?.appToken) {
      await this.registerChannel(
        new SlackChannel(cfg.channels.slack.botToken, cfg.channels.slack.appToken)
      );
    }

    // ── WebChat (always on) ───────────────────────────────────────
    const gatewayCfg = config.getGateway();
    const webchatPort = (gatewayCfg.port ?? 19000) + 1;
    const webchat = new WebChatChannel(webchatPort);
    this.webchat = webchat;
    await this.registerChannel(webchat);

    const connectedChannels = Array.from(this.channels.keys());
    if (connectedChannels.length === 0) {
      log.warn("No channels configured. Add channel credentials to ~/.nexusai/nexusai.json");
    } else {
      log.info(`Active channels: ${connectedChannels.join(", ")}`);
    }

    log.info("✅ NexusAI Gateway running");
    this.printStatus();
  }

  private async registerChannel(adapter: ChannelAdapter): Promise<void> {
    try {
      await adapter.connect();
      this.channels.set(adapter.name, adapter);

      adapter.onMessage((msg) => {
        void this.handleInbound(msg);
      });

      eventBus.emit("channel.connected", { channel: adapter.name });
      log.info(`Channel connected: ${adapter.name}`);
    } catch (err) {
      log.error(`Failed to connect channel ${adapter.name}`, err);
    }
  }

  private async handleInbound(msg: InboundMessage): Promise<void> {
    log.debug(`[${msg.channel}] ${msg.from}: ${msg.text.slice(0, 80)}`);

    eventBus.emit("message.inbound", msg);

    // ── Security: check pairing ───────────────────────────────────
    const channelCfg = config.get().channels?.[msg.channel];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dmPolicy = (channelCfg as any)?.dmPolicy ?? "pairing";

    if (dmPolicy === "pairing" && !pairingManager.isApproved(msg.channel, msg.from)) {
      const code = pairingManager.createRequest(msg.channel, msg.from);
      await this.sendReply(msg, PAIRING_MESSAGE(code));
      return;
    }

    // ── Process with AI agent ─────────────────────────────────────
    eventBus.emit("agent.thinking", { sessionId: `${msg.channel}:${msg.from}` });

    const reply = await agent.process(msg);

    eventBus.emit("agent.response", {
      sessionId: `${msg.channel}:${msg.from}`,
      text: reply,
    });

    // ── Send reply back ───────────────────────────────────────────
    if (msg.channel === "webchat" && this.webchat) {
      this.webchat.replyToWebChat(msg.from, reply);
    } else {
      await this.sendReply(msg, reply);
    }
  }

  private async sendReply(inbound: InboundMessage, text: string): Promise<void> {
    const adapter = this.channels.get(inbound.channel);
    if (!adapter) return;

    const outbound: OutboundMessage = {
      channel: inbound.channel,
      to: inbound.groupId ?? inbound.from,
      text,
      replyTo: inbound.id,
    };

    try {
      await adapter.send(outbound);
      eventBus.emit("message.outbound", outbound);
    } catch (err) {
      log.error(`Failed to send reply on ${inbound.channel}`, err);
    }
  }

  async stop(): Promise<void> {
    log.info("Stopping Gateway...");
    for (const [name, channel] of this.channels) {
      try {
        await channel.disconnect();
        log.info(`Disconnected: ${name}`);
      } catch {
        // ignore
      }
    }
  }

  private printStatus(): void {
    const gatewayCfg = config.getGateway();
    const agentCfg = config.getAgent();
    const webchatPort = (gatewayCfg.port ?? 19000) + 1;

    console.log(`
╔══════════════════════════════════════╗
║         🧠  NexusAI Gateway          ║
╠══════════════════════════════════════╣
║  Model:    ${agentCfg.model.padEnd(25)} ║
║  WebChat:  http://127.0.0.1:${webchatPort}    ║
║  Channels: ${Array.from(this.channels.keys()).join(", ").padEnd(25)} ║
╚══════════════════════════════════════╝

Press Ctrl+C to stop.
`);
  }

  getConnectedChannels(): ChannelName[] {
    return Array.from(this.channels.keys());
  }

  isChannelConnected(name: ChannelName): boolean {
    return this.channels.get(name)?.isConnected() ?? false;
  }
}

export const gateway = new Gateway();
