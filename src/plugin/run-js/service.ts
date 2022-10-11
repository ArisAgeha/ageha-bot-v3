import { RunJsOptions } from '.'

const { VM } = require('vm2')

export class RunJSService {
  private static handleOutput(output: string) {
    let o: string | string[] = String(output)
    if (o.length === 0) {
      return '运行结果为空'
    }

    let f = ''
    o = o.split('\n')
    if (o.length > 10) {
      o = o.slice(0, 10)
      f = '\n(为了避免刷屏, 仅显示前10次换行)'
    }

    o = o.join('\n')
    if (o.length > 520) {
      o = o.slice(0, 520)
      f = '\n(为了避免刷屏, 仅显示前520个字符)'
    }

    return o + f
  }

  static runJs(input: string, options: RunJsOptions) {
    return new Promise(resolve => {
      const myResolve = (output: string, error?: any) => {
        resolve([
          {
            type: 'text',
            data: {
              text:
                (error ? '[运行失败]\n' : '') +
                RunJSService.handleOutput(output),
            },
          },
        ])
      }
      try {
        const code = input
          .replace(/^JS\s+/i, '')
          .replace(/&#91;/g, '[')
          .replace(/&#93;/g, ']')
          .replace(/&amp;/g, '&')
        const vm = new VM({
          timeout: options.timeout || 1000 * 10,
          sandbox: options.sandbox || {},
        })
        const hasCallback = code.includes('callback(')
        const result = vm.run(
          hasCallback ? `(function (callback) { ${code} })` : code
        )
        if (typeof result === 'function' && hasCallback) {
          result(myResolve)
        } else {
          myResolve(result)
        }
      } catch (e: any) {
        // console.error('[run-js]', e)
        myResolve(e.message, true)
      }
    })
  }
}
