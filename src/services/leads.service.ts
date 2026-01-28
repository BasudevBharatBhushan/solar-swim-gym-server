import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import * as elasticsearch from '../config/elasticsearch';

/**
 * Get all leads with pagination and optional search
 */
export const getAllLeads = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  source?: string
) => {
  try {
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (source) {
      query = query.eq('source', source);
    }

    // Apply search using PostgreSQL full-text search
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    query = query
      .order('lead_added_on', { ascending: false })
      .range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError('Failed to fetch leads', 500);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Search leads using Elasticsearch
 */
export const searchLeadsWithElasticsearch = async (
  query: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const from = (page - 1) * limit;
    const result = await elasticsearch.searchLeads(query, from, limit);

    const total = result.total ? (typeof result.total === 'number' ? result.total : (result.total as any).value) : 0;
    return {
      data: result.hits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    console.error('Elasticsearch search failed:', error);
    console.warn('Falling back to database search');
    // Fallback to database search if Elasticsearch fails
    return getAllLeads(page, limit, query);
  }
};

/**
 * Get a specific lead by ID
 */
export const getLeadById = async (leadId: string) => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('lead_id', leadId)
    .single();

  if (error || !data) {
    throw new AppError('Lead not found', 404);
  }

  return data;
};

/**
 * Create a new lead
 */
export const createLead = async (leadData: any) => {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...leadData,
      lead_added_on: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create lead: ${error.message}`, 500);
  }

  // Index in Elasticsearch
  try {
    await elasticsearch.indexLead(data);
  } catch (esError) {
    console.error('Failed to index lead in Elasticsearch:', esError);
    // Don't fail the request if Elasticsearch indexing fails
  }

  return data;
};

/**
 * Update a lead
 */
export const updateLead = async (leadId: string, updates: any) => {
  const { data, error } = await supabase
    .from('leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('lead_id', leadId)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to update lead: ${error.message}`, 500);
  }

  if (!data) {
    throw new AppError('Lead not found', 404);
  }

  // Update in Elasticsearch
  try {
    await elasticsearch.updateLeadInIndex(leadId, updates);
  } catch (esError) {
    console.error('Failed to update lead in Elasticsearch:', esError);
  }

  return data;
};

/**
 * Delete a lead
 */
export const deleteLead = async (leadId: string) => {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('lead_id', leadId);

  if (error) {
    throw new AppError(`Failed to delete lead: ${error.message}`, 500);
  }

  // Delete from Elasticsearch
  try {
    await elasticsearch.deleteLeadFromIndex(leadId);
  } catch (esError) {
    console.error('Failed to delete lead from Elasticsearch:', esError);
  }

  return { success: true };
};

/**
 * Get lead statistics
 */
export const getLeadStats = async () => {
  const { data, error } = await supabase
    .from('leads')
    .select('status');

  if (error) {
    throw new AppError('Failed to fetch lead statistics', 500);
  }

  const stats = {
    total: data.length,
    new: data.filter(l => l.status === 'new').length,
    contacted: data.filter(l => l.status === 'contacted').length,
    qualified: data.filter(l => l.status === 'qualified').length,
    converted: data.filter(l => l.status === 'converted').length,
    lost: data.filter(l => l.status === 'lost').length
  };

  return stats;
};

/**
 * Sync all leads from Supabase to Elasticsearch
 */
export const syncAllLeadsToElasticsearch = async () => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*');

    if (error) {
      throw new AppError(`Failed to fetch leads for sync: ${error.message}`, 500);
    }

    if (!leads || leads.length === 0) {
      return { success: true, count: 0 };
    }

    // Initialize indices (idempotent)
    await elasticsearch.initializeIndices();

    // Index all leads in parallel for better performance
    await Promise.all(leads.map(lead => elasticsearch.indexLead(lead)));

    return { success: true, count: leads.length };
  } catch (error) {
    console.error('Failed to sync leads to Elasticsearch:', error);
    throw error;
  }
};
