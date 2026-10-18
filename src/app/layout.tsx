import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: '扫雷 · Minesweeper', description: '经典扫雷，随时来一局。支持首击保护、插旗和快速开。' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
