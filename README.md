# Co-Founder

Your AI co-founder. It remembers your company context, challenges your thinking, and tracks your decisions. Built for founders who want a thinking partner, not a yes-man.

## What it does

- **Remembers your company.** After onboarding, every conversation starts with your company context injected automatically — name, stage, sector, top challenges, last decision.
- **Challenges your thinking.** Strategy sessions surface blind spots, reference prior decisions, and push back when something doesn't add up.
- **Tracks decisions.** Log strategic decisions with rationale. Review them later. Search your decision history.
- **Weekly briefings.** Generate a board-meeting-style briefing from recent decisions, stuck items, and OKR drift.
- **OKR tracking.** Quarterly objectives and key results, with drift detection.

## Install

```
assistant plugins install cofounder
```

## Config

Edit `config.json` in the plugin directory:

| Field | Default | Options |
|-------|---------|---------|
| `challengeStyle` | `"direct"` | `"direct"` (pushback, "that won't work because...") or `"supportive"` (gentler, "have you considered...") |
| `autoLogDecisions` | `true` | Offer to log decisions detected in conversation |
| `briefingCadence` | `"weekly"` | How often to suggest a briefing |
| `contextInjection` | `true` | Inject company context into every conversation |

## Surfaces

### Skills
- `cofounder-tools` — The tool surface: company profile, decision log, OKRs, blind spots, briefings. Tools are skill-scoped (loaded on demand, not always-on) and the other three skills include this one, so the tools are available whenever any co-founder skill is active.
- `cofounder-onboarding` — First-run company setup (the activation critical path)
- `strategy-session` — Active co-founder mode with pushback and blind spot surfacing
- `weekly-review` — Summarize the week, flag stuck items, surface OKR drift

### Skill tools (bundled in `cofounder-tools`)
- `cofounder_profile` — Store and retrieve company context
- `cofounder_decision` — Log, list, review, and search strategic decisions
- `cofounder_blindspot` — Surface blind spots for a proposed plan or decision
- `cofounder_briefing` — Generate a board-meeting-style briefing
- `cofounder_okr` — Track quarterly objectives and key results

Executors run in the skill sandbox and persist state to `data/company-state.json` on every write.

### Hooks
- `init` — Ensure `data/company-state.json` exists
- `user-prompt-submit` — Inject company context into conversations
- `post-model-call` — Detect decision-like statements, offer to log

## License

MIT
