// stop hook — persists any dirty state to disk at end of turn.
// Ensures decisions logged, profile updates, and OKR changes survive
// across restarts.

import { getState, saveState, consumeDirty } from "../src/state.ts";

export default async function stop(_ctx: {
  conversationId: string;
  logger?: { debug: (obj: unknown, msg: string) => void };
}): Promise<void> {
  if (!consumeDirty()) {
    return;
  }

  try {
    const state = getState();
    saveState(state);
  } catch {
    // State not loaded — nothing to persist.
  }
}
