// State management for the cofounder plugin.
// Loads and persists CompanyState to data/company-state.json.
// Module-level singleton pattern, same approach as polyglot.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { CompanyState, CofounderConfig } from "./types.ts";
import { createDefaultState, createDefaultConfig } from "./types.ts";

const PLUGIN_DIR = dirname(dirname(new URL(import.meta.url).pathname));
const DATA_DIR = join(PLUGIN_DIR, "data");
const STATE_PATH = join(DATA_DIR, "company-state.json");
const CONFIG_PATH = join(PLUGIN_DIR, "config.json");

let _state: CompanyState | null = null;
let _config: CofounderConfig | null = null;
let _storageDir: string = DATA_DIR;

export function getStorageDir(): string {
  return _storageDir;
}

export function getStatePath(): string {
  return STATE_PATH;
}

export function getState(): CompanyState {
  if (!_state) {
    throw new Error("cofounder: state not loaded. init hook may not have run.");
  }
  return _state;
}

export function getConfig(): CofounderConfig {
  if (!_config) {
    _config = createDefaultConfig();
  }
  return _config;
}

export function setState(state: CompanyState): void {
  _state = state;
}

export function saveState(state: CompanyState): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
    _state = state;
  } catch (err) {
    console.error("[cofounder] Failed to save state:", err);
  }
}

/** Mark state as dirty so the stop hook persists it. */
let _dirty = false;
export function markDirty(): void {
  _dirty = true;
}
export function consumeDirty(): boolean {
  const was = _dirty;
  _dirty = false;
  return was;
}

function loadConfig(): CofounderConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...createDefaultConfig(), ...parsed };
  } catch {
    return createDefaultConfig();
  }
}

export function initStorage(pluginStorageDir?: string): void {
  if (pluginStorageDir) {
    _storageDir = pluginStorageDir;
  }
  _config = loadConfig();

  try {
    if (existsSync(STATE_PATH)) {
      const raw = readFileSync(STATE_PATH, "utf-8");
      _state = JSON.parse(raw) as CompanyState;
    } else {
      _state = createDefaultState();
      saveState(_state);
    }
  } catch (err) {
    console.error("[cofounder] Failed to load state, creating fresh:", err);
    _state = createDefaultState();
    saveState(_state);
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
