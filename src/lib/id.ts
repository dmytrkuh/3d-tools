let sequence = 0;

export function createId(prefix = 'obj') {
  sequence += 1;
  return `${prefix}-${sequence.toString(36)}-${Date.now().toString(36)}`;
}
