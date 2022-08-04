import { GitHub, NetEase, Provider, QQMusic, LyricSify, SearchParams } from './providers'
import { createURLWithQuery, getUserId, normalizeLRC } from './utils'

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
  const { pathname } = new URL(request.url)
  if (request.method !== 'GET') return notFound()

  switch (pathname) {
    case '/user':
      return handleUserRequest(event)
    case '/':
      return handleSearchLyricsRequest(event)
    default:
      return notFound()
  }
}

const handleUserRequest = async (event: FetchEvent) => {
  return new Response(JSON.stringify({ user_id: await getUserId(event.request) }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
    },
  })
}

const handleSearchLyricsRequest = async (event: FetchEvent) => {
  const { request } = event
  const { searchParams } = new URL(event.request.url)

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
    const user_id = await getUserId(request)
    // event.waitUntil(
    //   log({
    //     status,
    //     user_id,
    //     name,
    //     artist,
    //     hit,
    //   })
    // )
  }

  return response
}

const searchLyrics = async (params: Pick<SearchParams, 'name' | 'artist'>) => {
  const rawName = params.name
  const rawArtist = params.artist

  // Remove the parenthetical contents.
  const name = rawName.replace(/\([^)]+\)/g, '')?.trim()
  // The algorithm to find a best matched lyrics is:
  //   1. Search for the artist (and get the unique id)
  //   2. Search for the songs and filter out the songs belonging to the artist
  // So, let's preserve only the first artist to let the algorithm work.
  const artist = rawArtist.replace(/[,&].*/, '')?.trim()
  if (!name || !artist) return notFound()

  // Order by (the quality of the LRCs).
  const providers: Provider[] = [new LyricSify(), new GitHub(), new QQMusic(), new NetEase()]

  // But still request in parallel...
  const promises = providers.map((provider) =>
    provider.getBestMatched({ name, artist, rawName, rawArtist }).catch(() => { })
  )

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

// const log = (payload: any) => {
//   const source = LOGFLARE_SOURCE
//   return fetch(createURLWithQuery('https://api.logflare.app/logs/json', { source }), {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'X-API-KEY': LOGFLARE_API_KEY,
//     },
//     body: JSON.stringify([payload]),
//   })
// }
