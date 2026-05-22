import { useQuery } from '@tanstack/react-query';
import { fetchPlayerProfile } from '@/services/chesscom';

export function usePlayerProfile(username: string, cacheBust = 0) {
  return useQuery({
    queryKey: ['playerProfile', username, cacheBust],
    queryFn: () => fetchPlayerProfile(username, cacheBust > 0),
    enabled: !!username,
    staleTime: cacheBust > 0 ? 0 : 1000 * 60 * 15, // 15 mins profile cache
  });
}
