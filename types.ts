// ─── Core Types ──────────────────────────────────────────────────────────────

export type ChannelName =
  | "whatsapp"
  | "telegram"
  | "slack"
  | "discord"
  | "sms"
  | "email"
  | "webchat"
  | "matrix"
  | "msteams";

export type ModelProvider = "anthropic" | "openai" | "ollama" | "google";

export type ThinkingLevel = "off" | "low" | "medium" | "high" | "max";

export type DmPolicy = "pairing" | "open" | "closed";

// ─── Config ──────────────────────────────────────────────────────────────────

export interface AgentConfig {
  model: string;
  systemPrompt?: string;
  thinkingLevel?: ThinkingLevel;
  maxTokens?: number;
  temperature?: number;
  workspace?: string;
}

export interface GatewayConfig {
  port: number;
  bind: "loopback" | "all";
  auth?: {
    mode: "none" | "password";
    password?: string;
  };
}

export interface TelegramChannelConfig {
  botToken: string;
  allowFrom?: string[];
  dmPolicy?: DmPolicy;
  groups?: Record<string, { requireMention?: boolean }>;
}

export interface DiscordChannelConfig {
  token: string;
  allowFrom?: string[];
  dmPolicy?: DmPolicy;
  guilds?: string[];
}

export interface SlackChannelConfig {
  botToken: string;
  appToken: string;
  dmPolicy?: DmPolicy;
  allowFrom?: string[];
}

export interface WhatsAppChannelConfig {
  allowFrom?: string[];
  dmPolicy?: DmPolicy;
}

export interface SmsChannelConfig {
  provider: "twilio";
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  allowFrom?: string[];
}

export interface EmailChannelConfig {
  provider: "gmail" | "smtp";
  address: string;
  allowFrom?: string[];
}

export interface ChannelsConfig {
  telegram?: TelegramChannelConfig;
  discord?: DiscordChannelConfig;
  slack?: SlackChannelConfig;
  whatsapp?: WhatsAppChannelConfig;
  sms?: SmsChannelConfig;
  email?: EmailChannelConfig;
}

export interface NexusConfig {
  agent: AgentConfig;
  gateway?: GatewayConfig;
  channels?: ChannelsConfig;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface InboundMessage {
  id: string;
  channel: ChannelName;
  from: string;
  fromName?: string;
  text: string;
  replyTo?: string;
  attachments?: Attachment[];
  groupId?: string;
  timestamp: Date;
}

export interface OutboundMessage {
  channel: ChannelName;
  to: string;
  text: string;
  replyTo?: string;
  groupId?: string;
}

export interface Attachment {
  type: "image" | "audio" | "video" | "file";
  url?: string;
  data?: Buffer;
  mimeType?: string;
  filename?: string;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  channel: ChannelName;
  userId: string;
  groupId?: string;
  model: string;
  thinkingLevel: ThinkingLevel;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  tokenCount: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tokens?: number;
}

// ─── Pairing ──────────────────────────────────────────────────────────────────

export interface PairingEntry {
  channel: ChannelName;
  userId: string;
  code: string;
  approved: boolean;
  createdAt: Date;
}

// ─── Gateway Events ───────────────────────────────────────────────────────────

export type GatewayEvent =
  | { type: "message.inbound"; payload: InboundMessage }
  | { type: "message.outbound"; payload: OutboundMessage }
  | { type: "session.created"; payload: { sessionId: string } }
  | { type: "session.reset"; payload: { sessionId: string } }
  | { type: "channel.connected"; payload: { channel: ChannelName } }
  | { type: "channel.disconnected"; payload: { channel: ChannelName } }
  | { type: "agent.thinking"; payload: { sessionId: string } }
  | { type: "agent.response"; payload: { sessionId: string; text: string } }
  | { type: "error"; payload: { message: string; code?: string } };

// ─── Skills ───────────────────────────────────────────────────────────────────

export interface SkillDefinition {
  name: string;
  version: string;
  description: string;
  tools: ToolDefinition[];
  execute: (toolName: string, args: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ParameterDef>;
}

export interface ParameterDef {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
  enum?: string[];
}

// ─── AI Provider ──────────────────────────────────────────────────────────────

export interface CompletionRequest {
  model: string;
  messages: ChatMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ToolDefinition[];
  stream?: boolean;
}

export interface CompletionResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: "end_turn" | "max_tokens" | "tool_use" | "stop_sequence";
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

// ─── Channel Adapter ──────────────────────────────────────────────────────────

export interface ChannelAdapter {
  name: ChannelName;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: OutboundMessage): Promise<void>;
  isConnected(): boolean;
  onMessage(handler: (msg: InboundMessage) => void): void;
}
