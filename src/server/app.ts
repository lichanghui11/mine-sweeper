import { Hono } from 'hono';
import { DEFAULT_CONFIG } from '../shared/game-config';

export const api = new Hono().basePath('/api');
api.get('/health', c => c.json({ status: 'ok' }));
api.get('/config', c => c.json(DEFAULT_CONFIG));
api.notFound(c => c.json({ error: '接口不存在' }, 404));
api.onError((error, c) => { console.error(error); return c.json({ error: '服务暂时不可用' }, 500); });
