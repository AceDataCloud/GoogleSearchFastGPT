import { afterEach, expect, test, vi } from 'vitest';
import { googleSearch, normalizeSearch, type SearchInput } from './client.js';

const input: SearchInput = { query: 'FastGPT', searchType: 'search', number: 3, page: 1 };
afterEach(() => vi.unstubAllGlobals());

test('web search maps real organic fields and Credits', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    organic: [{ title: 'FastGPT Docs', link: 'https://fastgpt.io/docs', snippet: 'Plugin guide' }],
    cost: { amount: 0.009, currency: 'credit' }
  }), { status: 200, headers: { 'x-trace-id': 'trace-1' } }));
  vi.stubGlobal('fetch', fetch);
  const result = await googleSearch(input, 'test-key');
  expect(result.items[0]).toMatchObject({ title: 'FastGPT Docs', url: 'https://fastgpt.io/docs' });
  expect(result.costCredits).toBe(0.009);
  expect(result.traceId).toBe('trace-1');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ query: 'FastGPT', type: 'search', number: 3, page: 1 });
});

test('image and place responses keep usable result fields', () => {
  const image = normalizeSearch({ images: [{ title: 'Photo', image_url: 'https://example.com/full.jpg', thumbnail_url: 'https://example.com/thumb.jpg' }] }, { ...input, searchType: 'images' });
  expect(image.items[0]?.imageUrl).toBe('https://example.com/full.jpg');
  const place = normalizeSearch({ places: [{ title: 'Cafe', address: 'Seattle', latitude: 47.6, longitude: -122.3, website: 'https://cafe.example' }] }, { ...input, searchType: 'places' });
  expect(place.items[0]).toMatchObject({ title: 'Cafe', address: 'Seattle', latitude: 47.6, url: 'https://cafe.example' });
});

test('limits displayed items even when Google returns more than requested', () => {
  const result = normalizeSearch({ news: Array.from({ length: 9 }, (_, i) => ({ title: String(i) })) }, { ...input, searchType: 'news' });
  expect(result.returnedCount).toBe(9);
  expect(result.items).toHaveLength(3);
});

test('accepts a genuine empty result list', () => {
  const result = normalizeSearch({ organic: [], cost: { amount: 0.009 } }, input);
  expect(result.items).toEqual([]);
  expect(result.returnedCount).toBe(0);
});

test('rejects filters on incompatible search types before sending', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  await expect(googleSearch({ ...input, searchType: 'places', timeRange: 'd' }, 'key')).rejects.toThrow('Time range');
  await expect(googleSearch({ ...input, imageSize: 'large' }, 'key')).rejects.toThrow('Image size');
  expect(fetch).not.toHaveBeenCalled();
});

test('HTTP errors never reflect provider body or API key', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
    JSON.stringify({ error: { message: 'private secret' } }), { status: 403 }
  )));
  await expect(googleSearch(input, 'test-private-key')).rejects.toThrow('HTTP 403');
});
