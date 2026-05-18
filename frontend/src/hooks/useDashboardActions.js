import { useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { downloadDashboardReport, fetchCollection, performDashboardAction } from '../api/client.js';

export default function useDashboardActions(role, refresh) {
  const toast = useToast();

  const runAction = useCallback(async (action, label, payload = {}) => {
    try {
      const result = await performDashboardAction(role, action, label, payload);
      toast({ title: result.message || `${label} completed`, status: 'success', duration: 2600 });
      if (refresh) {
        const next = await refresh();
        return next;
      }
      return result;
    } catch (error) {
      toast({ title: `${label} failed`, description: error.message, status: 'error', duration: 3600 });
      return null;
    }
  }, [refresh, role, toast]);

  const showCollection = useCallback(async (name, label) => {
    try {
      const result = await fetchCollection(name);
      toast({
        title: label,
        description: `${result.items.length} records loaded from the database.`,
        status: 'info',
        duration: 3200,
      });
      return result;
    } catch (error) {
      toast({ title: `Could not load ${label}`, description: error.message, status: 'error', duration: 3600 });
      return null;
    }
  }, [toast]);

  const exportReport = useCallback(async () => {
    try {
      await downloadDashboardReport(role);
      toast({ title: 'Report exported', description: 'A JSON report was generated from the database.', status: 'success', duration: 3000 });
    } catch (error) {
      toast({ title: 'Export failed', description: error.message, status: 'error', duration: 3600 });
    }
  }, [role, toast]);

  return { runAction, showCollection, exportReport };
}
