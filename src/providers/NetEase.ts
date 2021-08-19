import { createURLWithQuery, fetchJSON } from '../utils'
import { Provider, SearchParams } from './Provider'

const BASE_URL = 'https://music.163.com/api/'

interface ArtistInfo {
  id: number
  name: string
}

export class NetEase implements Provider {
  private async getArtistInfo(artist: string): Promise<ArtistInfo | undefined> {
    const {
      result: { artists },
    } = await fetchJSON(
      createURLWithQuery(new URL('search/pc', BASE_URL), {
        s: artist,
        limit: '1',
        type: '100',
      })
    )
    const matchedArtist = artists?.[0]
    if (!matchedArtist) return
    return {
      id: matchedArtist.id,
      name: matchedArtist.name,
    }
  }

  async getBestMatched({ name, artist }: SearchParams) {
    const artistInfo = await this.getArtistInfo(artist)
    if (!artistInfo) return

    const {
      result: { songs },
    } = await fetchJSON(
      createURLWithQuery(new URL('search/pc', BASE_URL), {
        s: [name, artistInfo.name].join(' '),
        limit: '50',
        type: '1',
      })
    )
    const matchedSongs = songs.filter(({ artists }: any) => artists?.[0]?.id === artistInfo.id)
    const matchedSong = matchedSongs.find((song: any) => String(song.name).includes(name)) ?? matchedSongs[0]
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
