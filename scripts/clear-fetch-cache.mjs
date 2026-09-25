// Runs first in `npm run build` (chained, not a `prebuild` hook: .npmrc sets
// ignore-scripts=true, which also skips pre/post scripts). Next persists Vendure responses in .next/cache/fetch-cache
// and reuses them across builds, so without this a rebuild can bake in stale
// catalog data (e.g. collections added in the admin after the previous build).
import {rmSync} from 'node:fs';

rmSync('.next/cache/fetch-cache', {recursive: true, force: true});
console.log('Cleared .next/cache/fetch-cache');
