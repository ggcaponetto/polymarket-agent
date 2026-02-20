import type { PolymarketEvent, FetchEventsOptions } from './types.js';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

export async function fetchEvents(options: FetchEventsOptions = {}): Promise<PolymarketEvent[]> {
  const { active = true, closed = false, limit = 100, offset = 0 } = options;

  const params = new URLSearchParams({
    active: String(active),
    closed: String(closed),
    limit: String(limit),
    offset: String(offset),
    order: 'volume',
    ascending: 'false',
  });

  const url = `${GAMMA_API_BASE}/events?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<PolymarketEvent[]>;
}

export async function fetchAllActiveEvents(): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const batch = await fetchEvents({ active: true, closed: false, limit, offset });
    if (batch.length === 0) break;
    allEvents.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return allEvents;
}
