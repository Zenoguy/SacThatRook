import { useQuery } from '@tanstack/react-query';
import { fetchPlayerStats } from '@/services/chesscom';

export function usePlayerStats(username: string, cacheBust = 0) {
  return useQuery({
    queryKey: ['playerStats', username, cacheBust],
    queryFn: () => fetchPlayerStats(username, cacheBust > 0),
    enabled: !!username,
    staleTime: cacheBust > 0 ? 0 : 1000 * 60 * 10, // 10 mins stats cache
  });
}
