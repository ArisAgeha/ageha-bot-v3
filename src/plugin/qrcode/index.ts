import { TypePluginParams } from '@/bot'
import { commonReply } from '@/utils/utils'
import { QrCodeService } from './service'

const pattern = /^(二维码|qr(code)?)\s+/i

module.exports = () => {
  return async ({ data, ws }: TypePluginParams) => {
    if (!data.message) {
      return
    }

    let message = data.message.trim()
    if (!pattern.test(message)) {
      return
    }

    message = message.replace(pattern, '').trim()
    if (!message) {
      return
    }

    const replyMsg = await QrCodeService.getImage(message)

    commonReply({ replyMsg, data, ws })
  }
}
