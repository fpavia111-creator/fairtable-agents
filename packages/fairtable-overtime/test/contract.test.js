// Shared contract checks on this agent's own manifest, fixtures and eval cases.
import { fileURLToPath } from 'node:url';
import { agentContract } from 'fairtable-core/testkit';
import { manifest } from '../src/index.js';

agentContract({ manifest, casesFile: fileURLToPath(new URL('../evals/cases.json', import.meta.url)) });
