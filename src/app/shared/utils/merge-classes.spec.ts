import { mergeClasses, noopFn } from './merge-classes';

describe('mergeClasses', () => {
  it('should merge single class', () => {
    expect(mergeClasses('foo')).toBe('foo');
  });

  it('should merge multiple classes', () => {
    expect(mergeClasses('foo', 'bar')).toContain('foo');
    expect(mergeClasses('foo', 'bar')).toContain('bar');
  });

  it('should handle conditional classes', () => {
    const active = true;
    expect(mergeClasses('base', active && 'active')).toContain('active');
  });

  it('noopFn should not throw', () => {
    expect(noopFn()).toBeUndefined();
  });
});
