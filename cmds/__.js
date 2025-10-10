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
        `┃ ༺ ${prefix}${cmd.replace(/[^a-zA-Z0-9-+]/g, "")}`
      ).join('\n')
      const formattedCmds = await changeFont(cmdList, getRandomFont())
      
      let menu = `
╔═══════⊰ 𖢶 ⊱═══════╗
     ༒ ${config().BOT_NAME} ༒
╚═══════⊰ 𖢶 ⊱═══════╝

    ◈━━━━━━━━━━━◈
    ┊ 𖢠 Category: ${actualType.toUpperCase()}
    ┊ 𖢠 Commands: ${types[actualType].length}
    ┊ 𖢠 Prefix: ${prefix}
    ◈━━━━━━━━━━━◈

${formattedCmds}

   ༺═────────────═༻
   ☆࿐ཽ༵༆༒ 𝑪𝒐𝒅𝒆𝒙 ༒༆࿐ཽ༵☆
   ༺═────────────═༻`
      
      return await m.send(menu)
    }

    const time = new Date()
    const hours = time.getHours()
    let greeting = hours < 12 ? "𝑮𝒐𝒐𝒅 𝑴𝒐𝒓𝒏𝒊𝒏𝒈 ☀︎" : 
                   hours < 18 ? "𝑮𝒐𝒐𝒅 𝑨𝒇𝒕𝒆𝒓𝒏𝒐𝒐𝒏 ☮︎︎" : 
                   "𝑮𝒐𝒐𝒅 𝑬𝒗𝒆𝒏𝒊𝒏𝒈 ༺༻"
    
    const totalMem = format(os.totalmem())
    const usedMem = format(os.totalmem() - os.freemem())
    const runtime = clockString(process.uptime() * 1000)
    
    let categories = Object.keys(types).map((type, i) => 
      `┃ ◈ ➺ ${String(i + 1).padStart(2, '0')} ❯ ${type.toUpperCase()} (${types[type].length})`
    ).join('\n')

    let mainMenu = `
╔═══════⊰ 𖢶 𖢹 𖢶 ⊱═══════╗
      ༒ ${config().BOT_NAME} ༒
╚═══════⊰ 𖢶 𖢹 𖢶 ⊱═══════╝

┊ ┊ ┊ ┊ ┊ ⋆｡ ❀⋆｡ ☪︎⋆
┊ ┊ ✫ ˚ᰔᩚ ⋆｡ ✧
⊹ ☪︎⋆ *${greeting}* 
┊ ⏰ *${time.toLocaleTimeString()}*
✧ 

${readmore}

╭━━━⊰ 𖠋 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎 𖠋 ⊱━━━╮
┃
┃ ⨻  *Runtime:* ${runtime}
┃ ⨻  *Memory:* ${usedMem} / ${totalMem}
┃ ⨻  *Version:* ${version}
┃ ⨻  *Owner:* ☆࿐ཽ༵༆༒ 𝑪𝒐𝒅𝒆𝒙 ༒༆࿐ཽ༵☆
┃ ⨻  *Prefix:* ${prefix}
┃
╰━━━━━━━━━━━━━━━━━━━╯

╭━━⊰ ⚑ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐈𝐄𝐒 ⚑ ⊱━━╮
┃
${categories}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

   ༺═──────────────═༻
   𒂝 Type *${prefix}menu <category>*
   𒂝 Example: *${prefix}menu main*
   ༺═──────────────═༻

╔═══════════════════╗
  ༒ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐂𝐨𝐝𝐞𝐱 ༒
╚═══════════════════╝`

    return await m.send(mainMenu)

  } catch (error) {
    console.error("Menu error:", error)
    await m.send("⚠️ Error loading menu. Please try again.")
  }
})
