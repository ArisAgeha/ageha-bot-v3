import { TypeEvent } from '@/bot'
import { patchData } from '@/utils/msg-helper'
import { MiniGameOptions } from '.'

export class MiniGameService {
  static parseMsg(data: TypeEvent, options: MiniGameOptions) {
    const rollPattern = /(^roll)/
    if (rollPattern.test(data.message || '')) {
      patchData(data, rollPattern)
      return MiniGameService.roll(data)
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

  private static coin(data: TypeEvent) {
    return `[CQ:at,qq=${data.user_id}] ${Math.random() < 0.5 ? '正面' : '反面'}`
  }
}
