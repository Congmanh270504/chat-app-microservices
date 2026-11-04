import { Meilisearch } from 'meilisearch';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

export const meiliClient = new Meilisearch({
  host: env.MEILISEARCH_HOST,
  apiKey: env.MEILISEARCH_MASTER_KEY,
});

export const MESSAGES_INDEX = 'messages';

export interface MeiliMessageDocument {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAtTimestamp: number;
  createdAt: string;
}

export async function setupMeilisearch(): Promise<void> {
  try {
    const index = meiliClient.index(MESSAGES_INDEX);

    // Ensure index exists with primary key 'id'
    try {
      await meiliClient.getIndex(MESSAGES_INDEX);
    } catch {
      await meiliClient.createIndex(MESSAGES_INDEX, { primaryKey: 'id' });
    }

    // Configure attributes for fast filtering & searching
    await index.updateFilterableAttributes(['conversationId', 'senderId', 'createdAtTimestamp']);

    await index.updateSearchableAttributes(['body']);

    await index.updateSortableAttributes(['createdAtTimestamp']);

    logger.info('[Meilisearch] Index and settings configured successfully');
  } catch (error) {
    logger.warn(
      { error },
      '[Meilisearch] Could not initialize index (Meilisearch might be offline or starting up)',
    );
  }
}

export async function indexMessageDoc(doc: MeiliMessageDocument): Promise<void> {
  try {
    const index = meiliClient.index(MESSAGES_INDEX);
    await index.addDocuments([doc], { primaryKey: 'id' });
  } catch (error) {
    logger.error({ error, messageId: doc.id }, '[Meilisearch] Failed to index message');
  }
}

export async function searchMessagesInMeili({
  conversationId,
  query,
  limit = 20,
  offset = 0,
}: {
  conversationId: string;
  query: string;
  limit?: number;
  offset?: number;
}) {
  const index = meiliClient.index(MESSAGES_INDEX);

  const searchResults = await index.search(query, {
    filter: `conversationId = "${conversationId}"`,
    sort: ['createdAtTimestamp:desc'],
    limit,
    offset,
    attributesToHighlight: ['body'],
    highlightPreTag:
      '<mark class="bg-amber-200 dark:bg-amber-900/60 font-semibold text-foreground px-0.5 rounded">',
    highlightPostTag: '</mark>',
  });

  return {
    hits: searchResults.hits,
    totalHits: searchResults.estimatedTotalHits ?? searchResults.hits.length,
    limit: searchResults.limit,
    offset: searchResults.offset,
    query: searchResults.query,
  };
}
