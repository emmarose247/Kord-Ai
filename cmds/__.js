/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */


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
        `  ➺ ${prefix}${cmd.replace(/[^a-zA-Z0-9-+]/g, "")}`
      ).join('\n')
      const formattedCmds = await changeFont(cmdList, getRandomFont())
      
      let menu = `\`\`\`
╔═══════════════════════════╗
║  ༒ ${config().BOT_NAME} ༒  
╚═══════════════════════════╝

    ☆࿐ཽ༵༆༒ 𝑪𝒐𝒅𝒆𝒙 ༒༆࿐ཽ༵☆
        〔 𝕺𝖜𝖓𝖊𝖗 & 𝕯𝖊𝖛𝖊𝖑𝖔𝖕𝖊𝖗 〕

╭───═━┈ ⚑ ┈━═───╮
│  𖢶 Category: ${actualType.toUpperCase()}
│  𖢶 Commands: ${types[actualType].length}
│  𖢶 Prefix: ${prefix}
╰───═━┈ ◈ ┈━═───╯

${readmore}
༺═──────────────────═༻
    ⨻ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓 ⨻
༺═──────────────────═༻

${formattedCmds}

༺═──────────────────═༻
   ᰔᩚ 𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 ${config().BOT_NAME} ᰔᩚ
༺═──────────────────═༻\`\`\``
      
      return await m.reply(menu)
    }


    const allmenu = Object.keys(types).map(type => {
      const at = type.toUpperCase()
      const cmdList = types[type].map(cmd => `${prefix}${cmd}`).join(", ")
      return `╭─⚑ *${at}* ⚑─╮\n│ ${cmdList}\n╰──────────╯`
    }).join("\n\n")
    const formattedAll = await changeFont(allmenu, getRandomFont())


    let uptime = clockString(process.uptime() * 1000)
    let timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })


    let menu = `\`\`\`
╔═══════════════════════════╗
║    ༒ ${config().BOT_NAME} ༒    
╚═══════════════════════════╝

    ☆࿐ཽ༵༆༒ 𝑪𝒐𝒅𝒆𝒙 ༒༆࿐ཽ༵☆
        〔 𝕺𝖜𝖓𝖊𝖗 & 𝕯𝖊𝖛𝖊𝖑𝖔𝖕𝖊𝖗 〕

╭───═━┈ 𖢠 𝐈𝐍𝐅𝐎 𖢠 ┈━═───╮
│  𖢶 Version: ${version}
│  𖢶 Uptime: ${uptime}
│  𖢶 Platform: ${os.platform()}
│  𖢶 Memory: ${format(os.totalmem() - os.freemem())}/${format(os.totalmem())}
│  𖢶 Time: ${timestamp}
│  𖢶 Prefix: ${prefix}
╰───═━┈ ◈ ┈━═───╯

${readmore}
༺═──────────────────═༻
    ⨻ 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐈𝐄𝐒 ⨻
༺═──────────────────═༻

${Object.keys(types).map((type, i) => 
  `  ${i + 1}. ➴ ${type.toUpperCase()} 〔${types[type].length}〕`
).join('\n')}

༺═──────────────────═༻
    𓃗 𝐔𝐒𝐀𝐆𝐄 𝐆𝐔𝐈𝐃𝐄 𓃗
༺═──────────────────═༻

➺ Type: ${prefix}menu [category]
➺ Example: ${prefix}menu media
➺ View all categories above
➺ Each command shows its category

${readmore}
༺═──────────────────═༻
    ⚑ 𝐀𝐋𝐋 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 ⚑
༺═──────────────────═༻

${formattedAll}

༺═──────────────────═༻
   ᰔᩚ 𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 ${config().BOT_NAME} ᰔᩚ
   ☀︎ 𝙈𝙤𝙙𝙙𝙚𝙙 𝙗𝙮 𝘾𝙤𝙙𝙚𝙭 ☀︎
༺═──────────────────═༻\`\`\``


    await m.reply(menu)
  } catch (e) {
    console.error(e)
    await m.reply("Error generating menu")
  }
})
