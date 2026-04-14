import { describe, it, expect } from 'vitest';
import { isValidContentTypeUID } from './isValidContentTypeUID';

//
// Tests
//

describe(`test method "isValidContentTypeUID()"`, () => {
  it('should return `false` if value is not a string.', () => {
    expect(isValidContentTypeUID(123)).toBe(false);
    expect(isValidContentTypeUID(null)).toBe(false);
    expect(isValidContentTypeUID(undefined)).toBe(false);
    expect(isValidContentTypeUID({})).toBe(false);
    expect(isValidContentTypeUID([])).toBe(false);
    expect(isValidContentTypeUID(true)).toBe(false);
  });

  it('should return `false` if value is an empty string.', () => {
    expect(isValidContentTypeUID('')).toBe(false);
  });

  it('should return `false` if value has no source prefix.', () => {
    expect(isValidContentTypeUID('article.article')).toBe(false);
  });

  it('should return `false` if value has an invalid source prefix.', () => {
    expect(isValidContentTypeUID('unknown::article.article')).toBe(false);
  });

  it('should return `false` if value has no name after the separator.', () => {
    expect(isValidContentTypeUID('api::')).toBe(false);
  });

  it('should return `false` if value contains uppercase letters.', () => {
    expect(isValidContentTypeUID('api::Article.Article')).toBe(false);
  });

  it('should return `false` if value contains spaces.', () => {
    expect(isValidContentTypeUID('api::my article.my article')).toBe(false);
  });

  it('should return `false` if name starts with a digit.', () => {
    expect(isValidContentTypeUID('api::1article.1article')).toBe(false);
  });

  it('should return `true` for a valid api content-type UID.', () => {
    expect(isValidContentTypeUID('api::article.article')).toBe(true);
  });

  it('should return `true` for a valid api content-type UID with hyphens.', () => {
    expect(isValidContentTypeUID('api::blog-post.blog-post')).toBe(true);
  });

  it('should return `true` for a valid plugin content-type UID.', () => {
    expect(isValidContentTypeUID('plugin::users-permissions.user')).toBe(true);
  });

  it('should return `true` for a valid admin content-type UID.', () => {
    expect(isValidContentTypeUID('admin::user')).toBe(true);
  });
});
