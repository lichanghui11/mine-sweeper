import { api } from '@/server/app';

// 配置在构建时生成静态 JSON，GitHub Pages 无需运行后端。
export const dynamic = 'force-static';
export const GET = () => api.request('/api/config');
