import { TypeEvent } from '@/bot'
import { ClockStore, clockStore } from '@/nedb/Nedb'
import { commomSend, commonReply, patchData } from '@/utils/msg-helper'
import { ClockOptions } from '.'
import dayjs from 'dayjs'

export class ClockService {
  static parseMsg(data: TypeEvent, options: ClockOptions) {
    const showClockPattern = /^show clock/
    if (showClockPattern.test(data.message || '')) {
      patchData(data, showClockPattern)
      ClockService.showClock(data)
    }

    const showAllClockPattern = /^show all clock/
    if (showAllClockPattern.test(data.message || '')) {
      patchData(data, showAllClockPattern)
      ClockService.showAllClock(data)
    }

    const delayPattern =
      /^yc \d+[.\d*]*(ms|s|sec|secs|second|seconds|h|hour|hours|m|min|mins)/
    if (delayPattern.test(data.message || '')) {
      ClockService.delayNotify(data)
    }

    const cancelPattern = /^cancel clock/
    if (cancelPattern.test(data.message || '')) {
      patchData(data, cancelPattern)
      ClockService.cancelClock(data)
    }

    return null
  }

  public static async checkNotify() {
    setInterval(async () => {
      const now = Number(Date.now())
      const data: ClockStore[] = await clockStore.find({}).exec()
      if (!data) return

      data.forEach(item => {
        const qqId = item.qq_id
        const groupId = item.group_id || 0

        if (item.notify_date <= now && !item.is_notifier) {
          const msg = `[CQ:at,qq=${item.qq_id}] [${item.desc}] 够钟辣！`

          commomSend({
            msg,
            group_id: groupId,
            user_id: qqId,
          })

          clockStore.remove({ qq_id: qqId, group_id: groupId, desc: item.desc })
        }
        if (item.is_notifier) {
          clockStore.remove({ qq_id: qqId, group_id: groupId, desc: item.desc })
        }
      })
    }, 1 * 1000)
  }

  private static async showClock(msg: TypeEvent) {
    const qqId = msg.user_id
    const groupId = msg.group_id || 0

    const clockInfos = await ClockService.getClockInfos({ qqId, groupId })
    if (!clockInfos) {
      commonReply({ replyMsg: `[CQ:at,qq=${qqId}] 没有闹钟`, data: msg })
      return
    } else {
      commomSend({
        msg: clockInfos,
        group_id: groupId,
        user_id: qqId,
      })
    }
  }

  private static async showAllClock(msg: TypeEvent) {
    const qqId = msg.user_id
    const groupId = msg.group_id || 0

    const clockInfos = await ClockService.getGroupClockInfos({
      qqId,
      groupId,
    })
    if (!clockInfos) {
      commonReply({ data: msg, replyMsg: '未找到闹钟' })
      return
    } else {
      commomSend({
        msg: clockInfos,
        group_id: groupId,
        user_id: qqId,
      })
    }
  }

  private static async cancelClock(msg: TypeEvent) {
    const user_id = msg.user_id
    const group_id = msg.group_id || 0

    const textArray = msg.message.split(' ')
    const desc = textArray.length === 3 ? textArray[2] : ''

    try {
      await clockStore.remove({ qq_id: user_id, group_id, desc })
      commomSend({
        group_id,
        user_id,
        msg: `[CQ:at,qq=${user_id}] 已取消提醒${desc}`,
      })
    } catch (err) {
      console.error(err)
      return false
    }
  }

  private static async delayNotify(msg: TypeEvent) {
    const qqId = msg.user_id
    const groupId = msg.group_id || 0

    const text = msg.message
    const textArray = text.split(' ')
    const delayTime = textArray[1]
    const desc = textArray[2] ? textArray[2] : ''

    const formatDate = await ClockService.delayClock({
      groupId,
      qqId,
      desc,
      delayTime,
    })

    commomSend({
      user_id: qqId,
      group_id: groupId,
      msg: `[CQ:at,qq=${qqId}] ${desc} 提醒已推延至${formatDate}`,
    })
  }

