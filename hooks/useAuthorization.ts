import { useEffect, useState } from 'react';
import { getCurrentUserRole } from '../lib/supabaseClient';

export default function useAuthorization(requiredRole: string) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const role = await getCurrentUserRole();
      setAuthorized(role === requiredRole);
      setLoading(false);
    }
    checkAccess();
  }, [requiredRole]);

  return { authorized, loading };
}