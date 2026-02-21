# polymarket-agent

Autonomous Polymarket prediction market analysis agent. Uses an AI agent (CCAgent via OpenClaw) to perform real web research on live events and produce actionable trade recommendations (BUY YES, BUY NO, SELL, HOLD, or SKIP).

## Architecture

```
┌─────────────┐     ┌───────────────┐     ┌────────────┐
│  Polymarket  │────▶│   CLI (export)  │────▶│   Agent    │
│  Gamma API   │     │   JSON stdout   │     │ (CCAgent)  │
└─────────────┘     └───────────────┘     └─────┬──────┘
                                                │
                                    web research │ analysis
                                                │
                                          ┌─────▼──────┐
                                          │  data/      │
                                          │  research/  │
                                          │  actions/   │
                                          │  events/    │
                                          └────────────┘
```

**Monorepo packages:**

- `packages/core` — Polymarket API client, types, JSON file storage
- `packages/cli` — CLI commands for fetching, exporting, researching, and viewing actions

## Quick Start

```bash
npm install

# List top GTA-related events by volume
npm run cli -- fetch-events --limit 50 --search gta

# Take a snapshot of current market state
npm run cli -- snapshot

# View latest action recommendations
npm run cli -- actions
```

## Agent Research Workflow

This is the core loop. The agent (CCAgent) does real web research — checking news, social media, polls, expert analysis — to estimate true probabilities and find edges against market prices.

### 1. Export events for research

```bash
# Export specific events by ID
npm run cli -- export <id1> <id2> <id3>

# Export all active events
npm run cli -- export --all

# Export top 50 by volume with filters
npm run cli -- export --limit 50 --min-volume 100000

# Export only events containing "GTA"
npm run cli -- export --limit 100 --search gta

# Export with minimum liquidity
npm run cli -- export --limit 30 --min-liquidity 50000
```

This outputs compact JSON to stdout — event metadata, market questions, current prices, volume, and liquidity.

### 2. Agent researches each event

The agent reads the exported JSON, then for each event:

1. **Web research** — searches for recent news, expert opinions, polling data, historical precedents
2. **Probability estimation** — forms an independent estimate of the true probability for each market outcome
3. **Edge calculation** — compares estimated probability vs current market price
4. **Action recommendation** — BUY_YES, BUY_NO, SELL, HOLD, or SKIP with reasoning

Research is saved to `data/research/{eventId}/{timestamp}.json`.

### 3. Review recommendations

```bash
# Show latest action recommendations (sorted by edge)
npm run cli -- actions
```

Output shows actionable trades with edge %, confidence, risk level, and reasoning.

## Data Persistence

All data is stored as JSON files under `data/`:

```
data/
├── events/          # Market snapshots (timestamped)
│   └── 2026-02-21T01-38-15-048Z.json
├── research/        # Per-event research history
│   └── {eventId}/
│       ├── 2026-02-21T01-40-00-000Z.json
│       └── 2026-02-22T09-15-00-000Z.json
└── actions/         # Aggregated action recommendations
    └── 2026-02-21T01-40-00-000Z.json
```

### Research file schema

```json
{
  "eventId": "12345",
  "title": "Will X happen by Y?",
  "timestamp": "2026-02-21T01:40:00.000Z",
  "analyst": "CCAgent",
  "researchSummary": "Based on recent polling data and expert analysis...",
  "markets": [
    {
      "marketId": "abc",
      "question": "Will X happen?",
      "currentPrice": { "yes": 0.65, "no": 0.35 },
      "estimatedProbability": 0.78,
      "edge": 0.13,
      "confidence": "high",
      "sources": ["https://...", "https://..."],
      "reasoning": "Polling average shows 78%, market at 65%..."
    }
  ],
  "action": "BUY_YES",
  "actionReasoning": "Market underpricing YES by 13%",
  "riskLevel": "medium"
}
```

### Actions file schema

```json
{
  "timestamp": "2026-02-21T01:40:00.000Z",
  "recommendations": [
    {
      "eventId": "12345",
      "title": "Will X happen?",
      "action": "BUY_YES",
      "actionReasoning": "Market underpricing YES by 13%",
      "topEdge": 0.13,
      "confidence": "high",
      "riskLevel": "medium",
      "timestamp": "2026-02-21T01:40:00.000Z"
    }
  ]
}
```

## CLI Reference

| Command | Description |
|---------|-------------|
| `fetch-events [--limit N] [--all] [--json] [--search TEXT]` | Display active events (filter by search string) |
| `export [ids...] [--all] [--limit N] [--min-volume N] [--min-liquidity N] [--search TEXT]` | Export event data as JSON for agent consumption |
| `research [eventId] [--limit N] [--min-volume N] [--category S] [--search TEXT]` | Run baseline analysis (stub — use agent workflow for real research) |
| `snapshot [--limit N] [--all]` | Save a point-in-time snapshot of events |
| `actions` | Display latest trade recommendations |

## How to Use with CCAgent

Tell the agent:

> "Research these events: `<id1>` `<id2>` `<id3>`"

or

> "Research all active events with volume > 500k"

or

> "Research every event matching 'gta'"

The agent will:
1. Run `export` to get current market data
2. Web-search each event for real-world context
3. Estimate probabilities and calculate edges
4. Write research + action files to `data/`
5. Report back with recommendations

## License

Private — not for redistribution.
