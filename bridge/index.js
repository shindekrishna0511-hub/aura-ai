require('dotenv').config()
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => {
  ctx.reply('Hey! Aura AI is online. I am Krishna\'s assistant.')
})

bot.on('text', (ctx) => {
  const message = ctx.message.text
  const sender = ctx.message.from.first_name
  
  console.log(`Message from ${sender}: ${message}`)
  
  ctx.reply(`Got your message! Krishna is unavailable right now. He'll get back to you soon.`)
})

bot.launch()
console.log('Aura AI bot is running...')