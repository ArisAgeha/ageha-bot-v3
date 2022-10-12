import { TypePluginParams } from '@/bot'
import { commonReply, formatMsg } from '@/utils/utils'
import { ClockService } from './service'

export interface ClockOptions {}

export default (options: ClockOptions) => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }
  }
}
