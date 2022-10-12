// import { ws, http } from './bot'
// import { config } from './config'

// init()

// async function init() {
//   const pluginsPromise = Object.keys(config.plugin).map(async name => {
//     const fn = (await import(name)).default
//     return fn(config.plugin[name])
//   })

//   const plugins = await Promise.all(pluginsPromise)

//   ws.listen((data: any) => {
//     if (process.env.NODE_ENV === 'development') {
//       console.log(data)
//     }

//     plugins.forEach(plugin => plugin({ data, ws, http }))
//   })
// }

console.log(1)
