import type {
  InboundMessage,
  Session,
  ChatMessage,
  CompletionResponse,
} from "../types.js";
import { sessionManager } from "../gateway/sessions.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { OpenAIProvider } from "./providers/openai.js";
import { OllamaProvider } from "./providers/ollama.js";
import { config } from "../config/manager.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("agent");

const DEFAULT_SYSTEM_PROMPT = `You are NexusAI, a helpful personal AI assistant. You are concise, accurate, and friendly. You help the user with any task they need. Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

type ProviderInstance =
  | AnthropicProvider
  | OpenAIProvider
  | OllamaProvider;

// ─── In-Chat Command Handlers ─────────────────────────────────────────────────

interface CommandResult {
  handled: boolean;
  reply?: string;
}

function handleCommand(
  text: string,
  session: Session
): CommandResult {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return { handled: false };

  const [cmd, ...args] = trimmed.slice(1).split(/\s+/);

  switch (cmd?.toLowerCase()) {
    case "status": {
      const model = session.model;
      const msgs = session.messages.length;
      const tokens = session.tokenCount;
      return {
        handled: true,
        reply: `📊 *NexusAI Status*\nModel: \`${model}\`\nMessages: ${msgs}\nTokens used: ${tokens}\nThinking: ${session.thinkingLevel}`,
      };
    }

    case "new":
    case "reset":
      sessionManager.reset(session.id);
      return { handled: true, reply: "🔄 Session reset. Starting fresh!" };

    case "compact":
      sessionManager.compact(
        session.id,
        "Context compacted by user request."
      );
      return {
        handled: true,
        reply: "🗜️ Context compacted. Old messages summarized.",
      };

    case "think": {
      const level = args[0] as Session["thinkingLevel"] | undefined;
      const valid = ["off", "low", "medium", "high", "max"];
      if (!level || !valid.includes(level)) {
        return {
          handled: true,
          reply: `❌ Usage: /think <level>\nValid levels: ${valid.join(", ")}`,
        };
      }
      sessionManager.setThinkingLevel(session.id, level);
      return {
        handled: true,
        reply: `🧠 Thinking level set to: *${level}*`,
      };
    }

    case "model": {
      const newModel = args[0];
      if (!newModel) {
        return {
          handled: true,
          reply: `📦 Current model: \`${session.model}\`\nUsage: /model <model-name>`,
        };
      }
      sessionManager.setModel(session.id, newModel);
      return {
        handled: true,
        reply: `🔄 Model switched to: \`${newModel}\``,
      };
    }

    case "help": {
      const helpText = `🤖 *NexusAI Commands*
/status — Show session info
/new or /reset — Start fresh conversation
/compact — Summarize and compress context
/think <level> — Set reasoning depth (off/low/medium/high/max)
/model <name> — Switch AI model
/help — Show this message`;
      return { handled: true, reply: helpText };
    }

    default:
      return {
        handled: true,
        reply: `❓ Unknown command: /${cmd}\nType /help for available commands.`,
      };
  }
}

// ─── Provider Factory ─────────────────────────────────────────────────────────

function createProvider(model: string): ProviderInstance {
  if (model.startsWith("anthropic/") || model.startsWith("claude")) {
    return new AnthropicProvider();
  }
  if (model.startsWith("openai/") || model.startsWith("gpt")) {
    return new OpenAIProvider();
  }
  if (model.startsWith("ollama/")) {
    return new OllamaProvider();
  }
  // Default to Anthropic
  log.warn(`Unknown model prefix for "${model}", defaulting to Anthropic`);
  return new AnthropicProvider();
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export class Agent {
  async process(inbound: InboundMessage): Promise<string> {
    const session = sessionManager.getOrCreate(
      inbound.channel,
      inbound.from,
      inbound.groupId
    );

    // Check for in-chat commands
    const cmdResult = handleCommand(inbound.text, session);
    if (cmdResult.handled) {
      return cmdResult.reply ?? "✅ Done.";
    }

    // Add user message to session
    const userMsg: ChatMessage = {
      role: "user",
      content: inbound.text,
      timestamp: new Date(),
    };
    sessionManager.addMessage(session.id, userMsg);

    const agentCfg = config.getAgent();
    const provider = createProvider(session.model);

    log.info(
      `Processing message from ${inbound.channel}:${inbound.from} with model=${session.model}`
    );

    let response: CompletionResponse;

    try {
      response = await provider.complete({
        model: session.model,
        messages: session.messages,
        systemPrompt: agentCfg.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
        maxTokens: agentCfg.maxTokens,
        temperature: agentCfg.temperature,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      log.error(`Provider error: ${errMsg}`);
      return `❌ Error: ${errMsg}`;
    }

    // Store assistant reply
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: response.content,
      timestamp: new Date(),
      tokens: response.outputTokens,
    };
    sessionManager.addMessage(session.id, assistantMsg);

    log.info(
      `Response: ${response.outputTokens} output tokens, stop=${response.stopReason}`
    );

    return response.content;
  }
}

export const agent = new Agent();
