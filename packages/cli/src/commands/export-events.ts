import {
  fetchEvents as apiFetchEvents,
  fetchAllActiveEvents,
  type PolymarketEvent,
} from '@polymarket-agent/core';

interface ExportOptions {
  limit?: string;
  all?: boolean;
  minVolume?: string;
  minLiquidity?: string;
}

function parseOutcomes(raw: string | string[]): string[] {
  return typeof raw === 'string' ? JSON.parse(raw) : (raw ?? []);
}

function parsePrices(raw: string | string[]): string[] {
  return typeof raw === 'string' ? JSON.parse(raw) : (raw ?? []);
}

interface CompactMarket {
  id: string;
  question: string;
  outcomes: string[];
  prices: number[];
  liquidity: string;
  volume: string;
  endDate: string;
}

interface CompactEvent {
  id: string;
  title: string;
  description: string;
  volume: number;
  liquidity: number;
  endDate: string;
  markets: CompactMarket[];
}

function toCompact(event: PolymarketEvent): CompactEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    volume: event.volume,
    liquidity: event.liquidity,
    endDate: event.endDate,
    markets: event.markets.map((m) => ({
      id: m.id,
      question: m.question,
      outcomes: parseOutcomes(m.outcomes),
      prices: parsePrices(m.outcomePrices).map((p) => parseFloat(p)),
      liquidity: m.liquidity,
      volume: m.volume,
      endDate: m.endDate,
    })),
  };
}

export async function exportEvents(
  ids: string[],
  options: ExportOptions,
): Promise<void> {
  try {
    let events: PolymarketEvent[];

    if (options.all) {
      events = await fetchAllActiveEvents();
    } else if (ids.length > 0) {
      // Fetch all and filter by IDs
      const all = await fetchAllActiveEvents();
      events = all.filter((e) => ids.includes(e.id));
      const found = new Set(events.map((e) => e.id));
      const missing = ids.filter((id) => !found.has(id));
      if (missing.length > 0) {
        console.error(
          `Warning: events not found: ${missing.join(', ')}`,
        );
      }
    } else {
      const limit = options.limit ? parseInt(options.limit, 10) : 20;
      events = await apiFetchEvents({
        active: true,
        closed: false,
        limit,
      });
    }

    // Apply filters
    const minVolume = options.minVolume ? parseFloat(options.minVolume) : 0;
    const minLiquidity = options.minLiquidity
      ? parseFloat(options.minLiquidity)
      : 0;

    if (minVolume > 0) {
      events = events.filter((e) => e.volume >= minVolume);
    }
    if (minLiquidity > 0) {
      events = events.filter((e) => e.liquidity >= minLiquidity);
    }

    const compact = events.map(toCompact);
    console.log(JSON.stringify(compact, null, 2));
  } catch (error) {
    console.error('Error exporting events:', (error as Error).message);
    process.exit(1);
  }
}
