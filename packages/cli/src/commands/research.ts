import {
  fetchEvents,
  fetchAllActiveEvents,
  write,
  read,
  listFiles,
  getTimestampId,
  type PolymarketEvent,
  type EventResearch,
  type MarketAnalysis,
} from '@polymarket-agent/core';

interface ResearchOptions {
  minVolume?: string;
  minLiquidity?: string;
  limit?: string;
  category?: string;
  search?: string;
}

function parsePrice(price: string | undefined): number {
  if (!price) return 0;
  return parseFloat(price);
}

function parseOutcomes(raw: string | string[]): string[] {
  return typeof raw === 'string' ? JSON.parse(raw) : (raw ?? []);
}

function parsePrices(raw: string | string[]): string[] {
  return typeof raw === 'string' ? JSON.parse(raw) : (raw ?? []);
}

function matchesSearch(event: PolymarketEvent, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const inTitle = event.title?.toLowerCase().includes(needle);
  const inDescription = event.description?.toLowerCase().includes(needle);
  const inMarkets = event.markets?.some((m) =>
    m.question?.toLowerCase().includes(needle),
  );

  return Boolean(inTitle || inDescription || inMarkets);
}

function analyzeMarket(
  market: PolymarketEvent['markets'][number],
): MarketAnalysis {
  const outcomes = parseOutcomes(market.outcomes);
  const prices = parsePrices(market.outcomePrices);

  const yesPrice = parsePrice(prices[0]);
  const noPrice = parsePrice(prices[1]);

  // Placeholder analysis — estimated probability equals market price for now
  // This is where AI/statistical analysis will plug in
  const estimatedProbability = yesPrice;
  const edge = estimatedProbability - yesPrice;

  return {
    marketId: market.id,
    question: market.question,
    currentPrice: { yes: yesPrice, no: noPrice },
    estimatedProbability,
    edge,
    confidence: 'low',
    sources: [],
    reasoning: 'Baseline analysis — no external research performed yet.',
  };
}

function determineAction(
  markets: MarketAnalysis[],
): Pick<EventResearch, 'action' | 'actionReasoning' | 'riskLevel'> {
  const maxEdge = Math.max(...markets.map((m) => Math.abs(m.edge)));

  if (maxEdge < 0.05) {
    return {
      action: 'SKIP',
      actionReasoning:
        'No significant edge detected. Market prices appear efficient.',
      riskLevel: 'low',
    };
  }

  const bestMarket = markets.reduce((a, b) =>
    Math.abs(a.edge) > Math.abs(b.edge) ? a : b,
  );

  if (bestMarket.edge > 0.05) {
    return {
      action: 'BUY_YES',
      actionReasoning: `Market underpricing YES on "${bestMarket.question}" by ${(bestMarket.edge * 100).toFixed(1)}%`,
      riskLevel: maxEdge > 0.15 ? 'high' : 'medium',
    };
  }

  if (bestMarket.edge < -0.05) {
    return {
      action: 'BUY_NO',
      actionReasoning: `Market overpricing YES on "${bestMarket.question}" by ${(Math.abs(bestMarket.edge) * 100).toFixed(1)}%`,
      riskLevel: maxEdge > 0.15 ? 'high' : 'medium',
    };
  }

  return {
    action: 'HOLD',
    actionReasoning: 'Edge is marginal. Monitor for changes.',
    riskLevel: 'low',
  };
}