  private static async getClockInfos(belongData: {
    qqId: number
    groupId: number
  }) {
    const { qqId, groupId } = belongData
    const clocks: ClockStore[] = await clockStore
      .find({ qq_id: qqId, group_id: groupId })
      .exec()

    if (clocks.length === 0) {
      return false
    } else {
      const prefix = `[CQ:at,qq=${qqId}]\r\n`
      const content = clocks
        .sort((a, b) => {
          return a.notify_date - b.notify_date
        })
        .map((item, index) => {
          const formatDate = dayjs(item.notify_date).format(
            'YYYY-MM-DD HH:mm:ss'
          )
          return `[${index + 1}] ${
            item.desc ? item.desc : '默认闹钟'
          }: ${formatDate} \r\n`
        })
        .reduce((prev, cur) => {
          return prev + cur
        }, '')
      const res = prefix + content
      return res
    }
  }

  private static async getGroupClockInfos(belongData: {
    qqId: number
    groupId: number
  }) {
    const { qqId, groupId } = belongData
    const clocks: ClockStore[] = groupId
      ? await clockStore.find({ group_id: groupId })
      : await clockStore.find({ group_id: groupId, qq_id: qqId })

    if (clocks.length === 0) {
      return false
    } else {
      let curId = -1
      let curIndex = 1
      const content = clocks
        .sort((a, b) => {
          return a.notify_date - b.notify_date
        })
        .map((item, index) => {
          let text = ''
          if (item.qq_id !== curId) {
            curId = item.qq_id
            curIndex = 1
            text += `======= [CQ:at,qq=${item.qq_id}] =======\r\n`
          }

          const formatDate = dayjs(item.notify_date).format(
            'YYYY-MM-DD HH:mm:ss'
          )
          text += `[${curIndex++}] ${
            item.desc ? item.desc : '默认闹钟'
          }: ${formatDate} \r\n`

          return text
        })
        .reduce((prev, cur) => {
          return prev + cur
        }, '')
      const res = content
      return res
    }
  }

  private static async delayClock(info: {
    qqId: number
    groupId: number
    desc: string
    delayTime: string
  }) {
    const { qqId, groupId, desc, delayTime } = info
    const now = Number(Date.now())

    const delayTimeValueMatch = delayTime.match(/^\d+[.\d*]*/)
    const delayTimeValue = delayTimeValueMatch
      ? Number(delayTimeValueMatch[0])
      : 0

    const notifyItem: ClockStore = await clockStore.findOne({
      qq_id: qqId,
      group_id: groupId,
      desc,
    })

    let notifyDate
    if (notifyItem && !notifyItem.is_notifier) {
      if (/(h|hour|hours)/.test(delayTime))
        notifyDate = notifyItem.notify_date + delayTimeValue * 60 * 60 * 1000
      else if (/ms/.test(delayTime))
        notifyDate = notifyItem.notify_date + delayTimeValue
      else if (/(s|sec|secs|second|seconds)/.test(delayTime))
        notifyDate = notifyItem.notify_date + delayTimeValue * 1000
      else notifyDate = notifyItem.notify_date + delayTimeValue * 60 * 1000
    } else {
      if (/(h|hour|hours)/.test(delayTime))
        notifyDate = now + delayTimeValue * 60 * 60 * 1000
      else if (/ms/.test(delayTime)) notifyDate = now + delayTimeValue
      else if (/(s|sec|secs|second|seconds)/.test(delayTime))
        notifyDate = now + delayTimeValue * 1000
      else notifyDate = now + delayTimeValue * 60 * 1000
    }

    await clockStore.update(
      { qq_id: qqId, group_id: groupId, desc },
      {
        qq_id: qqId,
        group_id: groupId,
        notify_date: notifyDate,
        is_notified: false,
        desc,
      },
      { upsert: true }
    )

    const formatDate = dayjs(notifyDate).format('YYYY-MM-DD HH:mm:ss')
    return formatDate
  }
}

ClockService.checkNotify()
