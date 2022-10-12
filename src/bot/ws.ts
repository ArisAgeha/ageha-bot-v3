import WebSocket from 'ws'
import { config } from '../config'

const socket = new WebSocket(config.bot.ws)

export const ws = {
  async send(action: string, params: Record<string, any>) {
    console.log('parse--------');
    console.log(JSON.stringify({ action, params }));
    await socket.send(JSON.stringify({ action, params }))
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
