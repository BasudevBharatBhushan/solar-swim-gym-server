import { Request, Response } from 'express';
import dropdownValueService from '../services/DropdownValueService';

export const upsertDropdownValue = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = req.locationId || req.body.location_id;
    if (!locationId) {
      res.status(400).json({ error: 'location_id is required' });
      return;
    }

    const result = await dropdownValueService.upsertDropdownValue({
      ...req.body,
      location_id: locationId
    });
    res.status(200).json(result);
  } catch (err: unknown) {
    console.error('Error in upsertDropdownValue:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const getDropdownValues = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = req.locationId || (req.query.location_id as string);
    if (!locationId) {
      res.status(400).json({ error: 'location_id is required' });
      return;
    }

    const moduleStr = req.query.module as string;
    const labelStr = req.query.label as string;

    if (moduleStr && labelStr) {
      const result = await dropdownValueService.getDropdownValuesByFilter(
        locationId,
        moduleStr,
        labelStr
      );
      res.json(result);
    } else {
      const result = await dropdownValueService.getDropdownValues(locationId);
      res.json(result);
    }
  } catch (err: unknown) {
    console.error('Error in getDropdownValues:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const deleteDropdownValue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const locationId = req.locationId || (req.query.location_id as string);

    if (!id || !locationId) {
      res.status(400).json({ error: 'dropdown_id (id) and location_id are required' });
      return;
    }
    const dropdownId = id as string;
    const locId = locationId as string;

    await dropdownValueService.deleteDropdownValue(dropdownId, locId);
    res.status(200).json({ success: true, message: 'Dropdown value deleted successfully' });
  } catch (err: unknown) {
    console.error('Error in deleteDropdownValue:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export default {
  upsertDropdownValue,
  getDropdownValues,
  deleteDropdownValue
};
