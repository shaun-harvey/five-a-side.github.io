import { readdirSync } from 'fs';
import { resolve } from 'path';

let failed = 0;
for (const file of readdirSync('./tests').filter(f => f.endsWith('.test.js'))) {
  try {
    await import(resolve('./tests', file));
    console.log(`\u2714 ${file}`);
  } catch (err) {
    failed++;
    console.error(`\u2716 ${file}`);
    console.error(err);
  }
}
if (failed > 0) {
  console.error(`${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log('All tests passed.');
}
