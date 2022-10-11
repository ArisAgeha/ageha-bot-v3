import axios from 'axios'
import { config } from '../config'

const axiosInstance = axios.create({
  baseURL: config.bot.http,
  method: 'POST',
})

export const http = {
  async send(action: string, params: Record<string, any>) {
    const { data } = await axiosInstance({
      url: action,
      data: params,
    })
    return data
  },
}

