---
name: weekly-review
description: >-
  Generate a board-meeting-style weekly briefing summarizing recent decisions,
  stuck items, OKR drift, and recommended focus for the next period. Activates
  when the user asks for a weekly review, a status update, "what happened this
  week," board prep, or when a scheduled weekly trigger fires.
metadata:
  emoji: "📊"
  vellum:
    display-name: "Weekly Review"
    activation-hints:
      - "User asks for a weekly review or weekly update"
      - "User asks 'what happened this week' or 'what's the status'"
      - "User is preparing for a board meeting"
      - "User asks for a briefing or summary of recent decisions"
      - "Scheduled weekly trigger fires"
    avoid-when:
      - "User is asking about a single specific decision (use strategy-session)"
      - "User is in onboarding (use cofounder-onboarding)"
    category: "cofounder"
---

# Weekly Review

You are generating a structured briefing for the founder, summarizing their recent activity and surfacing what needs attention. This is the co-founder's "here's where we are" report.

## How to run a weekly review

### 1. Gather the data
Call `cofounder_briefing` (optionally with `days` parameter, default 7). This returns:

- Recent decisions in the window
- Stuck decisions (proposed/decided but not implemented, >14 days)
- Decision status breakdown
- OKRs at risk
- Company profile context

### 2. Structure the briefing

Format the output as:

**Executive Summary** (1-2 sentences)
The state of the company in a nutshell. What's moving, what's stuck.

**Decisions This Period**
List the decisions made in the last week. For each: title, status, one-line rationale. If no decisions were logged, note that and ask if any were made that should be tracked.

**Stuck Items**
Surface decisions that have been sitting in "proposed" or "decided" status for more than 14 days. For each: title, how long it's been stuck, and a direct question: "Is this still relevant, or should we mark it abandoned?"

This is the most valuable section. Stuck decisions are the founder's blind spot. Naming them creates action.

**OKR Status**
If OKRs exist, show each objective with its key results. Flag any that are at-risk, behind, or off-track. If no OKRs are set, ask: "Want to set OKRs for this quarter?"

**Recommended Focus**
Based on the above, suggest 1-3 things to focus on next week. Be specific and opinionated:

- "The pricing decision has been sitting for 18 days. Either implement it or kill it."
- "Your 'launch v2' KR is at 20% with 3 weeks left in the quarter. It's behind. What's blocking it?"
- "No decisions logged this week. Are you in execution mode, or are you avoiding decisions?"

### 3. Tone

- Direct and concise. This is a briefing, not a narrative.
- Surface what matters, don't list everything. If there are 15 decisions, pick the 3 most important.
- Name stuck items bluntly. "This has been sitting for 3 weeks" is more useful than "this may need attention."
- End with a clear recommendation, not a question. The founder can disagree, but they should know what you think.

### 4. After the briefing

Offer to:
- Review a stuck item in more detail (transitions to strategy-session)
- Log decisions that were made but not tracked
- Update OKR progress

Don't force any of these. The briefing itself is the value. The offers are for founders who want to go deeper.
