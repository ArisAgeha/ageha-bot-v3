import { TypeEvent } from '@/bot'
import {
  ClockStore,
  clockStore,
  ScreenshotStore,
  screenshotStore,
} from '@/nedb/Nedb'
import { commomSend, commonReply, patchData } from '@/utils/msg-helper'
import { ScreenshotOptions } from '.'
import dayjs from 'dayjs'
import gm from 'gm'
import path from 'path'
import fs from 'fs'
import puppeteer from 'puppeteer'
import { sleep, TextHelper } from '@/utils/functional-utils'

export class ScreenshotService {
  static prefix = 'ss'
  static setPrefixs = ['-set', '-s']
  static removePrefixs = ['-remove', '-r']
  static listPrefixs = ['-list', '-l']
  static helpPrefixs = ['-help', '-h']

  static parseMsg(data: TypeEvent, options: ScreenshotOptions) {
    const text = data.message

    if (text.toLowerCase().startsWith(ScreenshotService.prefix)) {
      const prefix = data.message.split(' ')[1]
      if (ScreenshotService.setPrefixs.includes(prefix))
        ScreenshotService.setAlias(data)
      else if (ScreenshotService.removePrefixs.includes(prefix))
        ScreenshotService.removeAlias(data)
      else if (ScreenshotService.listPrefixs.includes(prefix))
        ScreenshotService.listAlias(data)
      else if (ScreenshotService.helpPrefixs.includes(prefix))
        ScreenshotService.sendHelp(data)
      else ScreenshotService.getScreenshots(data)
    }

    return null
  }

  private static sendHelp(msg: TypeEvent) {
    const textHelper = new TextHelper()
    textHelper.append('· 截图器使用方式')
    textHelper.append('[1] 基础使用方式：【ss 任意url】')
    textHelper.append('[2] 绑定别名使用方式：【ss[已绑定的别名] 关键词】')
    textHelper.append('')
    textHelper.append('· 设置别名方法：【ss -set 别名 url】')
    textHelper.append('如： ss -set 百科 http://baike.baidu.com/item/${val}')
    textHelper.append(
      '此时，以[2]方法使用时，关键词 会自动替代url中的${val}模板'
    )
    textHelper.append(
      '如ss百科 测试，则会自动截图【http://baike.baidu.com/item/测试】网页的内容'
    )
    textHelper.append('')
    textHelper.append('· 查看已设置的别名列表：【ss -l】 或 【ss -list】')
    textHelper.append('')
    textHelper.append('· 移除别名：【ss -r 别名】 或 【ss -remove 别名】')

    const text = textHelper.getText()

    commomSend({
      group_id: msg.group_id,
      user_id: msg.user_id,
      msg: text,
    })
  }

