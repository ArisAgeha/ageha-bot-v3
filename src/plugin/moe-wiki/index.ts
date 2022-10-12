import { TypePluginParams } from '@/bot'
import { commonReply, formatMsg } from '@/utils/utils'
import { MoeWikiService } from './service'

export interface MoeWikiOptions {}

export default (options: MoeWikiOptions) => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }

    const replyMsg = formatMsg(await MoeWikiService.parseMsg(data))
    commonReply({ data, replyMsg })
  }
}
