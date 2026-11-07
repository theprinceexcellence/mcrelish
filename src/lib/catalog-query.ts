import { queryOptions } from '@tanstack/react-query';
import { getCatalog } from './catalog.functions';

export const catalogQuery = queryOptions({ queryKey: ['menu-catalog'], queryFn: () => getCatalog(), staleTime: 30_000, refetchInterval: 60_000 });