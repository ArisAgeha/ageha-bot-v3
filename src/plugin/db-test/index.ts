import { TypePluginParams } from '@/bot'
import { DbTestController } from './src/controller'

export interface DbTestOptions {}

export default (options: DbTestOptions) => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }

    DbTestController.parseMsg(data, options)
  }
}
