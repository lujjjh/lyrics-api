import { createURLWithQuery, fetchJSON } from '../utils'
import { Provider, SearchParams } from './Provider'

const BASE_URL = 'http://music.163.com/api/'

export class NetEase implements Provider {
  private async getArtistId(artist: string): Promise<number | undefined> {
    const {
      result: { artists },
    } = await fetchJSON(
      createURLWithQuery(new URL('search/pc', BASE_URL), {
        s: artist,
        limit: '1',
        type: '100',
      })
    )
    if (!artists || !artists.length) return
    return artists[0].id
  }

  async getBestMatched({ name, artist }: SearchParams) {
    const artistId = await this.getArtistId(artist)
    if (!artistId) return

    const {
      result: { songs },
    } = await fetchJSON(
      createURLWithQuery(new URL('search/pc', BASE_URL), {
        s: [name, artist].join(' '),
        limit: '10',
        type: '1',
      })
    )
    const matchedSong = songs.find(({ artists }: any) => artists?.[0]?.id === artistId)
    if (!matchedSong) return

    const { lrc } = await fetchJSON(
      createURLWithQuery(new URL('song/lyric', BASE_URL), {
        id: String(matchedSong.id),
        lv: '1',
      })
    )
    if (!lrc) return
    return lrc.lyric
  }
}
