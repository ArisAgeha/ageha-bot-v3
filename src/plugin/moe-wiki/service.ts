import { TypeEvent, ws } from '@/bot'
import { formatMsg, patchData } from '@/utils/msg-helper'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

export class MoeWikiService {
  static userData = {}
  static searchData = {}
  static pictureMaps = {}

  static parseMsg(data: TypeEvent) {
    const detailPattern = /(moe|萌百)/i
    if (detailPattern.test(data.message || '')) {
      patchData(data, detailPattern)
      return MoeWikiService.startSearch(data)
    }

    const searchPattern = /(moes|萌百搜索)/i
    if (searchPattern.test(data.message || '')) {
      patchData(data, searchPattern)
      return MoeWikiService.redirectToSearchPage(data)
    }

    const numberPattern = /^\d+$/
    if (numberPattern.test(data.message || '')) {
      patchData(data, numberPattern)
      return MoeWikiService.handleNumber(data)
    }
  }

  private static async startSearch(data: TypeEvent) {
    const sender = data.user_id
    const word = data.message || ''

    const $ = await MoeWikiService.fetchHtml(word, data)
    if (!$) return MoeWikiService.redirectToSearchPage(data)

    const vNode = await MoeWikiService.buildVNode($)
    MoeWikiService.saveVNode(data, vNode)
    const pictureCq = `[CQ:image,file=${vNode.pictureFilename}]`
    const targetUrl = encodeURI(`https://zh.moegirl.org.cn/${word.trim()}`)

    const res =
      vNode.introduction +
      pictureCq +
      '\r\n' +
      vNode.catalog +
      '\r\n' +
      vNode.suffix +
      '\r\n' +
      targetUrl

    setTimeout(() => {
      fs.unlink(vNode.picturePath, () => { })
    }, 10000)

    return `[CQ:at,qq=${sender}]\r\n${res}`
  }

  private static handleNumber(msg: TypeEvent) {
    const sender = msg.user_id
    const userData = MoeWikiService.userData[sender]

    if (!userData) return
    if (userData.vNode) {
      const now = Date.now()
      if (now - userData.requestTime > 120 * 1000) return
      const index = Number(msg.message)
      if (index > userData.vNode.section.length) return
      return MoeWikiService.getSection(msg)
    } else if (userData.pageTitle) {
      const now = Date.now()
      if (now - userData.requestTime > 30 * 1000) return
      const index = Number(msg.message)
      if (index > userData.pageTitle.length) return
      msg.message = `${userData.pageTitle[index - 1]}`
      return MoeWikiService.startSearch(msg)
    }
  }

  private static async getSection(msg: TypeEvent) {
    const sd = msg.user_id
    const groupId = msg.group_id

    const { vNode } = MoeWikiService.userData[sd]

    const index = Number(msg.message)
    let section = vNode.section[index]

    const newSection = await MoeWikiService.getPictures(section)
    if (newSection) section = newSection

    for (let i = 0; i < Math.ceil(section.length / 3000); i++) {
      const startIndex = i * 3000
      const endIndex = (i + 1) * 3000
      await ws.send('send_group_msg', {
        group_id: groupId,
        message: formatMsg(`${section.slice(startIndex, endIndex)}`),
      })
      await MoeWikiService.wait(300)
    }
    return `[CQ:at,qq=${sd}]`
  }

  private static async wait(time: number) {
    return new Promise(res => {
      setTimeout(() => {
        res(undefined)
      }, time)
    })
  }

  private static async getPictures(section: string) {
    const images = section.match(/\[CQ:image,file=\d+\]/g)
    if (!images) return
    await Promise.all(
      images.map(async imageCq => {
        const rdM = imageCq.match(/\d+/)
        if (!rdM) return

        const rd = rdM[0]

        const src = MoeWikiService.pictureMaps[rd]
        if (!src) return
        const { filename, picturePath } = await MoeWikiService.downloadPicture(
          src
        )

        setTimeout(() => {
          if (fs.existsSync(picturePath)) {
            fs.unlink(picturePath, () => { })
          }
        }, 60 * 1000)

        section = section.replace(rd, filename)
      })
    )
    return section
  }

  private static async buildVNode($: any): Promise<VNode> {
    let content = $('.mw-parser-output')
    content = content[1] ? content[1] : content[0]

    const catalog: string[] = MoeWikiService.buildCatalog(content)

    const catalogString: string = MoeWikiService.buildCatalogString(catalog)

    const introduction: string = MoeWikiService.buildIntroduction($, content)

    const pictureSrc: string = MoeWikiService.getPreview($)
    const picture = await MoeWikiService.downloadPicture(pictureSrc)

    const suffix = '【2分钟内，输入词条目录的编号可获取词条内容】'
    const section = MoeWikiService.buildSection(content)

    return {
      catalog: catalogString,
      introduction,
      suffix,
      section,
      pictureFilename: picture.filename,
      picturePath: picture.picturePath,
    }
  }

  private static getPreview($: any) {
    const imgs = $('table img')
    const src = imgs[0]?.attribs?.src
    return src
  }

