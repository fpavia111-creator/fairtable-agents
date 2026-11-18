import { fileURLToPath } from 'node:url';
import { tableDemo } from 'fairtable-core';
import { DEMO } from './manifest.js';

export async function demo(manifest) {
  await tableDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), DEMO);
}
