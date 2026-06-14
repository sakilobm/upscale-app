export const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'] as const;

export function applyNumpad(current: string, key: string): string {
  if (key === '⌫') return current.length > 1 ? current.slice(0, -1) : '0';
  if (key === '.') return current.includes('.') ? current : current + '.';
  if (current === '0') return key;
  if (current.includes('.') && current.split('.')[1].length >= 2) return current;
  return current + key;
}
