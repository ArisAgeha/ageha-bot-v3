import { TypePluginParams } from '@/bot'
import { ScreenshotService } from './service'

export interface ScreenshotOptions {}

export default (options: ScreenshotOptions) => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }

    ScreenshotService.parseMsg(data, options)
  }
}
