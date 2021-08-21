export const getUserId = async (request: Request) => {
  const ip = request.headers.get('cf-connecting-ip') ?? ''
  // To avoid logging the original IP, use SHA-1(ip) as user id.
  const userId = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(ip))))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 5)
  return userId
}
