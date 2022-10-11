const qr = require('qr-image')
const fs = require('fs')
const path = require('path')
const os = require('os')

export class QrCodeService {
  static async getImage(text: string) {
    return new Promise((reply, reject) => {
      const filename = path.join(
        os.tmpdir(),
        `go-cqhttp-node-qrcode-${Date.now()}.png`
      )
      const stream = fs.createWriteStream(filename)
      qr.image(text, {
        type: 'png',
        size: 10,
        margin: 2,
      }).pipe(stream)
      stream.on('finish', () =>
        reply([
          {
            type: 'image',
            data: {
              file: 'file://' + filename,
            },
          },
        ])
      )
      stream.on('error', (err: any) => {
        console.error('[qrcode]', err)
        reply([
          {
            type: 'text',
            data: {
              text: '生成二维码失败',
            },
          },
        ])
      })
    })
  }
}
