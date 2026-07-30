import { reindexAllListings } from "../external-services/algolia/algolia.service.js";

async function main(): Promise<void> {
  await reindexAllListings();
  console.log("Algolia listing reindexed successfull");
}

main().catch((error) => {
  console.error("Failed to reindexed Algolia listings", error);
  process.exitCode = 1;
});
