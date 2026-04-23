import { describe, expect, it, vi } from 'vitest';
import hasPermission from './hasPermission';

describe('test policy "hasPermission"', () => {
  it('should return `false` when the route uid is missing.', () => {
    // Given
    const can = vi.fn(() => true);
    const ctx = {
      params: {},
      state: { userAbility: { can } },
    };

    // When
    const result = hasPermission(ctx, {
      actions: ['plugin::content-manager.explorer.read'],
    });

    // Then
    expect(result).toBe(false);
  });

  it('should return `false` when the authenticated admin ability is missing.', () => {
    // Given
    const ctx = {
      params: { uid: 'api::article.article' },
      state: {},
    };

    // When
    const result = hasPermission(ctx, {
      actions: ['plugin::content-manager.explorer.read'],
    });

    // Then
    expect(result).toBe(false);
  });

  it('should invoke `can` method for each action.', () => {
    // Given
    const uid = 'api::article.article';
    const can = vi.fn(() => true);
    const ctx = {
      params: { uid },
      state: { userAbility: { can } },
    };

    const config = {
      actions: ['plugin::content-manager.explorer.read', 'plugin::content-manager.explorer.update'],
    };

    // When
    hasPermission(ctx, config);

    // Then
    expect(can).toHaveBeenCalledTimes(2);
    expect(can).toHaveBeenNthCalledWith(1, config.actions[0], uid);
    expect(can).toHaveBeenNthCalledWith(2, config.actions[1], uid);
  });

  it('should return `false` when the user is missing one of the required permissions.', () => {
    // Given
    const uid = 'api::article.article';
    const can = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);
    const ctx = {
      params: { uid },
      state: { userAbility: { can } },
    };

    const config = {
      actions: ['plugin::content-manager.explorer.read', 'plugin::content-manager.explorer.update'],
    };

    // When
    const result = hasPermission(ctx, config);

    // Then
    expect(result).toBe(false);
  });

  it('should return `true` when actions are not defined.', () => {
    // Given
    const uid = 'api::article.article';
    const can = vi.fn(() => true);
    const ctx = {
      params: { uid },
      state: { userAbility: { can } },
    };

    const config = {
      // actions: ['plugin::content-manager.explorer.read', 'plugin::content-manager.explorer.update'],
    };

    // When
    const result = hasPermission(ctx, config);

    // Then
    expect(result).toBe(true);
  });

  it('should return `true` when the user has all required permissions for the requested uid.', () => {
    // Given
    const uid = 'api::article.article';
    const can = vi.fn(() => true);
    const ctx = {
      params: { uid },
      state: { userAbility: { can } },
    };

    const config = {
      actions: ['plugin::content-manager.explorer.read', 'plugin::content-manager.explorer.update'],
    };

    // When
    const result = hasPermission(ctx, config);

    // Then
    expect(result).toBe(true);
  });
});
