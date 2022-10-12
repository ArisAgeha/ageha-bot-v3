import { TypePluginParams } from '@/bot'
import { DbTestService } from './service'

export interface DbTestOptions {}

export default (options: DbTestOptions) => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }

    DbTestService.parseMsg(data, options)
  }
}
