/* 
 * Copyright © 2025 Kenny
 * This file is part of Kord and is licensed under the GNU GPLv3.
 */

const os = require("os")
const { prefix, kord, wtype, secondsToHms, config, commands } = require("../core")
const { version } = require("../package.json")

const fmt = (bytes) => {
  const sizes = ["B", "KB", "MB", "GB"]
  if (bytes === 0) return "0 B"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + " " + sizes[i]
}

const bar = (ratio, w = 10) => {
  const f = Math.min(Math.round(ratio * w), w)
  return "█".repeat(f) + "░".repeat(w - f)
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 5)  return "🌙 Up late?"
  if (h < 12) return "🌤 Good Morning"
  if (h < 17) return "☀️ Good Afternoon"
  if (h < 21) return "🌆 Good Evening"
  return "🌙 Good Night"
}

const getRamadanCountdown = () => {
  const now = new Date()
  const year = now.getFullYear()
  const ramadanDates = {
    2025: { start: new Date("2025-03-01"), end: new Date("2025-03-30") },
    2026: { start: new Date("2026-02-17"), end: new Date("2026-03-19") },
    2027: { start: new Date("2027-02-06"), end: new Date("2027-03-07") },
    2028: { start: new Date("2028-01-27"), end: new Date("2028-02-25") },
  }
  const ramadan = ramadanDates[year]
  if (!ramadan) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(ramadan.start); start.setHours(0,0,0,0)
  const end   = new Date(ramadan.end);   end.setHours(0,0,0,0)
  const msDay = 86400000
  if (today >= start && today <= end) {
    const dayIn    = Math.floor((today - start) / msDay) + 1
    const daysLeft = Math.floor((end - today) / msDay)
    return `🌙 Ramadan Day ${dayIn} • ${daysLeft}d left — Mubarak! 🤲`
  }
  if (today < start) {
    const daysUntil = Math.floor((start - today) / msDay)
    return `🌙 Ramadan in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}!`
  }
  return null
}

const getSpecialEvent = () => {
  const now = new Date()
  const mo = now.getMonth() + 1
  const d  = now.getDate()
  const ramadan = getRamadanCountdown()
  if (ramadan)              return ramadan
  if (mo===1  && d===1)    return "🎊 Happy New Year!"
  if (mo===2  && d===14)   return "💝 Happy Valentine's Day!"
  if (mo===3  && d===8)    return "💜 Happy Int'l Women's Day!"
  if (mo===4  && d===1)    return "😂 April Fools! Stay sharp."
  if (mo===4  && d===22)   return "🌍 Happy Earth Day!"
  if (mo===5  && d===1)    return "✊ Happy Workers' Day!"
  if (mo===6  && d===1)    return "👶 Happy Int'l Children's Day!"
  if (mo===6  && d===16)   return "🇳🇬 Happy Nigerian Children's Day!"
  if (mo===8  && d===12)   return "🌟 Happy Int'l Youth Day!"
  if (mo===10 && d===1)    return "🇳🇬 Happy Independence Day!"
  if (mo===10 && d===31)   return "🎃 Happy Halloween!"
  if (mo===12 && d===25)   return "🎄 Merry Christmas!"
  if (mo===12 && d===26)   return "🎁 Happy Boxing Day!"
  if (mo===12 && d===31)   return "🥂 New Year's Eve!"
  return null
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
      const cat  = type || "other"
      if (!types[cat]) types[cat] = []
      types[cat].push(main)
    })

    const requestedType  = m.text?.toLowerCase().trim() ?? null
    const availableTypes = Object.keys(types).map(t => t.toLowerCase())
    const ghost          = String.fromCharCode(8206).repeat(4001)

    const LINE = "━".repeat(26)       // outer border fill
    const DIV  = "  " + "─".repeat(24) // inner section divider

    // ── CATEGORY VIEW ─────────────────────────────────────────────
    if (requestedType && availableTypes.includes(requestedType)) {
      const key  = Object.keys(types).find(t => t.toLowerCase() === requestedType)
      const cmds = types[key]

      const cmdList = cmds.map((cmd, i) => {
        const c = cmd.replace(/[^a-zA-Z0-9-+]/g, "")
        return `  ${String(i + 1).padStart(2, "0")}  ▸  ${prefix}${c}`
      }).join("\n")

      const header = `\`\`\`◤${LINE}◥
  ⬡  MODULE  :  ${key.toUpperCase()}
  ⬡  CMDS    :  ${cmds.length} commands
  ⬡  PREFIX  :  ${prefix}
◣${LINE}◢\`\`\``

      const body = `\`\`\`${cmdList}

  ❯  .menu  ← back to modules
◣${LINE}◢\`\`\``

      return m.send(`${header}\n${ghost}\n${body}`)
    }

    // ── MAIN MENU ─────────────────────────────────────────────────
    const uptime   = await secondsToHms(process.uptime())
    const totalMem = os.totalmem()
    const usedMem  = totalMem - os.freemem()
    const cpuCount = os.cpus()?.length || 1
    const cpuLoad  = Math.min((os.loadavg()[0] || 0) / cpuCount, 1)
    const memPct   = Math.round(usedMem / totalMem * 100)
    const cpuPct   = Math.round(cpuLoad * 100)

    const greeting = getGreeting()
    const special  = getSpecialEvent()
    const eventLine = special ? `\n_✦ ${special}_` : ""

    const pad = (s, n = 10) => s.padEnd(n)

    let platform = "unknown"
    try { platform = m.client.platform() } catch {}

    const catLines = Object.keys(types).map(cat => {
      const count = String(types[cat].length).padStart(2)
      return `  ⬡  ${cat.toUpperCase().padEnd(12)} [${count}]`
    }).join("\n")

    const menu = [
      `\`\`\`◤${LINE}◥`,
      `  ⊸ ${greeting},  ${m.pushName}`,
      `◣${LINE}◢`,
      ``,
      `  ${pad("OWNER")}  ${config().OWNER_NAME}`,
      `  ${pad("UPTIME")}  ${uptime}`,
      `  ${pad("MEMORY")}  ${bar(usedMem / totalMem)} ${memPct}%`,
      `  ${pad("CPU")}  ${bar(cpuLoad)} ${cpuPct}%`,
      `  ${pad("VERSION")}  v${version}`,
      `  ${pad("PLATFORM")}  ${platform}`,
      `  ${pad("CMDS")}  ${commands.length} loaded`,
      DIV,
      `  ⬡ MODULES`,
      DIV,
      catLines,
      DIV,
      `  ❯  .menu [module name]`,
      `◣${LINE}◢\`\`\``,
    ].join("\n") + eventLine

    try {
      if (config().MENU_IMAGE)
        return m.send(config().MENU_IMAGE, { caption: menu }, "image")
    } catch {}

    return m.send(menu)

  } catch (e) {
    console.log("menu error", e)
    return m.sendErr(e)
  }
})
