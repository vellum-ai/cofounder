// init hook — runs when the plugin loads. Ensures the data directory and
// company-state file exist so hooks and skill tool executors can read them.
// State access is stateless (fresh disk reads per call), so this hook only
// provisions the file — it does not cache anything in memory.

import { ensureStateFile } from "../src/state.ts";

export default async function init(ctx: {
  config?: unknown;
  pluginStorageDir: string;
  logger?: {
    info: (obj: unknown, msg: string) => void;
    warn?: (obj: unknown, msg: string) => void;
  };
}): Promise<void> {
  try {
    ensureStateFile();
  } catch (err) {
    // Degrade rather than block boot — executors fall back to default state.
    ctx.logger?.warn?.(
      { plugin: "cofounder", err },
      "cofounder failed to provision state file",
    );
    return;
  }

  ctx.logger?.info(
    { plugin: "cofounder", storageDir: ctx.pluginStorageDir },
    "cofounder initialized",
  );
}
