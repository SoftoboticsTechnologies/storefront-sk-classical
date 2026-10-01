# Vendure: `publicPromotions` Shop API query

The product page's offers strip ("Get this as low as ₹X") and the **Offers & Coupons** drawer
(`src/features/products/components/product-offers.tsx`) read storefront offers from a custom Shop
API query. The stock Shop API has no way to list promotions, so this plugin has to be added to the
**Vendure server**. Until it's deployed the storefront request fails quietly and the offer UI stays
hidden. Nothing is hardcoded in the storefront.

## What the storefront expects

```graphql
type PublicPromotion {
    id: ID!
    name: String!
    description: String!
    couponCode: String
    "Order-level % off. Only set when a one-item order is guaranteed to get it (see rules below)."
    percentDiscount: Float
    "Minimum order (minor units, tax inclusive) from a minimum_order_amount condition."
    minimumOrderAmount: Money
    endsAt: DateTime
}

extend type Query {
    publicPromotions: [PublicPromotion!]!
}
```

The storefront calculates "as low as" as `price × (1 − percentDiscount / 100)` for promotions
whose `minimumOrderAmount` (if any) the item's tax-inclusive price already meets, and shows the
lowest result.

## Which promotions are listed

A promotion is returned when **all** of these hold:

- It's enabled, not deleted, assigned to the request's channel, and inside its `startsAt`/`endsAt` window.
- Its new **"Show on storefront"** checkbox (a Promotion custom field the plugin adds) is ticked in
  the Admin UI. Nothing shows by default, so the owner picks which offers to advertise.

`percentDiscount` is only filled in when the price promise is safe:

- the action is `order_percentage_discount` (plain % off the order), and
- the only conditions are none, or one tax-inclusive `minimum_order_amount`.

Any other condition (customer group, specific products, buy X get Y, etc.) or action still
**lists** the offer in the drawer, but leaves `percentDiscount` null. That way "as low as" never
quotes a price the customer might not get.

## Plugin code (Vendure 3.x)

```ts
// src/plugins/public-promotions/public-promotions.plugin.ts (in the Vendure server project)
import {Query, Resolver} from '@nestjs/graphql';
import {
    Ctx,
    LanguageCode,
    PluginCommonModule,
    Promotion,
    RequestContext,
    TransactionalConnection,
    translateDeep,
    VendurePlugin,
} from '@vendure/core';
import gql from 'graphql-tag';
import {IsNull} from 'typeorm';

declare module '@vendure/core/dist/entity/custom-entity-fields' {
    interface CustomPromotionFields {
        showOnStorefront: boolean;
    }
}

const schema = gql`
    type PublicPromotion {
        id: ID!
        name: String!
        description: String!
        couponCode: String
        percentDiscount: Float
        minimumOrderAmount: Money
        endsAt: DateTime
    }
    extend type Query {
        publicPromotions: [PublicPromotion!]!
    }
`;

const arg = (op: {args: Array<{name: string; value: string}>}, name: string) =>
    op.args.find((a) => a.name === name)?.value;

@Resolver()
class PublicPromotionsResolver {
    constructor(private connection: TransactionalConnection) {}

    @Query()
    async publicPromotions(@Ctx() ctx: RequestContext) {
        const now = new Date();
        const promotions = await this.connection.getRepository(ctx, Promotion).find({
            where: {enabled: true, deletedAt: IsNull()},
            relations: ['channels', 'translations'],
        });

        return promotions
            .filter((p) => p.channels.some((c) => c.id === ctx.channelId))
            .filter((p) => (!p.startsAt || p.startsAt <= now) && (!p.endsAt || p.endsAt > now))
            .filter((p) => p.customFields.showOnStorefront)
            .map((p) => {
                const t = translateDeep(p, ctx.languageCode);
                const minCondition = p.conditions.find((c) => c.code === 'minimum_order_amount');
                const minimumOrderAmount = minCondition ? Number(arg(minCondition, 'amount')) : null;
                const minIsTaxInclusive = minCondition ? arg(minCondition, 'taxInclusive') === 'true' : true;
                const onlySafeConditions = p.conditions.every((c) => c.code === 'minimum_order_amount');
                const percentAction =
                    p.actions.length === 1 && p.actions[0].code === 'order_percentage_discount' ? p.actions[0] : null;
                const percentDiscount =
                    percentAction && onlySafeConditions && minIsTaxInclusive
                        ? Number(arg(percentAction, 'discount'))
                        : null;

                return {
                    id: p.id,
                    name: t.name,
                    description: t.description ?? '',
                    couponCode: p.couponCode ?? null,
                    percentDiscount,
                    // A tax-exclusive minimum can't be compared with tax-inclusive prices.
                    minimumOrderAmount: minIsTaxInclusive ? minimumOrderAmount : null,
                    endsAt: p.endsAt ?? null,
                };
            });
    }
}

@VendurePlugin({
    imports: [PluginCommonModule],
    shopApiExtensions: {schema, resolvers: [PublicPromotionsResolver]},
    configuration: (config) => {
        config.customFields.Promotion.push({
            name: 'showOnStorefront',
            type: 'boolean',
            defaultValue: false,
            public: false,
            label: [{languageCode: LanguageCode.en, value: 'Show on storefront'}],
            description: [{languageCode: LanguageCode.en, value: 'List this offer on product pages'}],
        });
        return config;
    },
    compatibility: '^3.0.0',
})
export class PublicPromotionsPlugin {}
```

Then:

1. Add `PublicPromotionsPlugin` to `plugins` in `vendure-config.ts`.
2. The custom field adds a DB column. Generate and run a migration (or rely on `synchronize` in dev).
3. In the Admin UI, open each promotion to advertise and tick **Show on storefront**.

## After deploying

- Re-introspect the schema into `src/graphql-env.d.ts` and move `PublicPromotionsQuery` from
  `src/features/products/offers.ts` into `features/products/graphql.ts` as a normal `graphql()`
  operation. The hand-typed query works without this step.
- Offers that depend on the payment method (the reference site's "Pay Online | Extra 10% off")
  need a custom promotion condition on the server. Vendure has no built-in one. Until then, list
  them without `percentDiscount`, e.g. as a coupon-code offer whose description explains the terms.
