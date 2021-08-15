import { NetEase, Provider, QQMusic } from './providers'
import { normalizeLRC } from './utils'

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

  const response = await cache.match(request)
  if (response) return response

  const { method } = request
  const { pathname, searchParams } = new URL(request.url)
  if (!(method === 'GET' && pathname === '/')) return notFound()
  const name = searchParams.get('name')
  // The algorithm to find a best matched lyrics is:
  //   1. Search for the artist (and get the unique id)
  //   2. Search for the songs and filter out the songs belonging to the artist
  // So, let's preserve only the first artist to let the algorithm work.
  const artist = searchParams.get('artist')?.replace(/\S*&.*$/, '')
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
      event.waitUntil(cache.put(request, response.clone()))
      return response
    }
  }

  return notFound()
}
