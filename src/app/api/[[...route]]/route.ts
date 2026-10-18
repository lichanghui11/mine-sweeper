import { api } from '@/server/app';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => api.fetch(request);
