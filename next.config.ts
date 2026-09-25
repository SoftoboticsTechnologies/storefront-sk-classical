import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/site/i18n/request.ts');
const isStaticExportBuild = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
    // Full static export for S3+CloudFront (no server/Node runtime at all —
    // see docs/decisions.md). cacheComponents/partialPrefetching (ISR-oriented
    // PPR) were used for the interim SSR->SSG catalog upgrade but are
    // meaningless without a server and were removed in that same migration.
    // Keep the S3 deployment fully static, but do not enable export mode in
    // `next dev`: it disables `src/proxy.ts`, which next-intl needs to route
    // an unprefixed local URL such as `/` to the default locale (`/en/`).
    output: isStaticExportBuild ? 'export' : undefined,
    // S3 static website hosting only auto-serves "index.html" for a key that
    // ends in "/" — it does not map extensionless URLs to a ".html" file the
    // way CloudFront/most static hosts do. Exporting every route as
    // "route/index.html" (instead of "route.html") makes plain S3 website
    // hosting resolve clean URLs correctly. next/link honors this
    // automatically once set.
    trailingSlash: true,
    outputFileTracingRoot: __dirname,
    turbopack: {
        root: __dirname,
    },
    images: {
        // The built-in Image Optimization API needs a server to run on;
        // static export has none, so images are served unoptimized (browser
        // gets the original Vendure asset URL as-is).
        unoptimized: true,
    }
};

export default withNextIntl(nextConfig);
