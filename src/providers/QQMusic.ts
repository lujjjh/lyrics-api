import { Provider } from '.'
import { createURLWithQuery, fetchJSON } from '../utils'
import { SearchParams } from './Provider'

const BASE_URL = 'https://c.y.qq.com/'

export class QQMusic implements Provider {
  async getArtistId(artist: string): Promise<number | undefined> {
    const {
      data: { zhida },
    } = await fetchJSON(
      createURLWithQuery(new URL('soso/fcgi-bin/client_search_cp', BASE_URL), {
        format: 'json',
        w: artist,
        catZhida: '1',
      })
    )
    return zhida?.zhida_singer?.singerID
  }

  async getBestMatched({ name, artist }: SearchParams) {
    const artistId = await this.getArtistId(artist)
    if (!artistId) return

    const {
      data: {
        song: { list: songs },
      },
    } = await fetchJSON(
      createURLWithQuery(new URL('soso/fcgi-bin/client_search_cp', BASE_URL), {
        format: 'json',
        w: name,
        n: '50',
      })
    )
    if (!songs) return

    const matchedSong = songs
      .filter(({ singer }: any) => singer?.[0]?.id === artistId)
      .find(({ songname_hilight }: any) => String(songname_hilight).includes('<em>'))
    if (!matchedSong) return

    const { lyric } = await fetchJSON(
      createURLWithQuery(new URL('lyric/fcgi-bin/fcg_query_lyric_new.fcg', BASE_URL), {
        format: 'json',
        nobase64: '1',
        songmid: matchedSong.songmid,
      }),
      {
        headers: {
          referer: 'https://y.qq.com/',
        },
      }
    )
    if (!lyric) return

    return String(lyric)
  }
}
