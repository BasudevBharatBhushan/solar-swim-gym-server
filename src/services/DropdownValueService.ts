import supabase from '../config/db';
import { DropdownValue } from '../types';

export const upsertDropdownValue = async (data: Partial<DropdownValue>): Promise<DropdownValue> => {
  const { data: result, error } = await supabase
    .from('dropdown_values')
    .upsert(data, { onConflict: 'dropdown_id' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert dropdown value: ${error.message}`);
  }

  return result as DropdownValue;
};

export const getDropdownValues = async (locationId: string): Promise<DropdownValue[]> => {
  const { data, error } = await supabase
    .from('dropdown_values')
    .select('*')
    .eq('location_id', locationId)
    .order('module', { ascending: true })
    .order('label', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch dropdown values: ${error.message}`);
  }

  return data as DropdownValue[];
};

export const deleteDropdownValue = async (dropdownId: string, locationId: string): Promise<void> => {
  const { error } = await supabase
    .from('dropdown_values')
    .delete()
    .eq('dropdown_id', dropdownId)
    .eq('location_id', locationId);

  if (error) {
    throw new Error(`Failed to delete dropdown value: ${error.message}`);
  }
};

export const getDropdownValuesByFilter = async (
  locationId: string,
  module: string,
  label: string
): Promise<DropdownValue[]> => {
  const { data, error } = await supabase
    .from('dropdown_values')
    .select('*')
    .eq('location_id', locationId)
    .eq('module', module)
    .eq('label', label)
    .order('value', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch filtered dropdown values: ${error.message}`);
  }

  return data as DropdownValue[];
};

export default {
  upsertDropdownValue,
  getDropdownValues,
  deleteDropdownValue,
  getDropdownValuesByFilter
};
