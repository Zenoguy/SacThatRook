import { useQuery } from '@tanstack/react-query';
import { fetchPlayerProfile } from '@/services/chesscom';

export function usePlayerProfile(username: string) {
  return useQuery({
    queryKey: ['playerProfile', username],
    queryFn: () => fetchPlayerProfile(username),
    enabled: !!username,
    staleTime: 1000 * 60 * 15, // 15 mins profile cache
  });
}
