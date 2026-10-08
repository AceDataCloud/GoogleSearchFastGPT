export type SearchType = 'search' | 'images' | 'news' | 'maps' | 'places' | 'videos';

export type SearchInput = {
  query: string;
  searchType: SearchType;
  number: number;
  page: number;
  country?: string | undefined;
  language?: string | undefined;
  timeRange?: string | undefined;
  imageSize?: string | undefined;
};

export type SearchItem = {
  title: string;
  url: string;
  snippet: string;
  imageUrl: string;
  source: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type SearchResult = {
  query: string;
  searchType: SearchType;
  items: SearchItem[];
  returnedCount: number;
  costCredits: number | null;
  traceId: string;
};

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const responseKey: Record<SearchType, string> = {
  search: 'organic',
  images: 'images',
  news: 'news',
  maps: 'places',
  places: 'places',
  videos: 'videos'
};

export function normalizeSearch(body: unknown, input: SearchInput, traceId = ''): SearchResult {
  const data = obj(body);
  if (!data) throw new Error('Ace Data Cloud returned an invalid search response.');
  if (data.error || data.success === false) throw new Error('Search failed. Check the request trace in Ace Data Cloud.');
  const raw = data[responseKey[input.searchType]];
  if (!Array.isArray(raw)) throw new Error('Search returned an unexpected result shape.');
  const items = raw.slice(0, input.number).map((value): SearchItem => {
    const item = obj(value) ?? {};
    return {
      title: str(item.title) || str(item.name),
      url: str(item.link) || str(item.website) || str(item.google_url),
      snippet: str(item.snippet) || str(item.description),
      imageUrl: str(item.image_url),
      source: str(item.source),
      address: str(item.address),
      latitude: num(item.latitude),
      longitude: num(item.longitude)
    };
  });
  const cost = obj(data.cost);
  return {
    query: input.query,
    searchType: input.searchType,
    items,
    returnedCount: raw.length,
    costCredits: num(cost?.amount),
    traceId: str(data.trace_id) || traceId
  };
}

export async function googleSearch(input: SearchInput, apiKey: string): Promise<SearchResult> {
  const key = apiKey.trim();
  if (!key || /^Bearer\s/i.test(key)) {
    throw new Error('Enter the Ace Data Cloud API key without the Bearer prefix.');
  }
  if (input.timeRange && !['search', 'news'].includes(input.searchType)) {
    throw new Error('Time range applies only to web search and news.');
  }
  if (input.imageSize && input.searchType !== 'images') {
    throw new Error('Image size applies only to image search.');
  }
  const body: Record<string, unknown> = {
    query: input.query,
    type: input.searchType,
    number: input.number,
    page: input.page
  };
  if (input.country) body.country = input.country;
  if (input.language) body.language = input.language;
  if (input.timeRange) body.range = input.timeRange;
  if (input.imageSize) body.image_size = input.imageSize;
  let response: Response;
  try {
    response = await fetch('https://api.acedata.cloud/serp/google', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'error',
      signal: AbortSignal.timeout(35000)
    });
  } catch {
    throw new Error('Connection failed. Check the original request history before retrying.');
  }
  if (!response.ok) {
    throw new Error('Ace Data Cloud HTTP ' + response.status + '. Check key, Google Search access, balance, and request history.');
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('Ace Data Cloud returned invalid JSON.');
  }
  return normalizeSearch(data, input, response.headers.get('x-trace-id') ?? '');
}
