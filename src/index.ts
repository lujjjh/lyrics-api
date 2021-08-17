import { NetEase, Provider, QQMusic, SearchParams } from './providers'
import { createURLWithQuery, normalizeLRC } from './utils'

const cache = caches.default

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

const notFound = () =>
  new Response('Not found', {
    status: 404,
    headers: {
      'content-type': 'text/plain',
      'cache-control': 'no-cache',
    },
  })

const handleRequest = async (event: FetchEvent) => {
  const { request } = event

  const { method } = request
  const { pathname, searchParams } = new URL(request.url)
  if (!(method === 'GET' && pathname === '/')) return notFound()
  const name = searchParams.get('name')?.trim()
  const artist = searchParams.get('artist')?.trim()
  if (!name || !artist) return notFound()

  // Match the cache.
  let response = await cache.match(request)
  let hit = !!response

  // Search the lyrics and update the cache.
  if (!response) {
    response = await searchLyrics({ name, artist })
    event.waitUntil(cache.put(request, response.clone()))
  }

  // Logging.
  {
    const status = response.status
    const ip = request.headers.get('cf-connecting-ip')
    event.waitUntil(
      log({
        status,
        ip,
        name,
        artist,
        hit,
      })
    )
  }

  return response
}

const searchLyrics = async (params: SearchParams) => {
  // Remove the parenthetical contents.
  const name = params.name?.replace(/\([^)]+\)/g, '')?.trim()
  // The algorithm to find a best matched lyrics is:
  //   1. Search for the artist (and get the unique id)
  //   2. Search for the songs and filter out the songs belonging to the artist
  // So, let's preserve only the first artist to let the algorithm work.
  const artist = params.artist?.replace(/[,&].*/, '')?.trim()
  if (!name || !artist) return notFound()

  // Order by (the quality of the LRCs).
  const providers: Provider[] = [new QQMusic(), new NetEase()]

  // But still request in parallel...
  const promises = providers.map((provider) => provider.getBestMatched({ name, artist }).catch(() => {}))

  for await (const lyrics of promises) {
    if (lyrics) {
      const response = new Response(normalizeLRC(lyrics), {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'max-age=2592000, s-maxage=31536000, stale-while-revalidate=2592000',
        },
      })
      return response
    }
  }

  return notFound()
}

const log = (payload: any) => {
  const source = LOGFLARE_SOURCE
  return fetch(createURLWithQuery('https://api.logflare.app/logs/json', { source }), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': LOGFLARE_API_KEY,
    },
    body: JSON.stringify([payload]),
  })
}
