import { describe, it, expect } from 'vitest';

describe('Game Engine', () => {
  it('adds numbers', () => {
    // Arrange
    const first = 2;
    const second = 3;

    // Act
    const result = first + second;

    // Assert
    expect(result).toBe(5);
  });
});
