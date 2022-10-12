import { TypePluginParams } from '@/bot'
import { RandomPictureController } from './src/controller'

export interface RandomPictureOptions {}

export default (options: RandomPictureOptions) => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }

    RandomPictureController.parseMsg(data, options)
  }
}
