import { fetchText } from '../utils'
import { Provider, SearchParams } from './Provider'

const BASE_URL = 'https://www.lyricsify.com/'

export class LyricSify implements Provider {
    private async getLink(artist: string, name: string) {
        const query = artist + ' ' + name;
        const data = await fetchText(BASE_URL + 'search?q=' + query);
        const result = data.toString();
        const list = result.split('<div class="li">');
        const parsed = list.slice(1, list.length);
        var links;
        parsed.forEach((items) => {
            const title = items.match('>(.*?)<')
            const link = items.match('href=\"([^"]*)\"')
            if (title?.length && link?.length) {
                if (title[1].toLowerCase().includes(artist) && title[1].toLowerCase().includes(name)) {
                    links = link[1];
                }
            }
        });

        return links;
    }

    private removeTags = (str: string) => {
        if ((str === null) || (str === ''))
            return false;
        else
            str = str.toString().replace(/(<([^>]+)>)/ig, '')
                .replace(/&lt;/g, "<")
                .replace(/&gt/g, ">")
                .replace(/&quot;/g, "\"")
                .replace(/^\s*\n\n/gm, '')
                .replace(/&#039;/g, "'")
                .replace(/&amp;/g, "&");
        const listStr = str.split("\n");
        var array: Array<string>;
        array = [];
        listStr.forEach((items) => {
            if (items.substring(0, 9).includes('.')) {
                array.push(items);
            }
        })

        return array.join("\n")
    }

    private async getLrc(link: string) {
        const data = await fetchText(BASE_URL + link);
        const result = data.toString();
        const lrc = result.match(/<div id="entry"[^>]*>(.+?)<\/div>/is)
        if (lrc?.length) {
            const parse = this.removeTags(lrc[1]).toString();
            return parse;
        }
    }

    async getBestMatched({ rawName, rawArtist }: SearchParams) {
        const name = rawName.toLowerCase()
        const artist = rawArtist.toLowerCase()
        const link = await this.getLink(artist, name);
        if (link) {
            const lrc = await this.getLrc(link);
            return lrc;
        }

        return '';
    }
}