import { listFiles, read, type DailyActions } from '@polymarket-agent/core';

export async function actions(): Promise<void> {
  try {
    const files = await listFiles('actions');
    if (files.length === 0) {
      console.log(
        'No action files found. Run `research` first.',
      );
      return;
    }

    const latest = files[files.length - 1];
    const data = await read<DailyActions>(`actions/${latest}`);

    if (!data || data.recommendations.length === 0) {
      console.log('No actionable recommendations in latest run.');
      return;
    }

    console.log(`\n🎯 Latest recommendations (${data.timestamp})\n`);
    console.log(`${'═'.repeat(80)}`);

    const sorted = [...data.recommendations].sort(
      (a, b) => Math.abs(b.topEdge) - Math.abs(a.topEdge),
    );

    for (const rec of sorted) {
      const icon =
        rec.action === 'BUY_YES'
          ? '🟢'
          : rec.action === 'BUY_NO'
            ? '🔴'
            : rec.action === 'SELL'
              ? '📤'
              : '⏸️';

      console.log(
        `${icon} [${rec.action}] ${rec.title}`,
      );
      console.log(
        `   Edge: ${(rec.topEdge * 100).toFixed(1)}% │ Confidence: ${rec.confidence} │ Risk: ${rec.riskLevel}`,
      );
      console.log(`   ${rec.actionReasoning}`);
      console.log();
    }

    console.log(`${'═'.repeat(80)}`);
    console.log(
      `Total: ${sorted.length} actionable recommendations`,
    );
  } catch (error) {
    console.error(
      'Error loading actions:',
      (error as Error).message,
    );
    process.exit(1);
  }
}
