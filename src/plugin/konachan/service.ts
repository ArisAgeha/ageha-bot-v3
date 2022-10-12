import { TypeEvent } from '@/bot'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import { patchData } from '@/utils/msg-helper'

const pattern = /^(kona|kn)\s+/i

export class KonachanService {
  static parseMsg(data: TypeEvent) {
    if (pattern.test(data.message || '')) {
      patchData(data, pattern)
      return KonachanService.startSearch(data)
    }
  }

  private static async startSearch(msg: TypeEvent) {
    return new Promise(async reply => {
      // get random page
      const sender = msg.user_id
      const rdPage = await axios.get('https://konachan.net/post/random')
      const matchSrc = JSON.stringify(rdPage.data)?.match(
        /https\:\/\/konachan.net\/post\/show\/\d+/
      )
      const redirectPageSrc = matchSrc ? matchSrc[0] : null
      if (!redirectPageSrc) return

      // get redirect page (image page)
      const targetPage = await axios.get(redirectPageSrc)

      const cheerio = require('cheerio')
      const $ = cheerio.load(targetPage.data)

      // load image page
      const image = $('.image')[0]
      if (!image) return
      const imageSrc = image.attribs.src

      // download and send iamge to QQ
      if (imageSrc) {
        const response = await axios({
          method: 'GET',
          url: imageSrc,
          responseType: 'stream',
        })

        const rd = String(Math.ceil(Math.random() * 10000000))
        const savePath = path.resolve(`D:\\data\\image\\${rd}`)
        const pictureCq = `[CQ:image,file=${rd}]`

        const rs = fs.createWriteStream(savePath)
        response.data.pipe(rs)

        response.data.on('end', () => {
          reply(`${pictureCq}[CQ:at,qq=${sender}]`)

          setTimeout(() => {
            fs.unlink(savePath, () => {})
          }, 10000)
        })

        response.data.on('error', (err: Error) => {
          console.log(err)
        })
      }
    })
  }
}
