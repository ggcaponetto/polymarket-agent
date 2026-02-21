import {
  fetchAllActiveEvents,
  fetchEvents,
  write,
  getTimestampId,
  type EventSnapshot,
} from '@polymarket-agent/core';

interface SnapshotOptions {
  limit?: string;
  all?: boolean;
}

export async function snapshot(options: SnapshotOptions): Promise<void> {
  try {
    const ts = getTimestampId();

    let events;
    if (options.all) {
      console.log('Fetching all active events...');
      events = await fetchAllActiveEvents();
    } else {
      const limit = options.limit ? parseInt(options.limit, 10) : 100;
      console.log(`Fetching top ${limit} active events...`);
      events = await fetchEvents({ active: true, closed: false, limit });
    }

    const data: EventSnapshot = {
      timestamp: new Date().toISOString(),
      eventCount: events.length,
      events,
    };

    const path = await write(`events/${ts}.json`, data);
    console.log(`\n✅ Snapshot saved: ${path}`);
    console.log(`   ${events.length} events captured at ${data.timestamp}`);
  } catch (error) {
    console.error('Error taking snapshot:', (error as Error).message);
    process.exit(1);
  }
}
