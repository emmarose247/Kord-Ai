/* 
 * Copyright © 2025 Kenny
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
const { proto, generateWAMessageFromContent } = require("@whiskeysockets/baileys")

const format = (bytes) => {
  const sizes = ["B", "KB", "MB", "GB"]
  if (bytes === 0) return "0 B"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + " " + sizes[i]
}

const getRandomFont = () => "sansItalic"

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TEXT MENU BUILDERS — shared by both the button version's
//  fallback AND the plain-text version, so they never diverge.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function buildCategoryText(actualType, cmdsForType) {
  const at = await changeFont(actualType.toUpperCase(), "monospace")
  const cmdList = cmdsForType.map(cmd =>
    `│ ${prefix}${cmd.replace(/[^a-zA-Z0-9-+]/g, "")}`
  ).join("\n")
  const formattedCmds = await changeFont(cmdList, getRandomFont())

  return `\`\`\`┌────═━┈ ${config().BOT_NAME} ┈━═────┐
 ✇ ▸ Category: ${actualType.toUpperCase()}
 ✇ ▸ Commands: ${cmdsForType.length}
 ✇ ▸ Prefix: ${prefix}
└──────═━┈┈━═──────┘\`\`\`

     ┏ ${at} ┓ 
┍   ─┉─ • ─┉─    ┑ 
${formattedCmds}
┕    ─┉─ • ─┉─   ┙ 

Tip: Use ${prefix}menu to see all categories`
}

async function buildMainText(m, types) {
  const uptime = await secondsToHms(process.uptime())
  const memoryUsage = format(os.totalmem() - os.freemem())

  let menu = `\`\`\`┌────═━┈ ${config().BOT_NAME} ┈━═────┐
 ✇ ▸ Owner: ${config().OWNER_NAME}
 ✇ ▸ User: ${m.pushName}
 ✇ ▸ Plugins: ${commands.length}
 ✇ ▸ Uptime: ${uptime}
 ✇ ▸ Memory: ${memoryUsage}
 ✇ ▸ Version: v${version}
 ✇ ▸ Platform: ${m.client.platform()}
└───────═━┈┈━═──────┘\`\`\`

`

  const categoryList = await Promise.all(Object.keys(types).map(async (type) => {
    const cmdList = types[type].map(cmd =>
      `│ ${prefix}${cmd.replace(/[^a-zA-Z0-9-+]/g, "")}`
    ).join("\n")
    const formattedCmds = await changeFont(cmdList, getRandomFont())
    const tty = await changeFont(type.toUpperCase(), "monospace")

    return ` ┏ ${tty} ┓
┍   ─┉─ • ─┉─    ┑ 
${formattedCmds}
┕    ─┉─ • ─┉─   ┙ `
  }))

  menu += categoryList.join("\n\n")
  menu += `\n\nTip: Use ${prefix}menu [category] for specific commands`
  return menu.trim()
}

async function sendPlainMenu(m, text) {
  try {
    if (config().MENU_IMAGE) {
      return await m.send(config().MENU_IMAGE, { caption: text }, "image")
    }
  } catch (e) {
    console.log("menu image send failed, sending text instead", e)
  }
  return await m.send(text)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INTERACTIVE (BUTTON) MENU — with a hard guarantee that
//  ANY failure falls back to the plain text menu. Every step
//  that can throw is wrapped; nothing here can result in
//  total silence.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const buildMenuButtons = (types) => {
  const buttons = Object.keys(types).map(cat => ({
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: `${cat.toUpperCase()} (${types[cat].length})`,
      id: `${prefix}menu ${cat}`,
    }),
  }))

  buttons.push({
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "Refresh",
      id: `${prefix}menu`,
    }),
  })

  return buttons
}

const buildCategoryButtons = () => [
  {
    name: "quick_reply",
    buttonParamsJson: JSON.stringify({
      display_text: "Back to modules",
      id: `${prefix}menu`,
    }),
  },
]

async function sendInteractive(m, { title, body, footer, buttons }) {
  const msg = generateWAMessageFromContent(
    m.chat,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({ text: body }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: footer || "" }),
            header: proto.Message.InteractiveMessage.Header.create({
              title,
              hasMediaAttachment: false,
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons,
            }),
          }),
        },
      },
    },
    { quoted: m.data || undefined }
  )

  // relayMessage can reject asynchronously — awaited explicitly here so
  // the caller's try/catch actually sees the failure instead of it
  // becoming an unhandled rejection that looks like "no response at all".
  await m.client.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
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

    // ── CATEGORY VIEW ─────────────────────────────────────────────
    if (requestedType && availableTypes.includes(requestedType)) {
      const actualType = Object.keys(types).find(t => t.toLowerCase() === requestedType)
      const cmdsForType = types[actualType]
      const fallbackText = await buildCategoryText(actualType, cmdsForType)

      try {
        const cmdListPlain = cmdsForType.map((cmd, i) => {
          const c = cmd.replace(/[^a-zA-Z0-9-+]/g, "")
          return `${String(i + 1).padStart(2, "0")}  ${prefix}${c}`
        }).join("\n")

        await sendInteractive(m, {
          title: actualType.toUpperCase(),
          body: cmdListPlain,
          footer: `${cmdsForType.length} commands - prefix ${prefix}`,
          buttons: buildCategoryButtons(),
        })
        return
      } catch (e) {
        console.log("interactive category menu failed, falling back to text", e)
        return await sendPlainMenu(m, fallbackText)
      }
    }

    // ── MAIN MENU ─────────────────────────────────────────────────
    const fallbackText = await buildMainText(m, types)

    try {
      let platform = "unknown"
      try { platform = m.client.platform() } catch (_) {}

      const uptime = await secondsToHms(process.uptime())
      const totalMem = os.totalmem()
      const usedMem = totalMem - os.freemem()

      const body = [
        `${config().OWNER_NAME}'s ${config().BOT_NAME}`,
        ``,
        `User     : ${m.pushName}`,
        `Uptime   : ${uptime}`,
        `Memory   : ${format(usedMem)}`,
        `Version  : v${version}`,
        `Platform : ${platform}`,
        `Commands : ${commands.length} loaded`,
      ].join("\n")

      await sendInteractive(m, {
        title: config().BOT_NAME || "MENU",
        body,
        footer: `Tap a module to view its commands - prefix ${prefix}`,
        buttons: buildMenuButtons(types),
      })
      return
    } catch (e) {
      console.log("interactive main menu failed, falling back to text", e)
      return await sendPlainMenu(m, fallbackText)
    }

  } catch (e) {
    console.log("menu cmd error", e)
    try {
      if (m.ownerJid) {
        await m.client.sendMessage(m.ownerJid, {
          text: `⚠️ Menu command error\nChat: ${m.chat}\n${e?.message || e}`,
        })
      }
    } catch (_) {}
    return await m.sendErr(e)
  }
})
