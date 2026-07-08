// State management for the cofounder plugin.
// Company state lives in data/company-state.json at the plugin root. Hooks run
// in the daemon process while skill tool executors run in short-lived sandbox
// subprocesses, so nothing holds state in memory: every caller loads fresh
// from disk and saves explicitly.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CompanyState, CofounderConfig } from "./types.ts";
import { createDefaultState, createDefaultConfig } from "./types.ts";

const PLUGIN_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = join(PLUGIN_DIR, "data");
const STATE_PATH = join(DATA_DIR, "company-state.json");
const CONFIG_PATH = join(PLUGIN_DIR, "config.json");

/** Load company state from disk, falling back to a fresh default state. */
export function loadState(): CompanyState {
  try {
    if (existsSync(STATE_PATH)) {
      const raw = readFileSync(STATE_PATH, "utf-8");
      return JSON.parse(raw) as CompanyState;
    }
  } catch (err) {
    console.error("[cofounder] Failed to load state, using fresh state:", err);
  }
  return createDefaultState();
}

/** Persist company state atomically (write temp file, then rename). */
export function saveState(state: CompanyState): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${STATE_PATH}.tmp-${process.pid}`;
  writeFileSync(tmpPath, JSON.stringify(state, null, 2), "utf-8");
  renameSync(tmpPath, STATE_PATH);
}

/** Create the state file with defaults if it doesn't exist yet. */
export function ensureStateFile(): void {
  if (!existsSync(STATE_PATH)) {
    saveState(createDefaultState());
  }
}

/** Load plugin config from config.json, merged over defaults. */
export function loadConfig(): CofounderConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return { ...createDefaultConfig(), ...JSON.parse(raw) };
  } catch {
    return createDefaultConfig();
  }
}

/** Generate a simple unique ID. */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Get current ISO date string. */
export function now(): string {
  return new Date().toISOString();
}
