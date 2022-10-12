import { TypeEvent, ws } from '@/bot'

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
  replyMsg: string | string[] | unknown
}) {
  const { data, replyMsg } = params

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

export async function commomSend(params: {
  group_id?: string | number
  user_id?: string | number
  msg: string | string[] | unknown
}) {
  const { group_id, user_id, msg } = params

  if (!msg) return

  if (group_id === 'group') {
    await ws.send('send_group_msg', {
      group_id: group_id,
      message: [...formatMsg(msg)],
    })
    return
  } else if (user_id === 'private') {
    await ws.send('send_private_msg', {
      user_id: user_id,
      message: msg,
    })
    return
  }
}
