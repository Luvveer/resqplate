import { liteClient } from "algoliasearch/lite";

const applicationId = import.meta.env.VITE_ALGOLIA_APP_ID;
const searchApikey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;
const indexName = import.meta.env.VITE_ALGOLIA_LISTINGS_INDEX;

if (!applicationId || !searchApikey || !indexName) {
  throw new Error(
    "Environment Variables are not configured for Algolia frontend",
  );
}

const algoliaSearchClient = liteClient(applicationId, searchApikey);

type AlgoliaListingHit = {
  objectID: string;
};

export async function searchListingIds(query: string): Promise<string[]> {
  const normalized = query.trim();

  if (!normalized) {
    return [];
  }

  const currentTime = Math.floor(Date.now() / 1000);

  const response = await algoliaSearchClient.searchForHits<AlgoliaListingHit>({
    requests: [
      {
        indexName,
        query: normalized,
        filters:
          "status:AVAILABLE" +
          " AND quantityAvailable > 0" +
          ` AND pickupEndTimestamp > ${currentTime}`,
        attributesToRetrieve: ["objectID"],
        hitsPerPage: 100,
      },
    ],
  });

  const firstResult = response.results[0];

  if (!firstResult) {
    return [];
  }

  return firstResult.hits.map((hit) => hit.objectID);
}
