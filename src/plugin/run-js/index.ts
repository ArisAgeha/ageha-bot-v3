import { TypePluginParams } from '@/bot'

const service = require('./service')

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

    if (data.message_type === 'group') {
      ws.send('send_group_msg', {
        group_id: data.group_id,
        message: [
          {
            type: 'reply',
            data: {
              id: data.message_id,
            },
          },
          ...(await service.runJs(message, options)),
        ],
      })
      return
    }

    if (data.message_type === 'private') {
      ws.send('send_private_msg', {
        user_id: data.user_id,
        message: await service.runJs(message, options),
      })
      return
    }
  }
}
