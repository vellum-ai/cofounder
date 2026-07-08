// init hook — runs when the plugin loads.
// Loads config.json, loads (or creates) company state, and captures
// the pluginStorageDir for the tools (ToolContext doesn't carry it).

import { initStorage } from "../src/state.ts";

export default async function init(ctx: {
  config?: unknown;
  pluginStorageDir: string;
  logger?: { info: (obj: unknown, msg: string) => void };
}): Promise<void> {
  initStorage(ctx.pluginStorageDir);

  if (ctx.logger) {
    ctx.logger.info(
      { plugin: "cofounder", storageDir: ctx.pluginStorageDir },
      "cofounder initialized",
    );
  }
}
