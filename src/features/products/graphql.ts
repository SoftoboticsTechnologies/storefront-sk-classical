import {graphql} from '@/platform/vendure/graphql';

export const ProductCardFragment = graphql(`
    fragment ProductCard on SearchResult {
        productId
        productName
        slug
        productAsset {
            id
            preview
        }
        priceWithTax {
            __typename
            ... on PriceRange {
                min
                max
            }
            ... on SinglePrice {
                value
            }
        }
        currencyCode
    }
`);

export const GetProductDetailQuery = graphql(`
    query GetProductDetail($slug: String!) {
        product(slug: $slug) {
            id
            name
            description
            slug
            assets {
                id
                preview
                source
            }
            variants {
                id
                name
                sku
                priceWithTax
                stockLevel
                options {
                    id
                    code
                    name
                    groupId
                    group {
                        id
                        code
                        name
                    }
                }
            }
            optionGroups {
                id
                code
                name
                options {
                    id
                    code
                    name
                }
            }
            collections {
                id
                name
                slug
                parent {
                    id
                }
            }
            facetValues {
                id
                name
                facet {
                    id
                    name
                }
            }
        }
    }
`);

// All images of one product, for the product card's hover slideshow. Fetched
// lazily on first hover, since search results only carry one `productAsset`.
export const GetProductAssetsQuery = graphql(`
    query GetProductAssets($slug: String!) {
        product(slug: $slug) {
            id
            assets {
                id
                preview
            }
        }
    }
`);

// Newest products first. Search has no date sort, so this uses the product
// list, which can sort by `createdAt`.
export const GetNewArrivalsQuery = graphql(`
    query GetNewArrivals($take: Int) {
        products(options: {take: $take, sort: {createdAt: DESC}}) {
            items {
                id
                name
                slug
                featuredAsset {
                    id
                    preview
                }
                variants {
                    id
                    priceWithTax
                    currencyCode
                }
            }
        }
    }
`);
