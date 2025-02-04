import { TypePluginParams } from '@/bot'
import { commonReply, formatMsg } from '@/utils/msg-helper'
import { MiniGameService } from './service'

export interface MiniGameOptions {}

export default (options: MiniGameOptions) => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }

    const replyMsg = formatMsg(MiniGameService.parseMsg(data, options))

    commonReply({ data, replyMsg })
  }
}
