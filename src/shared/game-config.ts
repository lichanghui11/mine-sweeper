export const DEFAULT_CONFIG = { version: 1, rows: 12, cols: 12, mines: 26, questionMarksEnabled: true } as const;
export type GameConfig = { version: number; rows: number; cols: number; mines: number; questionMarksEnabled: boolean };
export function isGameConfig(value: unknown): value is GameConfig {
  if (!value || typeof value !== 'object') return false;
  const c = value as GameConfig;
  return Number.isInteger(c.version) && Number.isInteger(c.rows) && Number.isInteger(c.cols)
    && c.rows >= 3 && c.rows <= 30 && c.cols >= 3 && c.cols <= 30
    && Number.isInteger(c.mines) && c.mines >= 1 && c.mines <= c.rows * c.cols - 9
    && typeof c.questionMarksEnabled === 'boolean';
}
