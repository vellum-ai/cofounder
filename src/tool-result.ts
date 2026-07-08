// Result helpers shared by the skill tool executors. Executors run in the
// skill sandbox (separate subprocess), so they return this plain shape rather
// than importing @vellumai/plugin-api, which is only resolvable in the daemon
// process.

export interface SkillToolResult {
  content: string;
  isError: boolean;
}

export function ok(data: unknown): SkillToolResult {
  return { content: JSON.stringify(data, null, 2), isError: false };
}

export function err(message: string): SkillToolResult {
  return { content: JSON.stringify({ error: message }), isError: true };
}