  private static async setAlias(msg: TypeEvent) {
    const text = msg.message
    const textArray = text.split(' ')

    if (textArray.length !== 4) {
      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '参数有误，设置别名的格式为【ss -set [别名] [url]】',
      })

      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '如：ss -set 百科 https://baike.baidu.com/item/${val}',
      })
      return
    }

    const id = msg.group_id || msg.user_id
    const name = textArray[2]
    const src = textArray[3].startsWith('http')
      ? textArray[3]
      : `http://${textArray[3]}`

    try {
      await screenshotStore.update(
        { belong_id: id, name },
        { belong_id: id, name, src },
        { upsert: true }
      )

      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '记录别名成功',
      })
    } catch (err) {
      console.error(err)

      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '写入数据库时出现错误',
      })
    }
  }

  private static async removeAlias(msg: TypeEvent) {
    const text = msg.message
    const textArray = text.split(' ')

    if (textArray.length !== 3) {
      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '参数有误，设置别名的格式为【ss -remove [别名]】',
      })
      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '如：ss -remove 百科',
      })
      return
    }

    const id = msg.group_id || msg.user_id
    const name = textArray[2]

    try {
      await screenshotStore.remove({ belong_id: id, name })
      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '删除别名成功',
      })
    } catch (err) {
      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '删除别名失败',
      })
    }
  }

  private static async listAlias(msg: TypeEvent) {
    const id = msg.group_id || msg.user_id
    const list: ScreenshotStore[] = await screenshotStore
      .find({ belong_id: id })
      .exec()
    if (list.length > 0) {
      const res = list.reduce((prev, cur, index) => {
        return prev + `[${index + 1}] ${cur.name} ${cur.src}\r\n`
      }, '')

      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: res,
      })
    } else {
      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '未查询到别名设置',
      })
    }
  }

  private static async getScreenshots(msg: TypeEvent) {
    try {
      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '正在连接网页...',
      })
      const text = msg.message
      const textArray = text.split(' ')
      const { timeout, alias } = this.extractParams(textArray)

      let src = ''
      if (alias) {
        const id = msg.group_id || msg.user_id
        const srcModelData: ScreenshotStore[] = await screenshotStore
          .find({ belong_id: id, name: alias })
          .exec()

        if (srcModelData.length === 0) {
          commomSend({
            user_id: msg.user_id,
            group_id: msg.group_id,
            msg: '未绑定此别名...',
          })
          return
        }

        const srcModel = srcModelData[0]
        src = srcModel?.src?.replace('${val}', textArray[1])
      } else {
        src = textArray[1].startsWith('http')
          ? textArray[1]
          : `http://${textArray[1]}`
      }

      if (!src) return

      const browser = await puppeteer.launch({})
      const page = await browser.newPage()
      await page.goto(src)
      await page.waitFor(timeout)
      page.setViewport({
        width: 1600,
        height: 900,
      })

      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '网页连接完成，正在加载网页资源...',
      })
      await this.autoScroll(page)

      const rd = String(Math.ceil(Math.random() * 10000000))
      const tempPath = path.resolve(`./temp/${rd}.png`)
      const savePath = path.resolve(`I:\\酷Q Pro\\data\\image\\${rd}.png`)

      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '正在截屏...',
      })
      await page.screenshot({ path: tempPath, fullPage: true })

      gm(tempPath).size(async (err, size) => {
        let curHeight = size.height
        const maxHeightPerSlice = 3000
        if (curHeight > maxHeightPerSlice) {
          commomSend({
            user_id: msg.user_id,
            group_id: msg.group_id,
            msg: '截屏图片过大，正在裁剪图片...',
          })

          const imagesCode: string[] = []
          while (curHeight >= 0) {
            const rd = String(Math.ceil(Math.random() * 10000000))
            const savePath = path.resolve(`I:\\酷Q Pro\\data\\image\\${rd}.png`)
            imagesCode.push(rd)
            await this.cropImage(
              tempPath,
              savePath,
              1600,
              maxHeightPerSlice,
              0,
              size.height - curHeight
            )
            curHeight -= maxHeightPerSlice
          }

          commomSend({
            user_id: msg.user_id,
            group_id: msg.group_id,
            msg: '裁剪完成，开始发送图片...',
          })

          for (let rd of imagesCode) {
            const pictureCq = `[CQ:image,file=${rd}.png]`
            await commomSend({
              user_id: msg.user_id,
              group_id: msg.group_id,
              msg: pictureCq,
            })
            await sleep(3000)
          }
        } else {
          fs.rename(tempPath, savePath, async err => {
            console.log(err)
            if (!err) {
              const pictureCq = `[CQ:image,file=${rd}.png]`
              await commomSend({
                user_id: msg.user_id,
                group_id: msg.group_id,
                msg: pictureCq,
              })

              setTimeout(() => {
                fs.unlink(savePath, () => {})
              }, 300 * 1000)
            }
          })
        }
      })
    } catch (err) {
      console.error(err)
      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: '获取网页截屏失败，请检查你的url',
      })
    }
  }

  private static async cropImage(
    targetPath: string,
    savePath: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) {
    return new Promise((res, rej) => {
      gm(targetPath)
        .crop(width, height, x, y)
        .write(savePath, err => {
          if (err) console.log(err)
          if (err) rej()
          else res(undefined)
        })
    })
  }

  private static async autoScroll(page: puppeteer.Page) {
    await page.evaluate(`(async () => {
            await new Promise((resolve, reject) => {
                var totalHeight = 0;
                var distance = 400;
                var timer = setInterval(() => {
                    // @ts-ignore
                    var scrollHeight = document.body.scrollHeight;
                    // @ts-ignore
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 25);
            });
        })()`)
  }

  private static extractParams(paramsArray: string[]) {
    let timeout = 0
    let alias = ''

    if (paramsArray[0].length > 2) alias = paramsArray[0].slice(2)

    for (let i = 0; i < paramsArray.length; i++) {
      if (['-t', '-time'].includes(paramsArray[i])) {
        let timeoutData = Number(paramsArray[i + 1])
        if (isNaN(timeoutData) || !timeoutData) continue
        else timeout = timeoutData
      }
    }

    return { timeout, alias }
  }
}
