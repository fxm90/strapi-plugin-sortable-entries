import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveEffectiveLocale } from './resolveEffectiveLocale';

//
// Types
//

import type { Core, Schema } from '@strapi/strapi';
import type { Locale } from '../types';
import type { ModelI18nOptions } from './resolveEffectiveLocale';

//
// Mock "Strapi"
//

let stubbedDefaultLocale: Locale | undefined;
const mockGetDefaultLocale = vi.fn(() => stubbedDefaultLocale);

const mockPluginService = vi.fn(() => ({
  getDefaultLocale: mockGetDefaultLocale,
}));

const mockPlugin = vi.fn(() => ({
  service: mockPluginService,
}));

const mockStrapi = {
  plugin: mockPlugin,
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
} as unknown as Core.Strapi;

//
// Tests
//

describe(`test method "resolveEffectiveLocale()"`, () => {
  beforeEach(() => {
    stubbedDefaultLocale = 'de';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return undefined when localization is disabled.', async () => {
    // Given
    const model = createModelWithLocalization(false);
    const locale: Locale = 'en';

    // When
    const result = await resolveEffectiveLocale({
      strapi: mockStrapi,
      model,
      locale,
    });

    // Then
    expect(result).toBeUndefined();
  });

  it('should return the provided locale when localization is enabled.', async () => {
    // Given
    const model = createModelWithLocalization(true);
    const locale: Locale = 'en';

    // When
    const result = await resolveEffectiveLocale({
      strapi: mockStrapi,
      model,
      locale,
    });

    // Then
    expect(result).toBe(locale);
  });

  it("should invoke `strapi.plugin(i18n).service('locales').getDefaultLocale()` when localization is enabled and no locale is provided.", async () => {
    // Given
    const model = createModelWithLocalization(true);
    const locale: Locale | undefined = undefined;

    // When
    await resolveEffectiveLocale({
      strapi: mockStrapi,
      model,
      locale,
    });

    // Then
    expect(mockPlugin).toHaveBeenCalledWith('i18n');
    expect(mockPluginService).toHaveBeenCalledWith('locales');
  });

  it("should throw an error when `strapi.plugin(i18n).service('locales').getDefaultLocale()` returns undefined and localization is enabled and no locale is provided.", async () => {
    // Given
    stubbedDefaultLocale = undefined;

    const model = createModelWithLocalization(true);
    const locale: Locale | undefined = undefined;

    // When
    await expect(() =>
      resolveEffectiveLocale({
        strapi: mockStrapi,
        model,
        locale,
      })
    )
      // Then
      .rejects.toThrow();
  });

  it("should return the locale from `strapi.plugin(i18n).service('locales').getDefaultLocale()` when localization is enabled and no locale is provided.", async () => {
    // Given
    const model = createModelWithLocalization(true);
    const locale: Locale | undefined = undefined;

    // When
    const result = await resolveEffectiveLocale({
      strapi: mockStrapi,
      model,
      locale,
    });

    // Then
    expect(result).toBe(stubbedDefaultLocale);
  });
});

//
// Helper
//

/** Creates a model with localization enabled or disabled. */
const createModelWithLocalization = (
  localized: boolean
): Schema.ContentType & ModelI18nOptions => ({
  modelType: 'contentType',
  modelName: 'test',
  globalId: 'Test',
  uid: 'api::test.test',
  kind: 'collectionType',
  info: { singularName: 'test', pluralName: 'tests', displayName: 'Test' },
  options: {},
  attributes: {},
  pluginOptions: {
    i18n: {
      localized,
    },
  },
});
