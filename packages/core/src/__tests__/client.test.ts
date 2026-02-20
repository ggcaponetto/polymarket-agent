import { describe, it, expect } from 'vitest';
import { fetchEvents } from '../client.js';

describe('fetchEvents', () => {
  it('should fetch active events from Polymarket', async () => {
    const events = await fetchEvents({ limit: 3 });
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty('id');
    expect(events[0]).toHaveProperty('title');
    expect(events[0]).toHaveProperty('markets');
  });
});
