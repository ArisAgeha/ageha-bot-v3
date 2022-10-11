import { http } from './http'
import { ws } from './ws'

export { http, ws }

export type TypeWS = typeof ws

export type TypeHttp = typeof http

export type TypeEvent = {
  time?: number // - | 事件发生的时间戳,
  self_id?: number // - | 收到事件的机器人 QQ 号,
  post_type?: string // 参考 // message | 上报类型,
  message_type?: string // 消息类型,
  sub_type?: string // 消息子类型, 正常消息是 normal, 匿名消息是 anonymous, 系统提示 ( 如「管理员已禁止群内匿名聊天」 ) 是 notice,
  message_id?: number // - | 消息 ID,
  user_id: number // - | 发送者 QQ 号,
  message: string // - | 消息内容,
  raw_message?: string // 原始消息内容,
  font?: number // - | 字体,
  sender?: object //  参考 // - | 发送人信息,
  group_id?: number // - | 群号,
  anonymous?: object // - | 匿名信息, 如果不是匿名消息则为 null
}

export type TypePluginParams = { data: TypeEvent; ws: TypeWS; http: TypeHttp }

export type TypePluginCb = Promise<(params: TypePluginParams) => void>
