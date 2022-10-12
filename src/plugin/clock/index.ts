import { TypePluginParams } from '@/bot'
import { ClockService } from './service'

export interface ClockOptions {}

export default (options: ClockOptions) => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }

    ClockService.parseMsg(data, options)
  }
}
