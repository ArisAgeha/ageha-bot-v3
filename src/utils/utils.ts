import { TypeEvent, TypeHttp, TypeWS } from '@/bot'

export function patchData(data: TypeEvent, pattern: RegExp) {
  data.message = data.message?.replace(pattern, '').trim()
}

export function formatMsg(msg: string | string[] | unknown): string[] {
  if (!msg) return []
  else if (typeof msg === 'string') return [msg]
  else if (Array.isArray(msg)) return msg
  else {
    console.error(`error msg type [${typeof msg}]: ${msg}`)
    return []
  }
}

export function commonReply(params: {
  data: TypeEvent
  ws: TypeWS
  http?: TypeHttp
  replyMsg: string | string[] | unknown
}) {
  const { data, ws, http, replyMsg } = params

  if (!replyMsg) return

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
        ...formatMsg(replyMsg),
      ],
    })
    return
  }

  if (data.message_type === 'private') {
    ws.send('send_private_msg', {
      user_id: data.user_id,
      message: replyMsg,
    })
    return
  }
}
