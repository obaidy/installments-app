import { useEffect, useState } from 'react';
import { getCurrentUserRole, getUserComplexRole } from '../lib/supabaseClient';

export default function useComplexAuthorization(
  complexId: number | null,
  requiredRole: string,
) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const globalRole = await getCurrentUserRole();
      if (globalRole === 'admin') {
        setAuthorized(true);
      } else if (complexId != null) {
        const role = await getUserComplexRole(complexId);
        setAuthorized(role === requiredRole);
      } else {
        setAuthorized(false);
      }
      setLoading(false);
    }
    check();
  }, [complexId, requiredRole]);

  return { authorized, loading };
}