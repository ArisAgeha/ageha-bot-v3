import WebSocket from 'ws'
import { config } from '../config'

const socket = new WebSocket(config.bot.ws)

export const ws = {
  send(action: string, params: Record<string, any>) {
    socket.send(JSON.stringify({ action, params }))
  },
  listen(callback: any) {
    socket.on('message', (data: any) => {
      try {
        callback(JSON.parse(data))
      } catch (e) {
        console.error(e)
      }
    })
  },
}
