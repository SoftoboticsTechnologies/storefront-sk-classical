import {graphql} from '@/platform/vendure/graphql';
import {ProductCardFragment} from '@/features/products/graphql';

export const GetTopCollectionsQuery = graphql(`
    query GetTopCollections($take: Int, $skip: Int) {
        collections(options: {take: $take, skip: $skip }) {
            totalItems
            items {
                id
                name
                slug
                description
                featuredAsset {
                    id
                    preview
                }
                children {
                    id
                    name
                    slug
                    featuredAsset {
                        id
                        preview
                    }
                }
            }
        }
    }
`);

export const GetCollectionProductsQuery = graphql(`
    query GetCollectionProducts($slug: String!, $input: SearchInput!) {
        collection(slug: $slug) {
            id
            name
            slug
            description
            featuredAsset {
                id
                preview
            }
        }
        search(input: $input) {
            totalItems
            items {
                ...ProductCard
            }
        }
    }
`, [ProductCardFragment]);
