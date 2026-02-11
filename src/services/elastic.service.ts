import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import supabase from '../config/db';
import { Lead, Profile, Account } from '../types';

dotenv.config();

const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    apiKey: process.env.ELASTIC_API_KEY || ''
  }
});

export const indexLead = async (lead: Lead) => {
  try {
    await client.index({
      index: 'leads',
      id: lead.lead_id,
      document: {
        lead_id: lead.lead_id,
        location_id: lead.location_id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        mobile: lead.mobile,
        status: lead.status,
        notes: lead.notes,
        created_at: lead.created_at
      }
    });
  } catch (error) {
    console.error('Elasticsearch Indexing Error (Lead):', error);
  }
};

export const indexAccount = async (accountId: string) => {
  try {
    const { data: account, error: accError } = await supabase
      .from('account')
      .select('*, profile(*)')
      .eq('account_id', accountId)
      .single();

    if (accError || !account) return;

    await client.index({
      index: 'accounts',
      id: account.account_id,
      document: {
        account_id: account.account_id,
        location_id: account.location_id,
        status: account.status,
        created_at: account.created_at,
        profiles: (account as Account & { profile: Profile[] }).profile.map((p: Profile) => ({
          profile_id: p.profile_id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          mobile: p.mobile
        }))
      }
    });
  } catch (error) {
    console.error('Elasticsearch Indexing Error (Account):', error);
  }
};

export const deleteLeadsByLocation = async (locationId: string) => {
  try {
    await client.deleteByQuery({
      index: 'leads',
      query: {
        term: { location_id: locationId }
      },
      refresh: true
    });
  } catch (error) {
    console.error('Elasticsearch Delete Error (Leads by Location):', error);
  }
};

export const deleteAccountsByLocation = async (locationId: string) => {
  try {
    await client.deleteByQuery({
      index: 'accounts',
      query: {
        term: { location_id: locationId }
      },
      refresh: true
    });
  } catch (error) {
    console.error('Elasticsearch Delete Error (Accounts by Location):', error);
  }
};

export const searchLeads = async (
  locationId: string,
  query: string,
  from: number = 0,
  size: number = 10,
  sortField: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  const must: Record<string, unknown>[] = [{ term: { location_id: locationId } }];
  
  if (query) {
    must.push({
      multi_match: {
        query: query,
        fields: ['first_name', 'last_name', 'email', 'mobile', 'notes'],
        type: 'phrase_prefix'
      }
    });
  }

  const sortableTextFields = ['first_name', 'last_name', 'email', 'mobile'];
  const actualSortField = sortableTextFields.includes(sortField) ? `${sortField}.keyword` : sortField;

  const result = await client.search({
    index: 'leads',
    from,
    size,
    sort: [{ [actualSortField]: { order: sortOrder } }],
    query: {
      bool: {
        must
      }
    }
  });

  const total = typeof result.hits.total === 'number' 
    ? result.hits.total 
    : (result.hits.total as { value: number })?.value || 0;

  return {
    total,
    results: result.hits.hits.map(h => h._source)
  };
};

export const searchAccounts = async (
  locationId: string,
  query: string,
  from: number = 0,
  size: number = 10,
  sortField: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  const must: Record<string, unknown>[] = [{ term: { location_id: locationId } }];

  if (query) {
    const q = query.toLowerCase();
    must.push({
      nested: {
        path: 'profiles',
        query: {
          query_string: {
            query: `*${q}*`,
            fields: ['profiles.first_name', 'profiles.last_name', 'profiles.email', 'profiles.mobile'],
            analyze_wildcard: true
          }
        }
      }
    });
  }

  const result = await client.search({
    index: 'accounts',
    from,
    size,
    sort: [{ [sortField]: { order: sortOrder } }],
    query: {
      bool: {
        must
      }
    }
  });

  // Log inner hits if needed for debugging
  // console.log('Search Result:', JSON.stringify(result, null, 2));

  const total = typeof result.hits.total === 'number' 
    ? result.hits.total 
    : (result.hits.total as { value: number })?.value || 0;

  return {
    total,
    results: result.hits.hits.map(h => h._source)
  };
};

export const clearIndices = async () => {
    try {
        await client.indices.delete({ index: 'leads', ignore_unavailable: true });
        await client.indices.delete({ index: 'accounts', ignore_unavailable: true });
        
        await client.indices.create({
            index: 'accounts',
            mappings: {
                properties: {
                    profiles: { 
                        type: 'nested',
                        properties: {
                            first_name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                            last_name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                            email: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                            mobile: { type: 'text', fields: { keyword: { type: 'keyword' } } }
                        }
                    },
                    location_id: { type: 'keyword' },
                    created_at: { type: 'date' },
                    status: { type: 'keyword' }
                }
            }
        });
        
        await client.indices.create({
            index: 'leads',
            mappings: {
                properties: {
                    first_name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                    last_name: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                    email: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                    mobile: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                    location_id: { type: 'keyword' },
                    status: { type: 'keyword' },
                    created_at: { type: 'date' }
                }
            }
        });
    } catch (e) {
        console.error('Error clearing indices:', e);
    }
}

export default {
  indexLead,
  indexAccount,
  deleteLeadsByLocation,
  deleteAccountsByLocation,
  searchLeads,
  searchAccounts,
  clearIndices
};
