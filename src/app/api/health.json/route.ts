import { api } from '@/server/app';

// 静态站点的构建结果标识，不代表线上 Node.js 进程健康状态。
export const dynamic = 'force-static';
export const GET = () => api.request('/api/health');
