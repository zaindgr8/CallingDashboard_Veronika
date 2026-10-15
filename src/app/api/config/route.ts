import { json, route } from '@/lib/server/http';
import { getConcurrency, isRestricted, listAgents, listPhoneNumbers } from '@/lib/server/retell';
import { aiEnabled } from '@/lib/server/ai';
import type { DashboardConfig } from '@/lib/types';

export const GET = route(async () => {
  const [agents, phoneNumbers, concurrency] = await Promise.all([listAgents(), listPhoneNumbers(), getConcurrency()]);
  return json({ agents, phoneNumbers, concurrency, restricted: isRestricted(), aiEnabled: aiEnabled() } satisfies DashboardConfig);
});
