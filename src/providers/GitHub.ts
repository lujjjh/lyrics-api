import { fetchText } from '../utils'
import { Provider, SearchParams } from './Provider'

const BASE_URL = 'https://raw.githubusercontent.com/lujjjh/lyrics/main/lyrics/'

export class GitHub implements Provider {
  async getBestMatched({ rawName, rawArtist }: SearchParams) {
    const name = rawName.toLowerCase()
    const artist = rawArtist.toLowerCase()
    const artistFirstCharacter = String.fromCodePoint(artist.codePointAt(0)!)
    return fetchText(
      new URL(`${encodeURI(artistFirstCharacter)}/${encodeURI(artist)}/${encodeURI(name)}.lrc`, BASE_URL).toString()
    )
  }
}
