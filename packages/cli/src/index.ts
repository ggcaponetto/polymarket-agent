#!/usr/bin/env node
import { Command } from 'commander';
import { fetchEvents } from './commands/fetch-events.js';

const program = new Command();

program.name('polymarket').description('Polymarket prediction market agent CLI').version('0.1.0');

program
  .command('fetch-events')
  .description('Fetch active events from Polymarket')
  .option('-l, --limit <number>', 'Max events to fetch', '20')
  .option('-a, --all', 'Fetch all active events (no limit)')
  .option('--json', 'Output raw JSON')
  .action(fetchEvents);

program.parse();
