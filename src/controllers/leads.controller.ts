import { Request, Response, NextFunction } from 'express';
import * as leadsService from '../services/leads.service';

/**
 * GET /api/v1/leads
 * Get all leads with pagination and optional filters
 */
export const getAllLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const source = req.query.source as string;
    const useElasticsearch = req.query.useElasticsearch === 'true';

    // Reindex all leads when searching all (empty query) to ensure data is fresh
    if (!search || search.trim() === '') {
      await leadsService.syncAllLeadsToElasticsearch();
    }

    let result;

    if (useElasticsearch) {
      // Use Elasticsearch for search
      result = await leadsService.searchLeadsWithElasticsearch(search || '', page, limit);
    } else {
      // Use database query
      result = await leadsService.getAllLeads(page, limit, search, status, source);
    }

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leads/:leadId
 * Get specific lead by ID
 */
export const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { leadId } = req.params;
    const lead = await leadsService.getLeadById(leadId as string);

    res.status(200).json({
      success: true,
      lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/leads
 * Create a new lead
 */
export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadsService.createLead(req.body);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/leads/:leadId
 * Update a lead
 */
export const updateLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { leadId } = req.params;
    const lead = await leadsService.updateLead(leadId as string, req.body);

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      lead
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/leads/:leadId
 * Delete a lead
 */
export const deleteLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { leadId } = req.params;
    await leadsService.deleteLead(leadId as string);

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leads/stats
 * Get lead statistics
 */
export const getLeadStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await leadsService.getLeadStats();

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};
