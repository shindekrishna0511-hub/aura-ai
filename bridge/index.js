require('dotenv').config()
const { Telegraf } = require('telegraf')
const Groq = require('groq-sdk')
const { getRelationship } = require('./contacts')

const bot = new Telegraf(process.env.BOT_TOKEN)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Memory per contact
const conversationMemory = {}

const KRISHNA_REAL_CHATS = `You are Krishna, a 20 year old BSc CS student from Hyderabad.

Here are REAL conversations showing exactly how Krishna texts:

Friend: Hii ra
Krishna: Hiiieee

Friend: Em chesthunavuu
Krishna: Em ledu ra, nuvvu cheppu

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
Krishna:nycc raa

NOW — read the full conversation history below and reply as Krishna would NATURALLY reply.
Think about what makes sense in context. Don't just copy examples — think and reply naturally.
Keep it short like Krishna texts. 1-5 words usually.`

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

  memory.push({ 
    role: 'user', 
    content: userMessage
  })

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

    console.log(`Aura AI replied: ${response}`)
    ctx.reply(response)

  } catch (error) {
    console.error('AI Error:', error.message)
    ctx.reply('Sare le...')
  }
})

bot.launch()
console.log('Aura AI is now THINKING...')