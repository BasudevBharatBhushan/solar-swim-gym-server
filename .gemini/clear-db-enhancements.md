# Clear Database and Reindexing Enhancements

## Summary
Enhanced the clear database script and search functionality to properly handle Elasticsearch indices for leads, profiles, and accounts.

## Changes Made

### 1. Clear Database Script (`src/scripts/clear-db.ts`)

**Added:**
- New function `clearElasticsearchIndices()` that clears all three Elasticsearch indices:
  - Leads index
  - Profiles index
  - Accounts index

**Behavior:**
- Checks if each index exists before attempting to delete it
- Provides clear console feedback for each operation
- Handles errors gracefully and continues with other indices
- Called automatically after clearing database tables

**Console Output:**
```
🗑️  Clearing all data from database...
✅ Cleared table: leads
✅ Cleared table: profiles
✅ Cleared table: accounts
... (other tables)
✨ Database tables cleared.
🗑️  Clearing Elasticsearch indices...
✅ Cleared Leads index: leads
✅ Cleared Profiles index: profiles
✅ Cleared Accounts index: accounts
✨ All data cleared (database + Elasticsearch).
```

### 2. Admin Controller (`src/controllers/admin.controller.ts`)

**Profiles Search (`getProfiles`):**
- ✅ Already had reindexing logic when searching all profiles (empty query)
- Cleaned up redundant code for consistency
- Now follows the same pattern as leads

**Accounts Search (`getAccounts`):**
- ✅ Already had reindexing logic when searching all accounts (empty query)
- Cleaned up redundant code for consistency
- Now follows the same pattern as leads

**Reindexing Behavior:**
Both endpoints now consistently:
1. Check if `useElasticsearch=true` query parameter is set
2. If the search query is empty (`q` is empty or whitespace), reindex all data from the database
3. Perform the search using Elasticsearch

This ensures that when viewing all profiles or accounts, the Elasticsearch index is synchronized with the latest database data.

## Testing

To test the clear database functionality:
```bash
npm run ts-node src/scripts/clear-db.ts
```

To test the reindexing on search:
- **Profiles:** `GET /api/v1/admin/profiles?useElasticsearch=true&q=`
- **Accounts:** `GET /api/v1/admin/accounts?useElasticsearch=true&q=`
- **Leads:** `GET /api/v1/leads?useElasticsearch=true&search=`

When the query is empty, the system will automatically sync all data to Elasticsearch before performing the search.

## Benefits

1. **Complete Data Cleanup:** The clear database script now removes both database records AND Elasticsearch indices
2. **Consistent Behavior:** All three search endpoints (leads, profiles, accounts) now follow the same reindexing pattern
3. **Data Freshness:** When viewing all records, the Elasticsearch index is automatically synchronized with the database
4. **Better Debugging:** Clear console output shows exactly what's being cleared
