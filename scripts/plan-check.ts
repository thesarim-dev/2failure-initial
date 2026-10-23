import { getVariantById, getLineupSlot, STORE_CATEGORIES } from '../src/components/moves';
import { SLOTS, unlocksFor } from '../src/lib/plan';
const rank = { BASE: 0, PRO: 1, ELITE: 2 } as const;
let problems = 0;
const used = new Set<string>();
for (const [phase, slots] of Object.entries(SLOTS)) for (const s of slots) {
  const tiers = s.ladder.map((id) => getVariantById(id)?.tier);
  s.ladder.forEach((id) => used.add(id));
  const missing = s.ladder.filter((id) => !getVariantById(id));
  const order = tiers.every((t, i) => i === 0 || rank[t!] >= rank[tiers[i - 1]!]);
  const badStart = s.start.filter((id) => !s.ladder.includes(id));
  const flag = [missing.length && `missing ${missing}`, !order && 'tiers go down', s.ladder.length < 2 && 'single rung', badStart.length && `start not on ladder: ${badStart}`].filter(Boolean);
  if (flag.length) problems++;
  console.log(`${phase.padEnd(6)} ${s.muscle.padEnd(11)} ${s.ladder.length} rungs  ${tiers.map((t) => t![0]).join('')}  ${flag.join('; ') || 'ok'}`);
}
const all = STORE_CATEGORIES.flatMap((c) => c.variants.map((v) => v.id));
const unreached = all.filter((id) => !used.has(id) && getLineupSlot(id) !== 'recovery');
console.log('\nexercises:', all.length, '| not in any slot (excluding rest-day stretches):', unreached.length ? unreached : 'none');
for (const g of ['bar', 'dipBars', 'dumbbell', 'barbell', 'bench', 'backpack'] as const) console.log(`${g.padEnd(9)} unlocks ${unlocksFor(g).length}: ${unlocksFor(g).join(', ')}`);
console.log(problems ? `\n${problems} PROBLEMS` : '\nPLAN OK');
