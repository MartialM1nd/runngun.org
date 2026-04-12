import { useAdminList } from '@/hooks/useAdminList';

export function AdminListLoader() {
  useAdminList();
  return null;
}
