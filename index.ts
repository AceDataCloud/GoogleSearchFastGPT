import {
  createToolHandler,
  defineTool,
  type InputSchemaMetaType,
  type OutputSchemaMetaType,
  type SecretSchemaMetaType
} from '@fastgpt-plugin/sdk-factory';
import z from 'zod';

import { googleSearch } from './src/client.ts';

const secretSchema = z.object({
  apiKey: z.string().min(1).meta({
    title: 'Ace Data Cloud API key',
    description: 'Create an application API key at platform.acedata.cloud. Do not include Bearer.',
    isSecret: true
  } satisfies SecretSchemaMetaType)
});

const searchType = z.enum(['search', 'images', 'news', 'maps', 'places', 'videos']);
const imageSize = z.enum([
  'large', 'medium', 'icon', '2mp', '4mp', '6mp', '8mp', '10mp',
  '12mp', '15mp', '20mp', '40mp', '70mp'
]);

const handler = createToolHandler({
  inputSchema: z.object({
    query: z.string().trim().min(1).max(2048).meta({
      title: 'Query',
      description: 'Google search query.',
      isToolParam: true
    } satisfies InputSchemaMetaType),
    searchType: searchType.default('search').meta({
      title: 'Search type',
      description: 'Web, image, news, maps, places, or video results.'
    } satisfies InputSchemaMetaType),
    number: z.number().int().min(1).max(100).default(3).meta({
      title: 'Results to show',
      description: 'The API may return more; the tool shows at most this many.'
    } satisfies InputSchemaMetaType),
    page: z.number().int().min(1).max(100).default(1).meta({
      title: 'Page'
    } satisfies InputSchemaMetaType),
    country: z.string().trim().min(1).max(32).optional().meta({
      title: 'Country code',
      description: 'Optional country, for example us or cn.'
    } satisfies InputSchemaMetaType),
    language: z.string().trim().min(1).max(32).optional().meta({
      title: 'Language code',
      description: 'Optional language, for example en or zh.'
    } satisfies InputSchemaMetaType),
    timeRange: z.enum(['h', 'd', 'w', 'm', 'y', 'qdr:h', 'qdr:d', 'qdr:w', 'qdr:m', 'qdr:y']).optional().meta({
      title: 'Time range',
      description: 'Only for web search and news.'
    } satisfies InputSchemaMetaType),
    imageSize: imageSize.optional().meta({
      title: 'Image size',
      description: 'Only for image search. Use large or a megapixel minimum for full-size images.'
    } satisfies InputSchemaMetaType)
  }),
  outputSchema: z.object({
    query: z.string().meta({ title: 'Query' } satisfies OutputSchemaMetaType),
    searchType: searchType.meta({ title: 'Search type' } satisfies OutputSchemaMetaType),
    items: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
      imageUrl: z.string(),
      source: z.string(),
      address: z.string(),
      latitude: z.number().nullable(),
      longitude: z.number().nullable()
    })).meta({ title: 'Results' } satisfies OutputSchemaMetaType),
    returnedCount: z.number().int().meta({ title: 'API result count' } satisfies OutputSchemaMetaType),
    costCredits: z.number().nullable().meta({ title: 'Reported Credits' } satisfies OutputSchemaMetaType),
    traceId: z.string().meta({ title: 'Trace ID' } satisfies OutputSchemaMetaType)
  }),
  secretSchema,
  handler: async (input, ctx) => googleSearch(input, ctx.secrets?.apiKey ?? '')
});

export default defineTool({
  manifest: {
    pluginId: 'acedataGoogleSearch',
    version: '0.1.0',
    name: { en: 'Ace Data Cloud Google Search', 'zh-CN': 'Ace Data Cloud 谷歌搜索' },
    description: {
      en: 'Search Google web, images, news, maps, places, and videos through Ace Data Cloud.',
      'zh-CN': '通过 Ace Data Cloud 搜索谷歌网页、图片、新闻、地图、地点和视频。'
    },
    versionDescription: { en: 'Initial release', 'zh-CN': '首次发布' },
    author: 'Ace Data Cloud',
    repoUrl: 'https://github.com/AceDataCloud/GoogleSearchFastGPT',
    tutorialUrl: 'https://github.com/AceDataCloud/GoogleSearchFastGPT#quick-start',
    tags: ['search'],
    permission: []
  },
  handler
});
