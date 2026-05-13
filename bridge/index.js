require('dotenv').config()
const fs = require('fs')
const { Telegraf } = require('telegraf')
const Groq = require('groq-sdk')
const { getRelationship } = require('./contacts')

const MEMORY_FILE = './memory.json'
let conversationMemory = {}
try {
  conversationMemory = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'))
} catch (e) {
  conversationMemory = {}
}

function saveMemory() {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(conversationMemory))
}

const bot = new Telegraf(process.env.BOT_TOKEN)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Priority Detection
async function detectPriority(message) {
  const urgentWords = [
    'urgent', 'emergency', 'help', 'accident', 'hospital',
    'please reply', 'important', 'serious', 'crying', 'sad',
    'depressed', 'fight', 'broke up', 'money', 'dying',
    'scared', 'need you', 'please', 'asap'
  ]
  
  const msgLower = message.toLowerCase()
  for (const word of urgentWords) {
    if (msgLower.includes(word)) return true
  }
  return false
}

async function alertKrishna(bot, senderName, message) {
  const krishnaId = process.env.KRISHNA_TELEGRAM_ID
  const alertMsg = `🚨 URGENT MESSAGE ALERT!

From: ${senderName}
Message: "${message}"

Reply yourself or let Aura AI handle it?`

  await bot.telegram.sendMessage(krishnaId, alertMsg)
}


const KRISHNA_REAL_CHATS = `You are Krishna, a 20 year old BSc CS student from Hyderabad.

Here are REAL conversations showing exactly how Krishna texts:

Friend: Hii ra
Krishna: Hiiieee

Friend: Em chesthunavuu
Krishna: Nuvvu cheppu raa

Friend: Tinnava
Krishna: Led, nuvvu

Friend: Busy aa
Krishna: Kaadu ra

Friend: Bye
Krishna: Boieee

Friend: Okk
Krishna: Sare le...

Friend: Areyy em chesav
Krishna: Em cheyanu ra abhooo

Friend: Call cheyala
Krishna: 10mins

Friend: Ikkadunnav
Krishna: Intlo unna ra

Friend: Nidra vastundi
Krishna: Haa ra naku kuda

Friend: Cheppu ra
Krishna: nuvvu chepuu raaa

Friend: em chesthunavuu
Krishna: kali raaa nuvuu??

Friend: haa thina raa
Krishna: good em thinavuu

Friend: em led
Krishna: 🙄

Friend: says any food item
Krishna: nycc raa

Read the full conversation and reply naturally as Krishna. Keep it short 1-5 words.
IMPORTANT: Never repeat the same reply twice in a row. Always vary your response.`

bot.start((ctx) => {
  ctx.reply('Hiiieee')
})

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text
  const senderName = ctx.message.from.first_name
  const senderUsername = ctx.message.from.username || 'unknown'
  const relationship = getRelationship(senderUsername, senderName)

  if (!conversationMemory[senderUsername]) {
    conversationMemory[senderUsername] = []
  }

  const memory = conversationMemory[senderUsername]

  console.log(`Message from ${senderName} (@${senderUsername}) [${relationship}]: ${userMessage}`)
 const isUrgent = await detectPriority(userMessage)
console.log(`Priority check: ${isUrgent} for message: ${userMessage}`)
if (isUrgent) {
  console.log('Sending alert to Krishna...')
  await alertKrishna(bot, senderName, userMessage)
  console.log('Alert sent!')
}
memory.push({ role: 'user', content: userMessage })

  if (memory.length > 20) memory.shift()

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: KRISHNA_REAL_CHATS },
        ...memory
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.9,
    })

    const response = completion.choices[0].message.content
    memory.push({ role: 'assistant', content: response })
    saveMemory()

    console.log(`Aura AI replied: ${response}`)
    ctx.reply(response)

  } catch (error) {
    console.error('AI Error:', error.message)
    ctx.reply('Sare le...')
  }
})

bot.launch()
console.log('Aura AI is now THINKING...')