import { TypeEvent } from '@/bot'
import { clockStore, screenshotStore, userSettingsStore } from '@/nedb/Nedb'
import { TextHelper } from '@/utils/functional-utils'
import { commomSend } from '@/utils/msg-helper'
import { DbTestOptions } from '.'

export class DbTestService {
  static prefix = 'test db'
  static clearPrefix = 'clear db'
  static storesName = new Map()

  static parseMsg(data: TypeEvent, options: DbTestOptions) {
    const text = data.message

    if (DbTestService.prefix === text) {
      DbTestService.sendTest(data)
    } else if (text.startsWith(DbTestService.clearPrefix)) {
      DbTestService.clearDb(data)
    }

    return null
  }

  private static async sendTest(msg: TypeEvent) {
    const textHelper = new TextHelper()

    const stores = [screenshotStore, clockStore, userSettingsStore]
    for (let store of stores) {
      textHelper.append(`======== ${this.storesName.get(store)} ========`)
      const data = await store.find({}).exec()
      if (Array.isArray(data))
        data.forEach(item => {
          textHelper.append(`  ${JSON.stringify(item)}`)
        })
    }

    const text = textHelper.getText()

    commomSend({
      user_id: msg.user_id,
      group_id: msg.group_id,
      msg: text,
    })
  }

  private static async clearDb(msg: TypeEvent) {
    const type = msg.message.slice(9)
    if (type) {
      const storesMap = {
        screenshotStore: screenshotStore,
        clockStore: clockStore,
        userSettingsStore: userSettingsStore,
      }
      const store = storesMap[type]

      if (store) {
        await store.remove({}, { multi: true })
      } else {
        commomSend({
          user_id: msg.user_id,
          group_id: msg.group_id,
          msg: `没有找到指定的store: ${type}`,
        })
      }
    } else {
      const stores = [screenshotStore, clockStore, userSettingsStore]
      for (let store of stores) {
        await store.remove({}, { multi: true })
      }
    }
    commomSend({
      user_id: msg.user_id,
      group_id: msg.group_id,
      msg: 'complete',
    })
  }
}
