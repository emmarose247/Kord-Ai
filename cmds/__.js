const os = require("os")
const { changeFont } = require("../core")
const { prefix, kord, wtype, secondsToHms, config, commands } = require("../core")
const { version } = require("../package.json")


const format = (bytes) => {
  const sizes = ["B", "KB", "MB", "GB"]
  if (bytes === 0) return "0 B"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + " " + sizes[i]
}


function clockString(ms) {
  let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? "--" : Math.floor(ms % 3600000 / 60000)
  let s = isNaN(ms) ? "--" : Math.floor(ms % 60000 / 1000)
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(":")
}


const getRandomFont = () => {
  return "sansItalic"
}


kord({
  cmd: "menu|help",
  desc: "list of commands",
  react: "💬",
  fromMe: wtype,
  type: "help",
}, async (m) => {
  try {
    const types = {}
    commands.forEach(({ cmd, type }) => {
      if (!cmd) return
      const main = cmd.split("|")[0].trim()
      const cat = type || "other"
      if (!types[cat]) types[cat] = []
      types[cat].push(main)
    })


    const requestedType = m.text ? m.text.toLowerCase().trim() : null
    const availableTypes = Object.keys(types).map(t => t.toLowerCase())
    
    const more = String.fromCharCode(8206)
    const readmore = more.repeat(4001)
    
    if (requestedType && availableTypes.includes(requestedType)) {
      const actualType = Object.keys(types).find(t => t.toLowerCase() === requestedType)
      
      const at = await changeFont(actualType.toUpperCase(), "monospace")
      const cmdList = types[actualType].map(cmd => 
        `  𖢹 ${prefix}${cmd.replace(/[^a-zA-Z0-9-+]/g, "")}`
      ).join('\n')
      const formattedCmds = await changeFont(cmdList, getRandomFont())
      
      let menu = `\`\`\`
╔═══════════════════════════════════════╗
║  ✦ ⚡ ☆࿐ཽ༵༆༒ 𝑪𝒐𝒅𝒆𝒙 ༒༆࿐ཽ༵☆ ⚡ ✦
║        👑 𝑶𝒘𝒏𝒆𝒓: 𝑪𝒐𝒅𝒆𝒙 👑
╚═══════════════════════════════════════╝

  ◛ ﹏ ✧･ﾟ: *✧･ﾟ:* ⚜️ *:ﾟ✧*:ﾟ✧ ◛ ﹏

┌─⊱ 𒂝 ${actualType.toUpperCase()} 𒂝 ⊰─┐
│  𖢶 ᴄᴀᴛᴇɢᴏʀʏ : ${actualType.toUpperCase()}
│  𖢶 ᴄᴏᴜɴᴛ : ${types[actualType].length}
│  𖢶 ᴘʀᴇꜰɪx : ${prefix}
└─────────────────────┘

${readmore}
╭─━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
│   ⨻ 🜔 𝑮𝑳𝑨𝑻𝑰𝑵𝑮 𝑪𝑶𝑴𝑴𝑨𝑵𝑫𝑺 🜔 ⨻
╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

${formattedCmds}

╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
    ༺ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐂𝐨𝐝𝐞𝐱 ༻
  ◛ ᰔᩚ 𓃗 𝘗𝘦𝘢𝘬𝘊𝘢𝘪𝘱𝘐𝘯𝘵𝘦𝘯𝘴𝘦 𓃗 ᰔᩚ ◛\`\`\``
      
      return await m.reply(menu)
    }


    const allmenu = Object.keys(types).map(type => {
      const at = type.toUpperCase()
      const cmdList = types[type].map(cmd => `${prefix}${cmd}`).join(", ")
      return `┌─⊱ 𒂝 *${at}* 𒂝 ⊰─┐\n│ ${cmdList}\n└──────────┘`
    }).join("\n\n")
    const formattedAll = await changeFont(allmenu, getRandomFont())


    let uptime = clockString(process.uptime() * 1000)
    let timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })


    let menu = `\`\`\`
╔═══════════════════════════════════════╗
║  ✦ ⚡ ☆࿐ཽ༵༆༒ 𝑪𝒐𝒅𝒆𝒙 ༒༆࿐ཽ༵☆ ⚡ ✦
║        👑 𝑶𝒘𝒏𝒆𝒓: 𝘬𝘰𝘳𝘥 👑
╚═══════════════════════════════════════╝

  ◛ ﹏ ✧･ﾟ: *✧･ﾟ:* ⚜️ *:ﾟ✧*:ﾟ✧ ◛ ﹏

┌─⊱ 𒂝 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍 𒂝 ⊰─┐
│  𖢹 ᴠᴇʀsɪᴏɴ : ${version}
│  𖢹 ᴜᴘᴛɪᴍᴇ : ${uptime}
│  𖢹 ᴘʟᴀᴛꜰᴏʀᴍ : ${os.platform()}
│  𖢹 ᴍᴇᴍᴏʀʏ : ${format(os.totalmem() - os.freemem())}/${format(os.totalmem())}
│  𖢹 ᴛɪᴍᴇ : ${timestamp}
│  𖢹 ᴘʀᴇꜰɪx : ${prefix}
└──────────────────────────┘

${readmore}
╭─━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
│  ⨻ 🜔 𝐀𝐋𝐋 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐈𝐄𝐒 🜔 ⨻
╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

${Object.keys(types).map((type, i) => 
  `  𖢶 ${i + 1}. ${type.toUpperCase()} ◛ 〔${types[type].length}〕`
).join('\n')}

╭─━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
│   𓃗 𝘏𝘖𝘞 𝘛𝘖 𝘜𝘚𝘌 𝘗𝘳𝘰𝘱𝘦𝘳𝘭𝘺 𓃗
╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

  𖢹 ${prefix}menu [category]
  𖢹 ${prefix}menu media
  𖢹 ${prefix}menu help
  𖢹 𝐒𝐞𝐞 𝐚𝐥𝐥 𝐜𝐚𝐭𝐞𝐠𝐨𝐫𝐢𝐞𝐬 𝐚𝐛𝐨𝐯𝐞
  𖢹 𝐄𝐚𝐜𝐡 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐫𝐞𝐯𝐞𝐚𝐥𝐬 𝐢𝐭𝐬 𝐥𝐚𝐘𝐞𝐫

${readmore}
╭─━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
│  ⚜️ 🜔 𝐆𝐀𝐋𝐀𝐂𝐓𝐈𝐂 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 🜔 ⚜️
╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

${formattedAll}

╭─━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
│     ༺ 𝐄𝐌𝐏𝐎𝐖𝐄𝐑𝐄𝐃 ༻
│   ☆࿐ཽ༵༆༒ 𝑪𝒐𝒅𝒆𝒙 ༒༆࿐ཽ༵☆
│  ◛ ᰔᩚ 𓃗 𝘕𝘟𝘛-𝘎𝘌𝘕 𝘙𝘌𝘍𝘐𝘕𝘌𝘋 𓃗 ᰔᩚ ◛
╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\`\`\``


    await m.reply(menu)
  } catch (e) {
    console.error(e)
    await m.reply("Error generating menu")
  }
})
