import { configureAlgoliaListingIndex } from "../external-services/algolia/algolia.service.js";

async function main(): Promise<void> {
  await configureAlgoliaListingIndex();
  console.log("Algolia listing index successfull configured");
}

main().catch((error) => {
  console.error("Failed to configure Algolia Index", error);
  process.exitCode = 1;
});
