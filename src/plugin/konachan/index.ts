import { TypePluginParams } from '@/bot'
import { commonReply, formatMsg } from '@/utils/msg-helper'
import { KonachanService } from './service'

export interface KonachanOptions {}

export default (options: KonachanOptions) => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }

    const replyMsg = formatMsg(await KonachanService.parseMsg(data))
    commonReply({ data, replyMsg })
  }
}
