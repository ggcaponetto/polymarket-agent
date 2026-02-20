import {
  fetchEvents as apiFetchEvents,
  fetchAllActiveEvents,
  type PolymarketEvent,
} from '@polymarket-agent/core';

interface FetchEventsOptions {
  limit: string;
  all?: boolean;
  json?: boolean;
}

function formatPrice(price: string): string {
  const pct = (parseFloat(price) * 100).toFixed(1);
  return `${pct}%`;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

function displayEvent(event: PolymarketEvent, index: number): void {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`#${index + 1} │ ${event.title}`);
  console.log(`   │ ID: ${event.id}`);
  console.log(`   │ Volume: ${formatVolume(event.volume)} │ Liquidity: ${formatVolume(event.liquidity)}`);
  console.log(`   │ End: ${event.endDate ?? 'N/A'}`);

  for (const market of event.markets) {
    const outcomes: string[] =
      typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : (market.outcomes ?? []);
    const prices: string[] =
      typeof market.outcomePrices === 'string'
        ? JSON.parse(market.outcomePrices)
        : (market.outcomePrices ?? []);

    const pairs = outcomes
      .map((o, i) => `${o}: ${prices[i] ? formatPrice(prices[i]) : '?'}`)
      .join(' │ ');

    console.log(`   ├─ ${market.question}`);
    console.log(`   │  ${pairs}`);
  }
}

export async function fetchEvents(options: FetchEventsOptions): Promise<void> {
  try {
    let events: PolymarketEvent[];

    if (options.all) {
      console.log('Fetching all active events...');
      events = await fetchAllActiveEvents();
    } else {
      const limit = parseInt(options.limit, 10);
      console.log(`Fetching top ${limit} active events by volume...`);
      events = await apiFetchEvents({ active: true, closed: false, limit });
    }

    if (options.json) {
      console.log(JSON.stringify(events, null, 2));
      return;
    }

    console.log(`\nFound ${events.length} active events\n`);

    for (const [i, event] of events.entries()) {
      displayEvent(event, i);
    }

    console.log(`\n${'─'.repeat(80)}`);
  } catch (error) {
    console.error('Error fetching events:', (error as Error).message);
    process.exit(1);
  }
}
