import { Provider } from '.'
import { createURLWithQuery, fetchJSON } from '../utils'
import { SearchParams } from './Provider'

const BASE_URL = 'https://c.y.qq.com/'

interface ArtistInfo {
  mid: string
  name: string
}

export class QQMusic implements Provider {
  async getArtistInfo(artist: string): Promise<ArtistInfo | undefined> {
    const {
      data: { singer },
    } = await fetchJSON(createURLWithQuery(new URL('splcloud/fcgi-bin/smartbox_new.fcg', BASE_URL), { key: artist }))
    const matchedArtist = singer?.itemlist?.[0]
    if (!matchedArtist) return
    return {
      mid: matchedArtist.mid,
      name: matchedArtist.name,
    }
  }

  async getBestMatched({ name, artist }: SearchParams) {
    const artistInfo = await this.getArtistInfo(artist)
    if (!artistInfo) return

    const {
      data: {
        song: { list: songs },
      },
    } = await fetchJSON(
      createURLWithQuery(new URL('soso/fcgi-bin/client_search_cp', BASE_URL), {
        format: 'json',
        w: [name, artistInfo.name].join(' '),
        n: '10',
      })
    )
    if (!songs) return

    const matchedSong = songs
      .filter(({ singer }: any) => singer?.[0]?.mid === artistInfo.mid)
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
