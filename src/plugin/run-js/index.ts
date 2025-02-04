import { TypePluginParams } from '@/bot'
import { commonReply } from '@/utils/msg-helper'
import { RunJSService } from './service'

const pattern = /^JS\s+/i

export interface RunJsOptions {
  timeout?: number
  sandbox: Record<string, Function>
}

export default (options: RunJsOptions) => {
  return async ({ data, ws, http }: TypePluginParams) => {
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

    const replyMsg = await RunJSService.runJs(message, options)

    commonReply({ replyMsg, data })
  }
}
