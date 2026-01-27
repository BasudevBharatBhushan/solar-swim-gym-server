import { Request, Response, NextFunction } from 'express';
import * as legalService from '../services/legal.service';

/**
 * GET /api/v1/legal/contracts
 * Get all contracts for authenticated user
 */
export const getContracts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = req.query.accountId as string;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'accountId is required'
      });
    }

    const contracts = await legalService.getContracts(accountId);

    res.status(200).json({
      success: true,
      contracts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/legal/contracts/:contractId
 * Get specific contract details
 */
export const getContractById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params;
    const accountId = req.query.accountId as string;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'accountId is required'
      });
    }

    const contract = await legalService.getContractById(contractId as string, accountId);

    res.status(200).json({
      success: true,
      contract
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/legal/contracts/:contractId/sign
 * Sign a contract
 */
export const signContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params;
    const { accountId } = req.body;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'accountId is required'
      });
    }

    const contract = await legalService.signContract(contractId as string, accountId);

    res.status(200).json({
      success: true,
      message: 'Contract signed successfully',
      contract
    });
  } catch (error) {
    next(error);
  }
};