  static async downloadPicture(src: string) {
    const response = await axios({
      method: 'GET',
      url: src,
      responseType: 'stream',
    })

    const rd = String(Math.ceil(Math.random() * 10000000))
    const savePath = path.resolve(`e:\\data\\image\\${rd}`)

    response.data.pipe(fs.createWriteStream(savePath))
    await new Promise(res => {
      response.data.on('end', () => {
        console.log('request image end')
        res(undefined)
      })
      response.data.on('error', (err: any) => {
        console.log(err)
        res(undefined)
      })
    })

    return {
      filename: rd,
      picturePath: savePath,
    }
  }

  private static saveVNode(msg: TypeEvent, vNode: VNode) {
    const sender = msg.user_id
    MoeWikiService.userData[sender] = { requestTime: Date.now(), vNode: vNode }
  }

  private static buildSection(content: any) {
    const domArray = content.children
    const sections = []
    let counter = 0
    for (let i = 0; i < domArray.length; i++) {
      const item = domArray[i]
      if (item.name === 'h2') {
        counter++
        sections[counter] = ''
      } else if (item.counter === 0) {
        continue
      } else {
        const text = MoeWikiService.recursedTag(item, true)
        if (text) sections[counter] += text
      }
    }

    return sections
  }

  private static buildCatalog(content: any) {
    const catalog = []
    const domArray = content.children
    for (let i = 0; i < domArray.length; i++) {
      const item = domArray[i]
      if (item.name === 'h2') {
        const target = item.children[1]
          ? item.children[1].attribs.id
          : item.children[0].attribs.id
        catalog.push(target)
      }
    }
    return catalog
  }

  private static buildCatalogString(catalog: string[]) {
    let catalogInfo = '词条目录：\r\n'
    catalogInfo += catalog.reduce((prev, cur, cin) => {
      return `${prev}\r\n${cin + 1}. ${cur}`
    }, '')
    return catalogInfo
  }

  private static buildIntroduction($: any, content: any) {
    let introduction = ''
    for (let i = 0; i < content.children.length; i++) {
      const item = content.children[i]
      if (item.name === 'p') {
        if (item.children) {
          const text: string = MoeWikiService.recursedTag(item, false)
          if (text) introduction += text
        }
      }

      if (item.name === 'h2') break
    }
    return introduction
  }

  private static recursedTag(item: any, shouldGetImg: boolean): string {
    let intro = ''
    const paraArray = item.children
    if (!paraArray) return ''

    paraArray.forEach((para: any) => {
      if (['style', 'script'].includes(para.type)) return
      if (para.name === 'table') return
      if (para.name === 'img' && shouldGetImg) {
        const imgSrc = para.attribs.src
        const rd = Math.ceil(Math.random() * 100000000)
        MoeWikiService.pictureMaps[rd] = imgSrc
        intro += `[CQ:image,file=${rd}]`
      }
      if (para.data && para.data !== '\\n') {
        intro += String(para.data)
      }
      if (para.children) {
        intro += String(MoeWikiService.recursedTag(para, shouldGetImg))
      }
    })
    return intro
  }

  private static async fetchHtml(word: string, msg: TypeEvent) {
    let res
    try {
      res = await axios.get(encodeURI(`https://zh.moegirl.org/${word}`))
      console.log('fetch success')
      const html = res.data
      const cheerio = require('cheerio')
      const $ = cheerio.load(html)
      return $
    } catch (err: any) {
      if (err.response.status === 404) {
        return undefined
      }
    }
  }

  private static async redirectToSearchPage(data: TypeEvent) {
    let res
    try {
      const word = data.message
      res = await axios.get(
        encodeURI(
          `https://zh.moegirl.org/index.php?title=Special:搜索&limit=20&offset=20&profile=default&search=${word}`
        )
      )
      console.log('redirect success')
      const html = res.data
      const cheerio = require('cheerio')
      const $ = cheerio.load(html)
      return MoeWikiService.parseSearchPage($, data)
    } catch (err) {
      console.log(err)
      return '服务器炸了，你猜猜是萌百炸了还是我炸了？'
    }
  }

  private static parseSearchPage($: any, msg: TypeEvent) {
    const sender = msg.user_id
    const contents = $('.mw-search-result-heading > a')
    let contentsArray = Array.isArray(contents)
      ? contents
      : Object.values(contents)
    contentsArray = contentsArray.slice(0, 20)
    if (contents.length === 0) {
      return 'Moe上啥都没 Σ(⊙▽⊙"a'
    }

    const titles = contentsArray
      .map(item => {
        return item.attribs?.title
      })
      .filter(item => item)

    const searchRes = titles.reduce((prev, cur, cin) => {
      return `${prev}\r\n${cin + 1}. ${cur}`
    }, '')

    MoeWikiService.userData[sender] = {
      requestTime: Date.now(),
      pageTitle: titles,
    }

    const prefix = '已搜索到下列条目：'
    const suffix = '【30秒内，输入编号可以查看条目】'

    const res = prefix + '\r\n' + searchRes + '\r\n' + suffix

    return `[CQ:at,qq=${msg.user_id}]\r\n${res}`
  }
}

type VNode = {
  catalog: string
  introduction: string
  suffix: string
  section: string[]
  pictureFilename: string
  picturePath: string
}
