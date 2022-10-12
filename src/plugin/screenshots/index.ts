import { TypePluginParams } from '@/bot'
import { commonReply, formatMsg } from '@/utils/msg-helper'
import { ScreenshotService } from './service'

export interface ScreenshotOptions {}

export default (options: ScreenshotOptions) => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }
  }
}
