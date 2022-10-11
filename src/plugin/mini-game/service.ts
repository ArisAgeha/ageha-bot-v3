import { TypeEvent } from '@/bot'
import { patchData } from '@/utils/utils'
import { MiniGameOptions } from '.'

export class MiniGameService {
  static parseMsg(data: TypeEvent, options: MiniGameOptions) {
    const rollPattern = /(^roll$|^roll \d+$)/
    if (rollPattern.test(data.message || '')) {
      patchData(data, rollPattern)
      return MiniGameService.roll(data)
    }

    const groupPattern = /^分组 (\[CQ:at,qq=\d+\] )+/
    if (groupPattern.test(data.message || '')) {
      patchData(data, groupPattern)
      return MiniGameService.group(data)
    }

    const coinPattern = /^(抛硬币|coin)/i
    if (coinPattern.test(data.message || '')) {
      patchData(data, coinPattern)
      return MiniGameService.coin(data)
    }

    return null
  }

  private static roll(data: TypeEvent) {
    const text = data.message || ''

    const value = text.match(/\d+/)
    const maxValue = value ? Number(value[0]) : 100

    const res = Math.ceil(Math.random() * maxValue)

    return `[CQ:at,qq=${data.user_id}] ${res}`
  }

  private static group(data: TypeEvent) {
    const text = data.message || ''
    const members = text.match(/\d+/g)

    if (!members || members.length === 0) {
      return `[CQ:at,qq=${data.user_id}] 诶？人呢？人呢？人呢？`
    }
    if (members.length === 1) {
      return `[CQ:at,qq=${data.user_id}] 孤独风中一匹狼 还分个jio分`
    }

    const group1 = []
    let group2 = []

    const length = Math.ceil(members.length / 2)
    for (let i = 0; i < length; i++) {
      const member = members.splice(
        Math.floor(Math.random() * members.length),
        1
      )[0]
      group1.push(member)
    }
    group2 = [...members]

    let res = ''

    res += 'A组：'
    group1.forEach(member => {
      res += `[CQ:at,qq=${member}] `
    })

    res += '\r\nB组：'
    group2.forEach(member => {
      res += `[CQ:at,qq=${member}] `
    })

    return res
  }

  private static coin(data: TypeEvent) {
    return `[CQ:at,qq=${data.user_id}] ${Math.random() < 0.5 ? '正面' : '反面'}`
  }
}
