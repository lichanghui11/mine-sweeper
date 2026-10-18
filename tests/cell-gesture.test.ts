import { describe, expect, it } from 'vitest';
import {
  completeClick,
  completePointerUp,
  createCellGesture,
  LONG_PRESS_MS,
  MOVE_CANCEL_PX,
  noteLongPress,
  notePointerCancel,
  notePointerLeave,
  notePointerMove,
} from '../src/features/minesweeper/cell-gesture';

describe('触屏格子手势', () => {
  it('轻点在 pointerup 立刻翻格，后续 click 不再翻一次', () => {
    const gesture = createCellGesture({ index: 4, x: 10, y: 10, pointerType: 'touch' });
    expect(gesture.longPress).toBe(true);
    expect(LONG_PRESS_MS).toBe(450);
    expect(completePointerUp(gesture)).toBe('reveal');
    expect(completeClick(gesture, 0, 4)).toBe('none');
    expect(completeClick(gesture, 1, 4)).toBe('none');
  });
  it('手指轻微抖动或滑出格子边缘仍算单击', () => {
    const gesture = createCellGesture({ index: 0, x: 20, y: 20, pointerType: 'touch' });
    expect(MOVE_CANCEL_PX).toBeGreaterThan(10);
    expect(notePointerMove(gesture, 20 + 12, 20 + 4)).toBe('none');
    expect(notePointerLeave(gesture)).toBe('none');
    expect(completePointerUp(gesture)).toBe('reveal');
  });

  it('明显滑动才取消，松手和 click 都不再翻格', () => {
    const gesture = createCellGesture({ index: 0, x: 0, y: 0, pointerType: 'touch' });
    expect(notePointerMove(gesture, 30, 0)).toBe('cancel');
    expect(completePointerUp(gesture)).toBe('none');
    expect(completeClick(gesture, 1)).toBe('none');
  });

  it('长按已标记后松手不再翻格', () => {
    const gesture = createCellGesture({ index: 2, x: 0, y: 0, pointerType: 'touch' });
    expect(noteLongPress(gesture)).toBe('mark');
    expect(completePointerUp(gesture)).toBe('none');
    expect(completeClick(gesture, 1)).toBe('none');
  });

  it('浏览器取消手势时不翻格', () => {
    const gesture = createCellGesture({ index: 1, x: 0, y: 0, pointerType: 'touch' });
    expect(notePointerCancel(gesture)).toBe('cancel');
    expect(completePointerUp(gesture)).toBe('none');
  });

  it('鼠标在 click 时翻格，pointerup 不提前翻', () => {
    const gesture = createCellGesture({ index: 8, x: 0, y: 0, pointerType: 'mouse' });
    expect(gesture.longPress).toBe(false);
    expect(completePointerUp(gesture)).toBe('none');
    expect(completeClick(gesture, 1)).toBe('reveal');
  });

  it('键盘激活没有手势时仍翻格', () => {
    expect(completeClick(null, 0)).toBe('reveal');
  });

  it('延迟 click 打到别的格子时，不吞掉当前手势', () => {
    const current = createCellGesture({ index: 7, x: 0, y: 0, pointerType: 'touch' });
    expect(completeClick(current, 1, 3)).toBe('none');
    expect(completePointerUp(current)).toBe('reveal');
  });
});