export async function research(
  eventId: string | undefined,
  options: ResearchOptions,
): Promise<void> {
  try {
    const ts = getTimestampId();

    if (eventId) {
      // Research a single event
      const events = await fetchAllActiveEvents();
      const event = events.find((e) => e.id === eventId);

      if (!event) {
        console.error(`Event ${eventId} not found among active events.`);
        process.exit(1);
      }

      const result = await researchEvent(event, ts);
      console.log(`\n✅ Research saved for "${event.title}"`);
      displayResearch(result);
      return;
    }

    // Research multiple events with filters
    const limit = options.limit ? parseInt(options.limit, 10) : 20;
    const minVolume = options.minVolume ? parseFloat(options.minVolume) : 0;
    const minLiquidity = options.minLiquidity
      ? parseFloat(options.minLiquidity)
      : 0;

    console.log('Fetching active events...');
    let events = await fetchEvents({
      active: true,
      closed: false,
      limit: 100,
    });

    // Apply filters
    if (minVolume > 0) {
      events = events.filter((e) => e.volume >= minVolume);
    }
    if (minLiquidity > 0) {
      events = events.filter((e) => e.liquidity >= minLiquidity);
    }
    if (options.category) {
      const cat = options.category.toLowerCase();
      events = events.filter(
        (e) =>
          e.markets?.some(
            (m) => m.category?.toLowerCase().includes(cat),
          ),
      );
    }
    if (options.search) {
      events = events.filter((e) => matchesSearch(e, options.search!));
    }

    events = events.slice(0, limit);

    console.log(`\nResearching ${events.length} events...\n`);

    const results: EventResearch[] = [];
    for (const [i, event] of events.entries()) {
      console.log(
        `[${i + 1}/${events.length}] Analyzing: ${event.title}`,
      );
      const result = await researchEvent(event, ts);
      results.push(result);
    }

    // Save summary
    const actionsPath = await write(`actions/${ts}.json`, {
      timestamp: new Date().toISOString(),
      recommendations: results
        .filter((r) => r.action !== 'SKIP')
        .map((r) => ({
          eventId: r.eventId,
          title: r.title,
          action: r.action,
          actionReasoning: r.actionReasoning,
          topEdge: Math.max(...r.markets.map((m) => Math.abs(m.edge))),
          confidence: r.markets.reduce(
            (best, m) =>
              Math.abs(m.edge) >
              Math.abs(
                r.markets.find((rm) => rm.confidence === best)?.edge ?? 0,
              )
                ? m.confidence
                : best,
            'low' as MarketAnalysis['confidence'],
          ),
          riskLevel: r.riskLevel,
          timestamp: r.timestamp,
        })),
    });

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`Research complete: ${results.length} events analyzed`);
    console.log(
      `Actions with edge: ${results.filter((r) => r.action !== 'SKIP').length}`,
    );
    console.log(`Saved to: ${actionsPath}`);
    console.log(`${'═'.repeat(80)}`);

    // Display actionable results
    const actionable = results.filter((r) => r.action !== 'SKIP');
    if (actionable.length > 0) {
      console.log('\n🎯 ACTIONABLE:\n');
      for (const r of actionable) {
        displayResearch(r);
      }
    } else {
      console.log(
        '\nNo actionable edges found. All markets appear efficient.',
      );
    }
  } catch (error) {
    console.error('Error during research:', (error as Error).message);
    process.exit(1);
  }
}

async function researchEvent(
  event: PolymarketEvent,
  ts: string,
): Promise<EventResearch> {
  const markets = event.markets.map(analyzeMarket);
  const { action, actionReasoning, riskLevel } = determineAction(markets);

  const result: EventResearch = {
    eventId: event.id,
    title: event.title,
    timestamp: new Date().toISOString(),
    markets,
    action,
    actionReasoning,
    riskLevel,
  };

  await write(`research/${event.id}/${ts}.json`, result);
  return result;
}

function displayResearch(r: EventResearch): void {
  const icon =
    r.action === 'SKIP'
      ? '⏭️'
      : r.action === 'HOLD'
        ? '⏸️'
        : r.action === 'BUY_YES'
          ? '🟢'
          : r.action === 'BUY_NO'
            ? '🔴'
            : '📤';

  console.log(`${icon} [${r.action}] ${r.title}`);
  console.log(`   Risk: ${r.riskLevel} │ ${r.actionReasoning}`);

  const interesting = r.markets
    .filter((m) => Math.abs(m.edge) > 0.01)
    .sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge))
    .slice(0, 3);

  for (const m of interesting) {
    const dir = m.edge > 0 ? '▲' : '▼';
    console.log(
      `   ${dir} ${m.question}: market ${(m.currentPrice.yes * 100).toFixed(1)}% │ est. ${(m.estimatedProbability * 100).toFixed(1)}% │ edge ${(m.edge * 100).toFixed(1)}%`,
    );
  }
  console.log();
}
