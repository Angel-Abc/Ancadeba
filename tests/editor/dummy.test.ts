import { describe, it, expect } from 'vitest';

describe('Editor', () => {
  it('concatenates text', () => {
    // Arrange
    const greeting = 'Hello';
    const target = 'World';

    // Act
    const result = `${greeting} ${target}`;

    // Assert
    expect(result).toBe('Hello World');
  });
});
