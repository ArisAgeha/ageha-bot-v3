import { TypeEvent } from '@/bot'
import { basicPath, TextHelper } from '@/utils/functional-utils'
import { commomSend } from '@/utils/msg-helper'
import { RandomPictureOptions } from '..'
import { RandomPictureService } from './service'
import path from 'path'

export class RandomPictureController {
  static prefix = '随机'
  static setSizePrefix = '随机 -size'
  static typePrefix = '随机 -type'

  static sizeMap = {
    0: '全部尺寸',
    1: '小尺寸',
    2: '中尺寸',
    3: '大尺寸',
    9: '特大尺寸',
  }

  static typeMap = {
    0: '全部类型',
    2: '二次元',
    3: '三次元',
  }

  static parseMsg(data: TypeEvent, options: RandomPictureOptions) {
    const text = data.message

    if (text.startsWith('随机 -relative'))
      RandomPictureController.setRelative(data)
    else if (text.startsWith('随机 -type')) RandomPictureController.setType(data)
    else if (text.startsWith('随机 -size')) RandomPictureController.setSize(data)
    else if (text.toLowerCase().startsWith(RandomPictureController.prefix))
      RandomPictureController.getRandomPicture(data)

    return null
  }

  private static async setType(msg: TypeEvent) {
    const text = msg.message

    if (!/^随机 -type [023]$/.test(text)) {
      const str = Object.keys(this.typeMap).reduce((prev, cur, index) => {
        return `${prev}\r\n[${cur}] ${this.typeMap[cur]}`
      })

      commomSend({
        user_id: msg.user_id,
        group_id: msg.group_id,
        msg: `类型错误，可接受的类型：${str}`,
      })
      return
    }

    const qqId = msg.user_id || 0
    const groupId = msg.group_id || 0
    const type = Number(text[9])

    await RandomPictureService.setDefaultType({ groupId, type, qqId })

    const textHelper = new TextHelper()
    textHelper.append(
      `[CQ:at,qq=${qqId}] 类型设置成功，您当前的设置为：${type}`
    )
    Object.keys(this.typeMap).forEach(typeNum => {
      textHelper.append(
        `${type === Number(typeNum) ? '☞ ' : ''}[${typeNum}] ${this.typeMap[typeNum]
        }`
      )
    })
    const res = textHelper.getText()

    commomSend({
      msg: res,
      user_id: msg.user_id,
      group_id: msg.group_id,
    })
  }

  private static async setRelative(msg: TypeEvent) {
    const text = msg.message
    if (!/^随机 -relative (0\.\d+)$|1$|1.0+$|0$|0.0+$/.test(text)) {
      commomSend({
        msg: '相关性指数指定错误，请输入[0-1]之间的小数，数值越大，相关性越强',
        user_id: msg.user_id,
        group_id: msg.group_id,
      })
      return
    }
    const groupId = msg.group_id || 0
    const relative = Number(text.match(/(0\.\d+)$|1$|1.0+$|0$|0.0+$/)[0])

    await RandomPictureService.setRelative({ groupId, relative })

    commomSend({
      msg: '相关指数设定成功',
      user_id: msg.user_id,
      group_id: msg.group_id,
    })
  }

  private static async setSize(msg: TypeEvent) {
    const text = msg.message
    const qqId = msg.user_id || 0
    const groupId = msg.group_id || 0
    const match = text.match(/\d+/) || '-1'
    const size = Number(match[0])

    if (![0, 1, 2, 3, 9].includes(size)) {
      const str = Object.keys(this.sizeMap).reduce((prev, cur, index) => {
        return `${prev}\r\n[${cur}] ${this.sizeMap[cur]}`
      })
      commomSend({
        msg: `尺寸指定出错，接受的尺寸：${str}`,
        user_id: msg.user_id,
        group_id: msg.group_id,
      })
      return
    }

    await RandomPictureService.setDefaultSize({ qqId, groupId, size })

    const textHelper = new TextHelper()
    textHelper.append(
      `[CQ:at,qq=${qqId}] 默认尺寸设置成功，您当前的设置为：${size}`
    )
    Object.keys(this.sizeMap).forEach(sizeNum => {
      textHelper.append(
        `${size === Number(sizeNum) ? '☞ ' : ''}[${sizeNum}] ${this.sizeMap[sizeNum]
        }`
      )
    })
    const res = textHelper.getText()

    commomSend({
      msg: res,
      user_id: msg.user_id,
      group_id: msg.group_id,
    })
  }

  private static async getRandomPicture(msg: TypeEvent) {
    const text = msg.message
    const content = text.slice(2)
    const { keyword, count } = this.parseText(content)
    const size = await RandomPictureService.getSizeSetting({
      groupId: msg.group_id,
      qqId: msg.user_id,
    })
    const relative = await RandomPictureService.getRelative({
      groupId: msg.group_id,
    })
    const type = await RandomPictureService.getTypeSetting({
      groupId: msg.group_id,
      qqId: msg.user_id,
    })

    commomSend({
      msg: `${keyword}加载中... [${this.sizeMap[size]}] [相关度${relative}] [${this.typeMap[type]}]`,
      user_id: msg.user_id,
      group_id: msg.group_id,
    })

    commomSend({
      msg: `[随机 -type] 设置类型（个人）\r\n[随机 -size] 设置尺寸（个人）\r\n[随机 -relative] 设置相关度（全群生效）`,
      user_id: msg.user_id,
      group_id: msg.group_id,
    })

    const rds = await RandomPictureService.getPicture(
      keyword,
      count,
      size,
      relative,
      type
    )

    if (rds) {
      rds.forEach(rd => {
        commomSend({
          msg: `[CQ:image,file=file:///${basicPath}\\${rd}.png]`,
          user_id: msg.user_id,
          group_id: msg.group_id,
        })
      })
    } else {
      commomSend({
        msg: `没有找到内容！`,
        user_id: msg.user_id,
        group_id: msg.group_id,
      })
    }
  }

  private static parseText(text: string) {
    const maxCount = 30
    const minCount = 1

    const res = {
      keyword: '',
      count: 1,
    }

    const countMatch = text.match(/(.+)(\* *\d+)/)
    if (countMatch && countMatch[2]) {
      let count = Number(countMatch[2].match(/\d+/)[0])

      res.count = Math.max(Math.min(count, maxCount), minCount)
      res.keyword = countMatch[1]
    } else {
      res.keyword = text
    }

    return res
  }
}
