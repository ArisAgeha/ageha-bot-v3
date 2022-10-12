export const config = {
  bot: {
    http: 'http://0.0.0.0:5700',
    ws: 'ws://0.0.0.0:6700',
  },
  plugin: {
    './plugin/run-js': {
      // 运行超时毫秒数 (不填默认为: 1000 * 10)
      timeout: 1000 * 10,
      // 可定义全局方法或常量
      sandbox: {
        sayHello: (value: string) => `hello, ${value}`,
      },
    },
    './plugin/konachan': {},
    './plugin/mini-game': {},
    './plugin/moe-wiki': {},
    './plugin/qrcode': {},
    './plugin/screenshots': {},
    './plugin/clock': {},
    './plugin/random-picture': {},
  },
}
