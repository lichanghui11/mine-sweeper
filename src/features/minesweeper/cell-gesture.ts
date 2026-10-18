export const LONG_PRESS_MS = 450;
export const MOVE_CANCEL_PX = 24;

export type CellGesture = {
  index: number;
  x: number;
  y: number;
  pointerType: string;
  longPress: boolean;
  fired: boolean;
  cancelled: boolean;
  consumed: boolean;
};

export type GestureAction = 'none' | 'reveal' | 'mark' | 'cancel';

export function createCellGesture(input: { index: number; x: number; y: number; pointerType: string }): CellGesture {
  return { ...input, longPress: input.pointerType !== 'mouse', fired: false, cancelled: false, consumed: false };
}

export function notePointerMove(gesture: CellGesture, x: number, y: number): GestureAction {
  if (gesture.cancelled || gesture.fired || gesture.consumed) return 'none';
  if (Math.hypot(x - gesture.x, y - gesture.y) <= MOVE_CANCEL_PX) return 'none';
  gesture.cancelled = true;
  return 'cancel';
}

export function notePointerLeave(_gesture: CellGesture): GestureAction {
  return 'none';
}

export function notePointerCancel(gesture: CellGesture): GestureAction {
  gesture.cancelled = true;
  return 'cancel';
}

export function noteLongPress(gesture: CellGesture): GestureAction {
  if (gesture.cancelled || gesture.fired || gesture.consumed) return 'none';
  gesture.fired = true;
  return 'mark';
}

export function completePointerUp(gesture: CellGesture): GestureAction {
  if (gesture.cancelled || gesture.fired || gesture.consumed) return 'none';
  if (!gesture.longPress) return 'none';
  gesture.consumed = true;
  return 'reveal';
}

export function completeClick(gesture: CellGesture | null, detail: number, index?: number): GestureAction {
  if (gesture) {
    if (index !== undefined && gesture.index !== index) return 'none';
    if (gesture.cancelled || gesture.fired || gesture.consumed) return 'none';
    gesture.consumed = true;
    return 'reveal';
  }
  return detail === 0 ? 'reveal' : 'none';
}
