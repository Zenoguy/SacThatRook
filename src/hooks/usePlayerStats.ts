import { useQuery } from '@tanstack/react-query';
import { fetchPlayerStats } from '@/services/chesscom';

export function usePlayerStats(username: string) {
  return useQuery({
    queryKey: ['playerStats', username],
    queryFn: () => fetchPlayerStats(username),
    enabled: !!username,
    staleTime: 1000 * 60 * 10, // 10 mins stats cache
  });
}
