import { priceTable } from '../src/game/economy';
// Prints the price table as a SQL jsonb literal for the economy migration.
console.log(JSON.stringify(priceTable()));
