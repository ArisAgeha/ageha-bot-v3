const fs = require('fs')
const resolve = require('path').resolve
const join = require('path').join
const cp = require('child_process')
const os = require('os')

// get library path
const lib = resolve(__dirname, '../src/plugin')

fs.readdirSync(lib).forEach(function (mod) {
  const modPath = join(lib, mod)

  // ensure path has package.json
  if (!fs.existsSync(join(modPath, 'package.json'))) {
    return
  }

  // npm binary based on OS
  const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm'

  // install folder
  cp.spawn(npmCmd, ['i'], {
    env: process.env,
    cwd: modPath,
    stdio: 'inherit',
  })
})
