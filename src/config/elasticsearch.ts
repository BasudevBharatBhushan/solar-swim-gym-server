import { Client } from "@elastic/elasticsearch";

// Elasticsearch client configuration
// Note: Update the node URL based on your Elasticsearch setup
export const elasticsearchClient = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: process.env.ELASTIC_API_KEY
    ? { apiKey: process.env.ELASTIC_API_KEY }
    : undefined,
});

// Index names
export const LEADS_INDEX = "leads";
export const PROFILES_INDEX = "profiles";
export const ACCOUNTS_INDEX = "accounts";

/**
 * Initialize Elasticsearch indices
 */
export const initializeIndices = async () => {
  await initializeLeadsIndex();
  await initializeProfilesIndex();
  await initializeAccountsIndex();
};

export const initializeLeadsIndex = async () => {
  try {
    const indexExists = await elasticsearchClient.indices.exists({
      index: LEADS_INDEX,
    });
    if (!indexExists) {
      await elasticsearchClient.indices.create({
        index: LEADS_INDEX,
        mappings: {
          properties: {
            lead_id: { type: "keyword" },
            first_name: {
              type: "text",
              fields: { keyword: { type: "keyword" } }
            },
            last_name: {
              type: "text",
              fields: { keyword: { type: "keyword" } }
            },
            email: {
              type: "text",
              fields: { keyword: { type: "keyword" } }
            },
            phone: { type: "keyword" },
            source: { type: "keyword" },
            status: { type: "keyword" },
            notes: { type: "text" },
            company: { type: "text" },
            address: { type: "text" },
            city: { type: "keyword" },
            state: { type: "keyword" },
            zip_code: { type: "keyword" },
            lead_added_on: { type: "date" },
            last_contacted_at: { type: "date" },
            converted_at: { type: "date" },
            created_at: { type: "date" },
            updated_at: { type: "date" },
          },
        },
      });
      console.log("✅ Elasticsearch leads index created");
    }
  } catch (error) {
    console.error("❌ Error initializing leads index:", error);
  }
};

export const initializeProfilesIndex = async () => {
  try {
    const indexExists = await elasticsearchClient.indices.exists({
      index: PROFILES_INDEX,
    });
    if (!indexExists) {
      await elasticsearchClient.indices.create({
        index: PROFILES_INDEX,
        mappings: {
          properties: {
            profile_id: { type: "keyword" },
            account_id: { type: "keyword" },
            first_name: {
              type: "text",
              fields: { keyword: { type: "keyword" } },
            },
            last_name: {
              type: "text",
              fields: { keyword: { type: "keyword" } },
            },
            email: { type: "keyword" },
            role: { type: "keyword" },
            rceb_flag: { type: "boolean" },
            case_manager_name: { type: "text" },
            guardian_name: { type: "text" },
            is_active: { type: "boolean" },
            created_at: { type: "date" },
          },
        },
      });
      console.log("✅ Elasticsearch profiles index created");
    }
  } catch (error) {
    console.error("❌ Error initializing profiles index:", error);
  }
};

export const initializeAccountsIndex = async () => {
  try {
    const indexExists = await elasticsearchClient.indices.exists({
      index: ACCOUNTS_INDEX,
    });
    if (!indexExists) {
      await elasticsearchClient.indices.create({
        index: ACCOUNTS_INDEX,
        mappings: {
          properties: {
            account_id: { type: "keyword" },
            email: { type: "keyword" },
            status: { type: "keyword" },
            created_at: { type: "date" },
            profiles: {
              type: "nested",
              properties: {
                profile_id: { type: "keyword" },
                first_name: { type: "text" },
                last_name: { type: "text" },
                email: { type: "keyword" },
                headmember: { type: "boolean" }
              }
            }
          },
        },
      });
      console.log("✅ Elasticsearch accounts index created");
    }
  } catch (error) {
    console.error("❌ Error initializing accounts index:", error);
  }
};

// --- LEADS OPERATIONS ---

export const indexLead = async (lead: any) => {
  try {
    await elasticsearchClient.index({
      index: LEADS_INDEX,
      id: lead.lead_id,
      document: lead,
    });
    console.log(`✅ Lead ${lead.lead_id} indexed`);
  } catch (error) {
    console.error("❌ Error indexing lead:", error);
  }
};

export const updateLeadInIndex = async (leadId: string, updates: any) => {
  try {
    await elasticsearchClient.update({
      index: LEADS_INDEX,
      id: leadId,
      doc: updates,
    });
    console.log(`✅ Lead ${leadId} updated`);
  } catch (error) {
    console.error("❌ Error updating lead:", error);
  }
};

export const deleteLeadFromIndex = async (leadId: string) => {
  try {
    await elasticsearchClient.delete({ index: LEADS_INDEX, id: leadId });
    console.log(`✅ Lead ${leadId} deleted`);
  } catch (error) {
    console.error("❌ Error deleting lead:", error);
  }
};

/**
 * Search Leads with Pagination and Sorting
 */
