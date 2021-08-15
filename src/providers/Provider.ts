export interface SearchParams {
  name: string
  artist: string
}

export type Lyrics = string

export interface Provider {
  getBestMatched(searchParams: SearchParams): Promise<Lyrics | undefined>
}
