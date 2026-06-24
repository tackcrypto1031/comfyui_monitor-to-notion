import { describe, expect, it } from 'vitest';
import { formatLastUpdate } from '../../src/renderer/components/MachineCard';

describe('formatLastUpdate', () => {
  it('clamps future timestamps to zero seconds', () => {
    expect(formatLastUpdate(1_005_000, 1_000_000)).toBe('0秒前');
  });

  it('formats recent and older timestamps', () => {
    expect(formatLastUpdate(995_000, 1_000_000)).toBe('5秒前');
    expect(formatLastUpdate(880_000, 1_000_000)).toBe('2分鐘前');
  });
});
