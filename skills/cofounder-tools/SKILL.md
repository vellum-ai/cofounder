---
name: cofounder-tools
description: >-
  Company-memory tools for the co-founder plugin: company profile, decision
  log, OKRs, blind-spot analysis, and briefings. Load when the user wants to
  log, review, or search a strategic decision, set or update OKRs, update
  company profile details, or asks "what did I decide about..." — any
  co-founder data operation outside a full onboarding, strategy session, or
  weekly review.
metadata:
  emoji: "🧰"
  vellum:
    display-name: "Co-Founder Tools"
    activation-hints:
      - "User wants to log, review, or search a strategic decision"
      - "User wants to set, update, or check OKRs or quarterly goals"
      - "User wants to update company profile details (stage, team, funding, focus)"
      - "User asks 'what did I decide about...' or 'what are my OKRs'"
    avoid-when:
      - "User is setting up their company for the first time (use cofounder-onboarding)"
      - "User wants to think through a decision with pushback (use strategy-session)"
      - "User wants a status briefing or board prep (use weekly-review)"
    category: "cofounder"
---

# Co-Founder Tools

Data operations for the co-founder plugin. These tools read and write the
company memory that the other co-founder skills (onboarding, strategy
sessions, weekly reviews) build on — those skills include this one, so the
tools are available whenever any of them is active. Load this skill directly
for standalone data operations: logging a decision, updating OKR progress, or
answering "what did I decide about X."

## The data model

- **Company profile** — name, stage, sector, description, team, funding, top
  challenges, current focus. One profile per workspace; `update` merges only
  the fields provided. The profile powers the automatic company-context
  injection at the start of every conversation.
- **Decisions** — strategic choices with title, rationale, alternatives
  considered, tags, and a lifecycle status: proposed → decided → implemented
  (or reversed / abandoned). Review updates status and records the outcome.
- **OKRs** — quarterly objectives, each with key results tracked by target,
  current value, and progress (0-100). KR status auto-derives from progress
  unless overridden.

## Usage guidance

- Log decisions with the rationale in the founder's words, not a paraphrase.
  Capture alternatives considered — that context is what makes the log useful
  months later.
- When the user mentions a strategic choice that was clearly made ("we
  decided to...", "we're going with..."), offer to log it. Don't log without
  asking.
- Answer "what did I decide about X" with `cofounder_decision` action
  `search`, then summarize the matches with dates and statuses.
- Keep OKR progress updates lightweight: `update_kr` with the new current
  value and progress. Only override `kr_status` when the auto-derived status
  is misleading.
- `cofounder_blindspot` and `cofounder_briefing` return structured data plus
  an `instruction` field — follow that instruction when formatting the
  response.
