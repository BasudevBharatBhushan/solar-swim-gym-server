import { Router } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * GET /api/v1/debug/activation-tokens
 * EXTREMELY INSECURE: Only for testing/development.
 * Fetches the most recent activation tokens to help with test automation.
 */
router.get('/activation-tokens', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profile_activation_tokens')
      .select('*, account:accounts(email)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    res.status(200).json({
      success: true,
      tokens: data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

import { clearDatabase } from '../scripts/clear-db';

/**
 * DELETE /api/v1/debug/clear-db
 * Clear all data from the database.
 */
router.delete('/clear-db', async (req, res) => {
  try {
    await clearDatabase();
    res.status(200).json({
      success: true,
      message: 'Database cleared successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
