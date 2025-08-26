import { useEffect, useState } from 'react';
import { getCurrentUserRole } from '../lib/supabaseClient';

export default function useAuthorization(requiredRoles: string[]) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const role = await getCurrentUserRole();
      setAuthorized(requiredRoles.includes(role) || role === 'admin');
      setLoading(false);
    }
    checkAccess();
  }}, [requiredRoles]);

  return { authorized, loading };
}