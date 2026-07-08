// user-prompt-submit hook — injects company context into every conversation
// after onboarding. This is the "your co-founder always knows your company"
// mechanism. Skips injection if no profile exists yet (during onboarding).

import { getState, getConfig } from "../src/state.ts";
import { formatContextBlock } from "../src/decisions.ts";

export default async function userPromptSubmit(ctx: {
  conversationId: string;
  prompt: string;
  latestMessages: Array<{ role: string; content: unknown }>;
  logger?: { debug: (obj: unknown, msg: string) => void };
}): Promise<void> {
  let state;
  try {
    state = getState();
  } catch {
    // State not loaded — skip injection.
    return;
  }

  if (!state.profile) {
    // No profile yet — onboarding hasn't run. Don't inject.
    return;
  }

  const config = getConfig();
  if (!config.contextInjection) {
    return;
  }

  const contextBlock = formatContextBlock(state.profile, state.decisions);

  // Prepend context as a system-level message at the start of the working list.
  // We append it to the first system message if one exists, otherwise
  // insert a new system message at the front.
  const messages = ctx.latestMessages;

  if (messages.length > 0 && messages[0].role === "system") {
    // Append to existing system message.
    const existingContent = String(
      typeof messages[0].content === "string"
        ? messages[0].content
        : JSON.stringify(messages[0].content),
    );
    messages[0].content = existingContent + "\n\n" + contextBlock;
  } else {
    // Insert a system message at the front.
    messages.unshift({
      role: "system",
      content: contextBlock,
    });
  }

  if (ctx.logger) {
    ctx.logger.debug(
      { plugin: "cofounder", conversationId: ctx.conversationId },
      "injected company context",
    );
  }
}