export const searchLeads = async (
  query: string,
  from: number = 0,
  size: number = 10,
  sortBy: string = "created_at",
  sortOrder: "asc" | "desc" = "desc",
) => {
  try {
    const body: any = {
      from,
      size,
      sort: [{ [sortBy]: { order: sortOrder } }],
    };

    if (query) {
      body.query = {
        bool: {
          should: [
            {
              match_phrase_prefix: {
                first_name: {
                  query: query,
                  slop: 2
                }
              }
            },
            {
              match_phrase_prefix: {
                last_name: {
                  query: query,
                  slop: 2
                }
              }
            },
            {
              match_phrase_prefix: {
                email: {
                  query: query,
                  slop: 2
                }
              }
            },
            {
              multi_match: {
                query,
                fields: ["first_name", "last_name", "email", "phone", "company", "notes", "city"],
                fuzziness: "AUTO"
              }
            }
          ]
        }
      };
    } else {
      body.query = { match_all: {} };
    }

    const result = await elasticsearchClient.search({
      index: LEADS_INDEX,
      ...body,
    });

    return {
      hits: result.hits.hits.map((hit: any) => hit._source),
      total: (result.hits.total as any).value || 0,
    };
  } catch (error) {
    console.error("❌ Error searching leads:", error);
    return { hits: [], total: 0 };
  }
};

// --- PROFILES OPERATIONS ---

export const indexProfile = async (profile: any) => {
  try {
    await elasticsearchClient.index({
      index: PROFILES_INDEX,
      id: profile.profile_id,
      document: profile,
    });
    console.log(`✅ Profile ${profile.profile_id} indexed`);
  } catch (error) {
    console.error("❌ Error indexing profile:", error);
  }
};

export const searchProfiles = async (
  query: string,
  from: number = 0,
  size: number = 10,
  sortBy: string = "created_at",
  sortOrder: "asc" | "desc" = "desc",
) => {
  try {
    const body: any = {
      from,
      size,
      sort: [{ [sortBy]: { order: sortOrder } }], // Ensure field exists in mapping for sorting
    };

    if (query) {
      body.query = {
        bool: {
          should: [
            {
              match_phrase_prefix: {
                first_name: { query, slop: 2 }
              }
            },
            {
              match_phrase_prefix: {
                last_name: { query, slop: 2 }
              }
            },
            {
              match_phrase_prefix: {
                email: { query, slop: 2 }
              }
            },
            {
              multi_match: {
                query,
                fields: [
                  "first_name",
                  "last_name",
                  "email",
                  "case_manager_name",
                  "guardian_name",
                ],
                fuzziness: "AUTO",
              },
            },
          ],
        },
      };
    } else {
      body.query = { match_all: {} };
    }

    const result = await elasticsearchClient.search({
      index: PROFILES_INDEX,
      ...body,
    });

    return {
      hits: result.hits.hits.map((hit: any) => hit._source),
      total: (result.hits.total as any).value || 0,
    };
  } catch (error) {
    console.error("❌ Error searching profiles:", error);
    return { hits: [], total: 0 };
  }
};

export const deleteProfileFromIndex = async (profileId: string) => {
  try {
    await elasticsearchClient.delete({ index: PROFILES_INDEX, id: profileId });
  } catch (error) {
    console.error("❌ Error deleting profile:", error);
  }
};

// --- ACCOUNTS OPERATIONS ---

export const indexAccount = async (account: any) => {
  try {
    await elasticsearchClient.index({
      index: ACCOUNTS_INDEX,
      id: account.account_id,
      document: account,
    });
    console.log(`✅ Account ${account.account_id} indexed`);
  } catch (error) {
    console.error("❌ Error indexing account:", error);
  }
};

export const searchAccounts = async (
  query: string,
  from: number = 0,
  size: number = 10,
  sortBy: string = "created_at",
  sortOrder: "asc" | "desc" = "desc",
) => {
  try {
    const body: any = {
      from,
      size,
      sort: [{ [sortBy]: { order: sortOrder } }],
    };

    if (query) {
      body.query = {
        bool: {
          should: [
            {
              term: {
                email: query
              }
            },
            {
              wildcard: {
                email: `*${query.toLowerCase()}*`
              }
            },
            {
              multi_match: {
                query,
                fields: ["status", "account_id"],
                fuzziness: "AUTO",
              },
            },
            {
              nested: {
                path: "profiles",
                query: {
                  bool: {
                    should: [
                      { match: { "profiles.first_name": query } },
                      { match: { "profiles.last_name": query } },
                      { match_phrase_prefix: { "profiles.first_name": query } },
                      { match_phrase_prefix: { "profiles.last_name": query } }
                    ]
                  }
                }
              }
            }
          ],
        },
      };
    } else {
      body.query = { match_all: {} };
    }

    const result = await elasticsearchClient.search({
      index: ACCOUNTS_INDEX,
      ...body,
    });

    return {
      hits: result.hits.hits.map((hit: any) => hit._source),
      total: (result.hits.total as any).value || 0,
    };
  } catch (error) {
    console.error("❌ Error searching accounts:", error);
    return { hits: [], total: 0 };
  }
};

export const deleteAccountFromIndex = async (accountId: string) => {
  try {
    await elasticsearchClient.delete({ index: ACCOUNTS_INDEX, id: accountId });
  } catch (error) {
    console.error("❌ Error deleting account:", error);
  }
};
