export const createURLWithQuery = (url: string | URL, query: Record<string, string>): string => {
  url = new URL(String(url))
  for (const [name, value] of Object.entries(query)) url.searchParams.append(name, value)
  return String(url)
}

const assertResponseOk = (response: Response): Response => {
  if (!response.ok) throw new Error(`unexpected status code: ${response.status}`)
  return response
}

export function withTimeout<F extends (...args: any[]) => any>(this: any, f: F, timeout: number) {
  const that = this
  return function (...args: Parameters<F>) {
    return Promise.race([
      f.call(that, ...args) as ReturnType<F>,
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error('timed out'))
        }, timeout)
      }),
    ])
  }
}

export const fetchJSON = async <T>(input: string, init?: RequestInit): Promise<T> =>
  assertResponseOk(await withTimeout(fetch, 5000)(input, init)).json()
