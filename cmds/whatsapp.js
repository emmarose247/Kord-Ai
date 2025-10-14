/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */
 
 
 const { kord, wtype, isAdmin, isadminn, saveFilter, listFilters, removeFilter, prefix, getData, storeData, isBotAdmin} = require("../core")

kord({
  cmd: "delete|del|dlt",
  desc: "delete a replied message",
  fromMe: wtype,
  type: "user",
}, async (m, text) => {
  try {
    if (!m.quoted) return await m.send("_Reply to a message to delete_")
    
    if (m.isGroup) {
    if (m.quoted.fromMe && m.isCreator) {
    await m.send(m.quoted, {}, "delete")
    return await m.send(m, {}, "delete")
    }
    
    let ad = await isAdmin(m)
    let botAd = await isBotAdmin(m)
    if (!botAd) return await m.send("_I'm not admin.._")
    if (!ad) return await m.send("_You're not admin.._")
    
    await m.send(m.quoted, {}, "delete")
    return await m.send(m, {}, "delete")
    }
    
    if (!m.isCreator) return await m.send("_I don't know you.._")
    await m.send(m.quoted, {}, "delete")
    if (m.fromMe) {
    return await m.send(m, {}, "delete")
    } else return
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})


kord({
        cmd: "archive",
        desc: "archive a chat",
        fromMe: true,
        type: "user",
}, async (m, text) => {
  try {
    const lmsg = {
    message: m.message,
    key: m.key,
    messageTimestamp: m.timestamp };
    await m.client.chatModify({
    archive: true,
    lastMessages: [lmsg]
    }, m.chat);
    return await m.send('_chat archived_')
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "unarchive",
        desc: "unarchive a chat",
        fromMe: true,
        type: "user",
}, async (m, text) => {
  try {
    const lmsg = {
    message: m.message,
    key: m.key,
    messageTimestamp: m.timestamp };
    await m.client.chatModify({
    archive: false,
    lastMessages: [lmsg]
    }, m.chat);
    return await m.send('_chat unarchived_')
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})


kord({
        cmd: "jid",
        desc: "gets jid of either replied user or present chat",
        fromMe: wtype,
        type: "user",
}, async (m) => {
  try {
    if (m.quoted.sender) return await m.send(m.quoted.sender);
    else return await m.send(m.chat);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "pp|setpp",
        desc: "changes profile pic to replied photo",
        fromMe: true,
        type: "user",
}, async (m, text) => {
  try {
    if (!m.quoted.image && !m.image) return await m.send("_reply to a picture_")
    if (m.quoted.image) {
    var picpath = await m.quoted.download()
    } else {
    picpath = await m.client.downloadMediaMessage(m)
    }
    await m.client.updateProfilePicture(m.user.jid, picpath);
    return await m.send("_profile pic changed_")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "removepp",
        desc: "removes profile picture",
        fromMe: true,
        type: "user",
}, async (m, text) => {
  try {
    await m.client.removeProfilePicture(m.user.jid);
    return await m.send("_profile pic removed.._");
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "clear",
        desc: "clear a chat",
        fromMe: true,
        type: "user",
}, async (m, text) => {
  try {
    await m.client.chatModify({
    delete: true,
    lastMessages: [{
    key: m.key,
    messageTimestamp: m.messageTimestamp
    }]
    }, m.chat)
    await m.send('_Chat Cleared_')
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "pinchat|chatpin",
        desc: "pin a chat",
        fromMe: true,
        type: "user"
}, async (m, text) => {
  try {
    await m.client.chatModify({
    pin: true
    }, m.chat);
    await m.send('_Chat Pined_')
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "unpinchat|unchatpin",
        desc: "unpin a chat",
        fromMe: true,
        type: "user"
}, async (m, text) => {
  try {
    await m.client.chatModify({
    pin: false
    }, m.chat);
    await m.send('_Chat Unpined_')
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "block",
        desc: 'block a user',
        fromMe: true,
        type: 'user',
}, async (m, text) => {
  try {
    if (m.isGroup && m.quoted?.sender) {
    await m.client.updateBlockStatus(m.quoted?.sender, "block")
    } else {
    await m.client.updateBlockStatus(m.chat, "block")
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "unblock",
        desc: 'unblock a user',
        fromMe: true,
        type: 'user',
}, async (m, text) => {
  try {
    if (m.isGroup && m.quoted?.sender) {
    await m.client.updateBlockStatus(m.quoted?.sender, "unblock")
    } else {
    await m.client.updateBlockStatus(m.chat, "unblock")
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "blocklist",
        desc: "fetches list of blocked numbers",
        fromMe: true,
        type: 'user',
}, async (m, text) => {
  try {
    const num = await m.client.fetchBlocklist();
    if (!num?.length) return await m.send("_No blocked users found!_");
    const blockList = `_*❏ Block List ❏*_\n\n${num.map(n => `➟ +${n.replace('@s.whatsapp.net', '')}`).join('\n')}`;
    return await m.send(blockList);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "setname",
        desc: "set profile name",
        fromMe: true,
        type: "user",
}, async (m, text) => {
  try {
    q = text
    if (!q) return await m.send(`_*provide a name to set!*_\n_Example: ${prefix}setname Mirage_`);
    await m.client.updateProfileName(q);
    await m.reply(`_Profile name updated to ${q}_`);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
        cmd: "bio|setbio",
        desc: "set bio for profile",
        fromMe: true,
        type: "user",
}, async (m, text) => {
  try {
    let query = text
    if (!query) return await m.send(`*_Provide A Text*_\n_example: ${prefix}setbio urgent calls only._`);
    await m.client.updateProfileStatus(query);
    await m.send('_Bio updated_');
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "getpp",
  desc: "get profile pic of a user/group",
  fromMe: true,
  type: "user",
}, async (m, text) => {
  try {
    if (m.isGroup && !m.quoted.sender) {
    var pic = await m.client.profilePictureUrl(m.chat, 'image')
    return await m.send(pic, {}, "image")
    } else if (m.isGroup && m.quoted.sender) {
    var pic = await m.client.profilePictureUrl(m.quoted.sender, 'image')
    return await m.send(pic, {}, "image")
    } else if (m.quoted.sender) {
    var pic = await m.client.profilePictureUrl(m.quoted.sender, 'image')
    return await m.send(pic, {}, "image")
    } else {
    var pic = await m.client.profilePictureUrl(m.chat, 'image')
    return await m.send(pic, {}, "image")
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})


kord({
        cmd: "forward|fwrd",
        desc: "forward a message",
        fromMe: true,
        type: "user",
}, async (m, text, cmd, store) => {
  try {
    if (!m.quoted) return await m.send("_reply to the msg you want to forward.._")
    if (!text) return await m.send(`_*Provide a number/jid!*_\n_example ${cmd} 2348033221144_\n_${cmd} 2348033221144@s.whatsapp.net_\n\nuse ${prefix}jid to get the jid of a chat`)
    let jidd
    if (text.includes("@g.us") || text.includes("@s.whatsapp.net") || text.includes("newsletter")) {
    jidd = text;
    } else {
    jidd = `${text}@s.whatsapp.net`;
    }
    await m.forwardMessage(jidd, await store.loadMessage(m.chat, m.quoted))
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: 'lastseen',
	fromMe: true,
	desc: 'to change lastseen privacy',
	type: 'privacy'
}, async (message, match, cmd) => {
  try {
    if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change last seen privacy settings_`);
    const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
    if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
    await message.client.updateLastSeenPrivacy(match)
    await message.send(`_Privacy settings *last seen* Updated to *${match}*_`);
  } catch (e) {
    console.log("cmd error", e)
    return await message.sendErr(e)
  }
})
kord({
cmd: 'online',
	fromMe: true,
	desc: 'to change online privacy',
	type: 'privacy'
}, async (message, match, cmd) => {
  try {
    if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change *online*  privacy settings_`);
    const available_privacy = ['all', 'match_last_seen'];
    if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
    await message.client.updateOnlinePrivacy(match)
    await message.send(`_Privacy Updated to *${match}*_`);
  } catch (e) {
    console.log("cmd error", e)
    return await message.sendErr(e)
  }
})
kord({
cmd: 'mypp',
	fromMe: true,
	desc: 'privacy setting profile picture',
	type: 'privacy'
}, async (message, match, cmd) => {
  try {
    if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change *profile picture*  privacy settings_`);
    const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
    if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
    await message.client.updateProfilePicturePrivacy(match)
    await message.send(`_Privacy Updated to *${match}*_`);
  } catch (e) {
    console.log("cmd error", e)
    return await message.sendErr(e)
  }
})
kord({
cmd: 'mystatus',
	fromMe: true,
	desc: 'privacy for my status',
	type: 'privacy'
}, async (message, match, cmd) => {
  try {
    if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change *status*  privacy settings_`);
    const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
    if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
    await message.client.updateStatusPrivacy(match)
    await message.send(`_Privacy Updated to *${match}*_`);
  } catch (e) {
    console.log("cmd error", e)
    return await message.sendErr(e)
  }
})
kord({
cmd: 'read',
	fromMe: true,
	desc: 'privacy for read message',
	type: 'privacy'
}, async (message, match, cmd) => {
  try {
    if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change *read and receipts message*  privacy settings_`);
    const available_privacy = ['all', 'none'];
    if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
    await message.client.updateReadReceiptsPrivacy(match)
    await message.send(`_Privacy Updated to *${match}*_`);
  } catch (e) {
    console.log("cmd error", e)
    return await message.sendErr(e)
  }
})
kord({
cmd: 'allow-gcadd|groupadd',
	fromMe: true,
	desc: 'privacy for group add',
	type: 'privacy'
}, async (message, match, cmd) => {
  try {
    if (!match) return await message.send(`_*Example:-* ${cmd} all_\n_to change *group add*  privacy settings_`);
    const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
    if (!available_privacy.includes(match)) return await message.send(`_action must be *${available_privacy.join('/')}* values_`);
    await message.client.updateGroupsAddPrivacy(match)
    await message.send(`_Privacy Updated to *${match}*_`);
  } catch (e) {
    console.log("cmd error", e)
    return await message.sendErr(e)
  }
})



kord({
  cmd: "pfilter",
  desc: "Set a PM filter",
  fromMe: true,
  pm: true,
  type: "autoreply",
}, async (m, text) => {
  try {
    if (text.toLowerCase() === "list") return await listFilters(m, "pfilter")
    await saveFilter(m, text, "pfilter")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "pstop",
  desc: "Remove a PM filter",
  fromMe: true,
  pm: true,
  type: "autoreply",
}, async (m, text) => {
  try {
    if (!text) return await m.send("Specify a keyword to remove")
    await removeFilter(m, text, "pfilter")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "gfilter",
  desc: "Set a group filter",
  fromMe: true,
  type: "autoreply",
  gc: true,
  adminOnly: true,
}, async (m, text) => {
  try {
    if (text.toLowerCase() === "list") return await listFilters(m, "gfilter")
    await saveFilter(m, text, "gfilter")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "gstop",
  desc: "Remove a group filter",
  fromMe: true,
  type: "autoreply",
  gc: true,
  adminOnly: true,
}, async (m, text) => {
  try {
    if (!text) return await m.send("Specify a keyword to remove")
    await removeFilter(m, text, "gfilter")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  on: "text",
  fromMe: false,
}, async (m) => {
  try {
    if (m.sender === m.ownerJid) return

    if (!m.isGroup) {
      let global = await getData("pfilter") || {}
      let gmatch = global["pm"]?.[m.body?.toLowerCase()]
      if (gmatch) {
        if (gmatch.type && gmatch.file) {
          let buff = Buffer.from(gmatch.file, "base64")
          return await m.send(buff, { caption: gmatch.caption, mimetype: gmatch.mimetype }, gmatch.type.replace("Message", ""))
        } else {
          return await m.send(gmatch.msg)
        }
      }
      return
    }

    let local = await getData("gfilter") || {}
    let res = local[m.chat]?.[m.body?.toLowerCase()]
    if (res) {
      if (res.type && res.file) {
        let buff = Buffer.from(res.file, "base64")
        return await m.send(buff, { caption: res.caption, mimetype: res.mimetype }, res.type.replace("Message", ""))
      } else {
        return await m.send(res.msg)
      }
    }
  } catch (e) {
    console.log("listener error", e)
  }
})

kord({
  cmd: "mute-user",
  desc: "mute a user or a sticker",
  fromMe: true,
  type: "bot",
  gc: true,
  adminOnly: true,
}, async (m, text) => {
  var botAd = await isBotAdmin(m)
  if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_")

  var _b = await getData("blacklisted") || {}
  if (!_b[m.chat]) _b[m.chat] = { users: [], stk: [] }

  let bl = _b[m.chat]

  if (text.includes("-s")) {
    if (!m.quoted.sticker) return await m.send("_reply to the sticker to mute_")
    var hash = m.quoted.fileSha256 ? Buffer.from(m.quoted.fileSha256).toString('hex') : null
    if (bl.stk.includes(hash)) return await m.send("_sticker is already muted_")
    bl.stk.push(hash)
    await storeData("blacklisted", _b)
    return await m.send("_sticker muted_")
  }

  let input = m.mentionedJid?.[0] || m.quoted?.sender || text
  if (!input) return await m.send('need user...')
  let user = (input.includes('@') ? input.split('@')[0] : input).replace(/\D/g, '') + '@s.whatsapp.net'
  if (await isadminn(m, user)) return await m.send("User is an admin")
  if (bl.users.includes(user)) return await m.send("_User is already muted_")
  bl.users.push(user)
  await storeData("blacklisted", _b)
  return await m.send(`@${user.split("@")[0]} has been muted`, { mentions: [user] })
})


kord({
  cmd: "unmute-user",
  desc: "unmute a user or sticker",
  fromMe: true,
  type: "bot",
  gc: true,
  adminOnly: true,
}, async (m, text) => {
  var botAd = await isBotAdmin(m)
  if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_")

  var _b = await getData("blacklisted") || {}
  if (!_b[m.chat]) return await m.send("_no one muted here_")

  let bl = _b[m.chat]

  if (text.includes("-s")) {
    if (!m.quoted.sticker) return await m.send("_reply to the sticker to unmute_")
    var hash = m.quoted.fileSha256 ? Buffer.from(m.quoted.fileSha256).toString('hex') : null
    if (!bl.stk.includes(hash)) return await m.send("_sticker is not muted_")
    bl.stk = bl.stk.filter(h => h !== hash)
    await storeData("blacklisted", _b)
    return await m.send("_sticker unmuted_")
  }

  let input = m.mentionedJid?.[0] || m.quoted?.sender || text
  if (!input) return await m.send('need user...')
  let user = (input.includes('@') ? input.split('@')[0] : input).replace(/\D/g, '') + '@s.whatsapp.net'
  if (await isadminn(m, user)) return await m.send("User is an admin")
  if (!bl.users.includes(user)) return await m.send("_User is not muted_")
  bl.users = bl.users.filter(u => u !== user)
  await storeData("blacklisted", _b)
  return await m.send(`@${user.split("@")[0]} has been unmuted`, { mentions: [user] })
})


kord({
  on: "all",
  fromMe: false
}, async (m) => {
  if (!m.isGroup) return

  var botAd = await isBotAdmin(m)
  if (!botAd) return

  var data = await getData("blacklisted")
  if (!data || !data[m.chat]) return

  var bl = data[m.chat]

  if (bl.users.includes(m.sender)) {
    return await m.send(m, {}, "delete")
  }

  if (m.mtype === "stickerMessage" && m.msg?.fileSha256) {
    const hash = Buffer.from(m.msg.fileSha256).toString("hex")
    if (bl.stk.includes(hash)) return await m.send(m, {}, "delete")
  }
})




































kord({
  cmd: "status|poststatus",
  desc: "post media to your WhatsApp status",
  fromMe: true,
  type: "status",
}, async (m, text) => {
  try {
    if (!m.quoted?.image && !m.quoted?.video && !m.image && !m.video) {
      return await m.send("_Reply to image/video to post on status_")
    }

    let mediaPath;
    if (m.quoted?.image || m.quoted?.video) {
      mediaPath = await m.quoted.download()
    } else {
      mediaPath = await m.client.downloadMediaMessage(m)
    }

    const caption = text || "_"
    const statusJid = m.user.jid.replace('@s.whatsapp.net', '@status.broadcast')

    await m.client.sendMessage(statusJid, {
      image: m.quoted?.image || m.image ? mediaPath : undefined,
      video: m.quoted?.video || m.video ? mediaPath : undefined,
      caption: caption,
      statusJid: m.user.jid
    })

    return await m.send("_✓ Posted to status_")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "statustext",
  desc: "post text-only status",
  fromMe: true,
  type: "status",
}, async (m, text) => {
  try {
    if (!text) return await m.send(`_Example: ${prefix}statustext Your awesome text_`)

    const statusJid = m.user.jid.replace('@s.whatsapp.net', '@status.broadcast')

    await m.client.sendMessage(statusJid, {
      text: text,
      statusJid: m.user.jid
    })

    return await m.send("_✓ Text status posted_")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "schedule",
  desc: "schedule a message to be sent later",
  fromMe: true,
  type: "scheduler",
}, async (m, text) => {
  try {
    if (!text) {
      return await m.send(`_Usage: ${prefix}schedule <time_in_minutes> <number/jid> <message>_\n_Example: ${prefix}schedule 30 2348033221144 Hello at 30 mins_`)
    }

    let parts = text.split("|")
    if (parts.length < 3) {
      return await m.send(`_Format: ${prefix}schedule <minutes>|<jid>|<message>_`)
    }

    let delayMinutes = parseInt(parts[0].trim())
    let target = parts[1].trim()
    let msg = parts[2].trim()

    if (isNaN(delayMinutes) || delayMinutes < 1) {
      return await m.send("_Invalid time. Use minutes (minimum 1)_")
    }

    let jid = target.includes("@") ? target : `${target}@s.whatsapp.net`

    let schedules = await getData("schedules") || {}
    let id = Date.now().toString()

    schedules[id] = {
      jid: jid,
      message: msg,
      time: Date.now() + (delayMinutes * 60 * 1000),
      sent: false
    }

    await storeData("schedules", schedules)
    return await m.send(`_✓ Message scheduled for ${delayMinutes} minutes from now_`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "schedules",
  desc: "view all scheduled messages",
  fromMe: true,
  type: "scheduler",
}, async (m, text) => {
  try {
    let schedules = await getData("schedules") || {}
    let list = Object.entries(schedules).filter(([_, v]) => !v.sent)

    if (list.length === 0) {
      return await m.send("_No scheduled messages_")
    }

    let msg = "_*❏ Scheduled Messages ❏*_\n\n"
    list.forEach(([id, sched], idx) => {
      let timeLeft = Math.ceil((sched.time - Date.now()) / 60000)
      msg += `${idx + 1}. *To:* ${sched.jid}\n*In:* ${timeLeft}min\n*Msg:* ${sched.message.substring(0, 30)}...\n\n`
    })

    return await m.send(msg)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "delschedule|cancelschedule",
  desc: "delete a scheduled message by index",
  fromMe: true,
  type: "scheduler",
}, async (m, text) => {
  try {
    if (!text) return await m.send(`_Example: ${prefix}delschedule 1_`)

    let schedules = await getData("schedules") || {}
    let list = Object.entries(schedules).filter(([_, v]) => !v.sent)
    let idx = parseInt(text) - 1

    if (isNaN(idx) || idx < 0 || idx >= list.length) {
      return await m.send("_Invalid index_")
    }

    delete schedules[list[idx][0]]
    await storeData("schedules", schedules)
    return await m.send("_✓ Schedule deleted_")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "broadcast",
  desc: "send message to multiple chats",
  fromMe: true,
  type: "messaging",
}, async (m, text) => {
  try {
    if (!text) {
      return await m.send(`_Usage: ${prefix}broadcast <jid1,jid2,jid3> | <message>_\n_Use commas to separate jids_`)
    }

    let parts = text.split("|")
    if (parts.length < 2) {
      return await m.send("_Format: jids | message_")
    }

    let jids = parts[0].split(",").map(j => j.trim())
    let msg = parts[1].trim()

    let success = 0
    for (let jid of jids) {
      let target = jid.includes("@") ? jid : `${jid}@s.whatsapp.net`
      try {
        await m.client.sendMessage(target, { text: msg })
        success++
      } catch (err) {
        console.log("broadcast error for", target)
      }
    }

    return await m.send(`_✓ Message sent to ${success}/${jids.length} chats_`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})







kord({
  cmd: "userinfo|info",
  desc: "get user information",
  fromMe: true,
  type: "user",
}, async (m, text) => {
  try {
    let jid = m.quoted?.sender || m.chat
    if (text) {
      jid = text.includes("@") ? text : `${text.replace(/\D/g, '')}@s.whatsapp.net`
    }

    const status = await m.client.fetchStatus(jid)
    const profile = await m.client.profilePictureUrl(jid, "image").catch(() => null)

    let info = `_*❏ User Info ❏*_\n\n`
    info += `*JID:* ${jid}\n`
    info += `*Status:* ${status?.status || 'No status'}\n`
    info += `*Profile Pic:* ${profile ? 'Available' : 'None'}\n`

    return await m.send(info)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

// Scheduler execution loop
setInterval(async () => {
  try {
    let schedules = await getData("schedules") || {}

    for (let [id, sched] of Object.entries(schedules)) {
      if (!sched.sent && Date.now() >= sched.time) {
        try {
          await m.client.sendMessage(sched.jid, { text: sched.message })
          sched.sent = true
          await storeData("schedules", schedules)
          console.log("Scheduled message sent to", sched.jid)
        } catch (err) {
          console.log("Error sending scheduled message", err)
        }
      }
    }
  } catch (e) {
    console.log("Scheduler error", e)
  }
}, 30000)
