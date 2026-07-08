// post-model-call hook — detects decision-like statements in the assistant's
// response and appends a brief offer to log the decision. Not aggressive:
// a single line at the end of the response, only when decision language
// is detected and autoLogDecisions is enabled.

import { loadConfig } from "../src/state.ts";
import { detectDecisionSignal } from "../src/decisions.ts";

export default async function postModelCall(ctx: {
  conversationId: string;
  callSite: string | null;
  content: Array<{ type: string; text?: string }>;
  decision?: string;
  logger?: { debug: (obj: unknown, msg: string) => void };
}): Promise<void> {
  // Only touch the user-facing reply, not background or subagent calls.
  if (ctx.callSite !== "mainAgent") {
    return;
  }

  const config = loadConfig();
  if (!config.autoLogDecisions) {
    return;
  }

  // Extract text from content blocks.
  const textBlocks = ctx.content.filter((b) => b.type === "text" && b.text);
  const fullText = textBlocks.map((b) => b.text ?? "").join("\n");

  if (!detectDecisionSignal(fullText)) {
    return;
  }

  // Append a brief offer to the last text block.
  const lastTextBlock = textBlocks[textBlocks.length - 1];
  if (lastTextBlock && lastTextBlock.text) {
    lastTextBlock.text =
      lastTextBlock.text +
      "\n\n---\n_Want me to log this as a decision? Just say \"log this.\"_";
  }

  if (ctx.logger) {
    ctx.logger.debug(
      { plugin: "cofounder", conversationId: ctx.conversationId },
      "decision signal detected, offered to log",
    );
  }
}
