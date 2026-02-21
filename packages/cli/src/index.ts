#!/usr/bin/env node
import { Command } from 'commander';
import { fetchEvents } from './commands/fetch-events.js';
import { research } from './commands/research.js';
import { snapshot } from './commands/snapshot.js';
import { actions } from './commands/actions.js';
import { exportEvents } from './commands/export-events.js';

const program = new Command();

program.name('polymarket').description('Polymarket prediction market agent CLI').version('0.1.0');

program
  .command('fetch-events')
  .description('Fetch active events from Polymarket')
  .option('-l, --limit <number>', 'Max events to fetch', '20')
  .option('-a, --all', 'Fetch all active events (no limit)')
  .option('--json', 'Output raw JSON')
  .action(fetchEvents);

program
  .command('research [eventId]')
  .description('Analyze events and generate trade recommendations')
  .option('--min-volume <number>', 'Minimum volume filter')
  .option('--min-liquidity <number>', 'Minimum liquidity filter')
  .option('-l, --limit <number>', 'Max events to research', '20')
  .option('-c, --category <string>', 'Filter by category')
  .action(research);

program
  .command('snapshot')
  .description('Save a snapshot of current active events')
  .option('-l, --limit <number>', 'Max events', '100')
  .option('-a, --all', 'Fetch all active events')
  .action(snapshot);

program
  .command('actions')
  .description('Show latest action recommendations')
  .action(actions);

program
  .command('export [ids...]')
  .description('Export event data as JSON for agent research (pass IDs, or --all)')
  .option('-l, --limit <number>', 'Max events (when no IDs given)', '20')
  .option('-a, --all', 'Export all active events')
  .option('--min-volume <number>', 'Minimum volume filter')
  .option('--min-liquidity <number>', 'Minimum liquidity filter')
  .action(exportEvents);

program.parse();
