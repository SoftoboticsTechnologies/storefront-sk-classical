// Static export (output: 'export') has no middleware, so next-intl can't
// redirect "/" -> "/{defaultLocale}" at request time the way it does in SSR
// (see next.config.ts). A Next.js route for "/" outside src/app/[locale]
// also doesn't work here: it needs its own root layout.tsx, and having two
// top-level layouts breaks next/root-params' codegen for every page that
// reads the locale root param (see docs/decisions.md for the full story).
//
// So instead: write a plain static redirect page straight into the export
// output, after the Next build has finished, with no Next.js routing
// involved at all.
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const DEFAULT_LOCALE = 'en';
const outDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)), 'out');

// next.config.ts sets trailingSlash: true, so this route exports as
// "en/index.html" — the redirect target must keep the trailing slash for S3
// static website hosting (and most other static hosts) to resolve it as a
// folder index rather than a literal missing key "en".
const html = `<!DOCTYPE html>
<html lang="${DEFAULT_LOCALE}">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=/${DEFAULT_LOCALE}/">
<link rel="canonical" href="/${DEFAULT_LOCALE}/">
<title>Redirecting…</title>
</head>
<body>
<script>window.location.replace('/${DEFAULT_LOCALE}/');</script>
<p>Redirecting to <a href="/${DEFAULT_LOCALE}/">/${DEFAULT_LOCALE}/</a>…</p>
</body>
</html>
`;

await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
console.log('Wrote out/index.html (static "/" -> "/' + DEFAULT_LOCALE + '/" redirect)');
