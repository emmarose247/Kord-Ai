/* 
 * Copyright © 2025 Mirage
 * This file is part of Kord and is licensed under the GNU GPLv3.
 * And I hope you know what you're doing here.
 * You may not use this file except in compliance with the License.
 * See the LICENSE file or https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const {
  kord,
  wtype,
  extractUrlsFromString,
  isAdmin,
  isadminn,
  isBotAdmin,
  getData,
  storeData,
  parsedJid,
  lidToJid,
  sleep,
  prefix,
  getMeta,
  isUrl,
  config
} = require("../core")
const { warn } = require("../core/db")
const pre = prefix 

kord({
cmd: "join",
  desc: "join a group using it's link",
  fromMe: true,
  type: "group",
}, async (m, text) => {
  try {
    var links = extractUrlsFromString(text || m.quoted?.text)
    if (links.length === 0) return await m.send("✘ Provide a WhatsApp group link")
    const linkRegex= /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
  const code = links.find(link => linkRegex.test(link))?.match(linkRegex)?.[1];
  if (!code) return await m.send("✘ Invalid invite link")
  try {
    const joinResult = await m.client.groupAcceptInvite(code);
    if (joinResult) return await m.send('```✓ Joined successfully!```');
    return await m.send(`_*✘ Failed to join group*_`)
  } catch (error) {
    return await m.send("✘ " + error.message)
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "leave|left",
  desc: "leave a group",
  gc: true,
  fromMe: true,
  type: "group",
}, async (m, text) => {
  try {
    await m.client.groupLeave(m.chat)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "gpp|setgcpp",
  desc: "set a group profile pic",
  gc: true,
  adminOnly: true,
  fromMe: wtype,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");
    if (text && text === "remove") {
    await m.client.removeProfilePicture(m.chat);
    return await m.send("```✓ Group Profile Picture Removed```");
    }
    if (!m.quoted?.image) return await m.send("✘ Reply to an image")
    var media = await m.quoted.download()
    await m.client.updateProfilePicture(m.chat, media);
    return await m.send("```✓ Group Profile Picture Updated```")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "gname|setgcname",
  desc: "set a group name(subject)",
  gc: true,
  adminOnly: true,
  fromMe: wtype,
  type: "group",
}, async (m, text, cmd) => {
  try {
    var name = text || m.quoted?.text
    if (!name) return await m.send(`_*✘ Provide a name to set!*_\n_Example: ${cmd} New Group Name_`)
    const meta = await m.client.groupMetadata(m.chat);
    var botAd = await isBotAdmin(m);
    if (meta.restrict && !botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");
    await m.client.groupUpdateSubject(m.chat, name)
    return await m.send("```✓ Group Name Updated```")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "gdesc|setgcdesc",
  desc: "set a group description",
  gc: true,
  adminOnly: true,
  fromMe: wtype,
  type: "group",
}, async (m, text, cmd) => {
  try {
    var desc = text || m.quoted?.text
    if (!desc) return await m.send(`_*✘ Provide a description to set*_\n_Example: ${cmd} Group rules and information..._`)
    const meta = await m.client.groupMetadata(m.chat);
    var botAd = await isBotAdmin(m);
    if (meta.restrict && !botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");
    await m.client.groupUpdateDescription(m.chat, desc)
    return await m.send("```✓ Description Updated```")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "add",
  desc: "add a user to group",
  gc: true,
  fromMe: wtype,
  type: "group",
}, async (m, text, cmd) => {
  const meta = await m.client.groupMetadata(m.chat);
  var botAd = await isBotAdmin(m);
  if (meta.restrict && !botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");
  
  if (!text && !m.quoted?.sender) return await m.send(`_*✘ Reply to user or provide number*_\n_Example: ${cmd} 23412345xxx_`);
  
  const user = text || m.quoted?.sender
const cleanNumber = (user.includes('@') ? user.split('@')[0] : user).replace(/\D/g, '') + '@s.whatsapp.net'
  const userInfo = await m.client.onWhatsApp(cleanNumber);
  
  if (!userInfo.length) return await m.send('_✘ User is not on WhatsApp_');
  
  try {
    const result = await m.client.groupParticipantsUpdate(m.chat, [cleanNumber], "add");
    const status = result[0].status;
    
    if (status === '403') {
      await m.send('_✘ Unable to add user_\n_Sending invite..._');
      return await m.sendGroupInviteMessage(cleanNumber);
    } else if (status === '408') {
      await m.send("_✘ User recently left, try later_");
      const code = await m.client.groupInviteCode(m.chat);
      return await m.client.sendMessage(cleanNumber, { text: `https://chat.whatsapp.com/${code}` });
    } else if (status === '401') {
      return await m.send('_✘ Bot is blocked by the user_');
    } else if (status === '200') {
      return await m.send(`_*✓ @${cleanNumber.split('@')[0]} Added*_`, { mentions: [cleanNumber] });
    } else if (status === '409') {
      return await m.send("_✘ User already in group_");
    }
    return await m.send("✘ " + JSON.stringify(result));
  } catch (error) {
    return await m.send("✘ " + error.message);
  }
})

kord({
cmd: "kick",
  desc: "remove a member from group",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");
    
    var user = m.mentionedJid[0] || m.quoted?.sender || text
    
    if (!user) return await m.send("_✘ Reply to or mention a member_");
    
    user = (user.includes('@') ? user.split('@')[0] : user).replace(/\D/g, '') + '@s.whatsapp.net'
    
    if (text === "all") {
    var res = await m.send("_✘ Reply \"confirm\" to continue_")
    var response = await m.getResponse(res, 15000)
    if (response.text.toLowerCase() === "confirm") {
    await m.send("_*✓ Kicking all users in 10 seconds*_\n_Use restart command to cancel_")
    await sleep(10000)
    let { participants } = await m.client.groupMetadata(m.chat);
    participants = participants.filter(p => p.jid !== m.user.jid);
    for (let key of participants) {
    const jid = parsedJid(key.jid);
    await m.client.groupParticipantsUpdate(m.chat, [jid], "remove");
    if (config().KICK_AND_BLOCK) await m.client.updateBlockStatus(jid, "block");
    await m.send(`_*✓ @${jid[0].split("@")[0]} kicked*_`, { mentions: [jid] });
      }
    }
  } else {
    const jid = parsedJid(user);
    await m.client.groupParticipantsUpdate(m.chat, [jid], "remove");
    if (config().KICK_AND_BLOCK) await m.client.updateBlockStatus(jid, "block");
    await m.send(`_*✓ @${jid.split("@")[0]} kicked*_`, { mentions: [jid] });
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "promote",
  desc: "promote a member to admin",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");
    var user = m.mentionedJid[0] || m.quoted?.sender || text
    if (!user) return await m.send("_✘ Reply to or mention a member_")
    if(await isadminn(m, user)) return await m.send("✘ Member is already admin")
    let jid = parsedJid(user);
    await m.client.groupParticipantsUpdate(m.chat, [jid], "promote");
    return await m.send(`_*✓ @${jid.split("@")[0]} promoted*_`, { mentions: [jid] });
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "demote",
  desc: "demote an admin to member",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");
    var user = m.mentionedJid[0] || m.quoted?.sender || text
    if (!user) return await m.send("✘ Reply to or mention an admin")
    if(!await isadminn(m, user)) return await m.send("✘ Member is not admin")
    let jid = parsedJid(user);
    await m.client.groupParticipantsUpdate(m.chat, [jid], "demote");
    return await m.send(`✓ @${jid.split("@")[0]} demoted`, { mentions: [jid] });
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "mute",
  desc: "mute a group to allow only admins to send message",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group"
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("✘_*Bot Needs To Be Admin!*_");
    await m.client.groupSettingUpdate(m.chat, "announcement");
    return await m.send("✓ Group Muted");
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "unmute",
  desc: "unmute a group to allow all members to send message",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group"
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("✘_*Bot Needs To Be Admin!*_");
    await m.client.groupSettingUpdate(m.chat, "not_announcement");
    return await m.send("✓ Group Unmuted");
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "invite|glink",
  desc: "get group link",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("✘_*Bot Needs To Be Admin!*_");
    const code = await m.client.groupInviteCode(m.chat);
    return await m.send(`https://chat.whatsapp.com/${code}`);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "revoke",
  desc: "reset group link",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("✘_*Bot Needs To Be Admin!*_");
    await m.client.groupRevokeInvite(m.chat);
    const newCode = await m.client.groupInviteCode(m.chat);
    return await m.send(`✓ Link Revoked\nNew Link: https://chat.whatsapp.com/${newCode}`);
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "tag",
  desc: "tag all memebers/admins/me/text",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group"
}, async (m, text, cmd, store) => {
  try {
    if (!m.isGroup) return await m.send(`@${m.sender.split("@")[0]}`, { mentions: [m.sender] });   
  const { participants } = await m.client.groupMetadata(m.chat);
  let admins = participants.filter(v => v.admin !== null).map(v => v.jid);
  let msg = "";
  
  if (text === "all" || text === "everyone") {
    participants.forEach((p, i) => {
      msg += `❐ ${i + 1}. @${p.jid.split('@')[0]}\n`;
    });
    await m.send(msg, { mentions: participants.map(a => a.jid) });
  } 
  else if (text === "admin" || text === "admins") {
    admins.forEach((admin, i) => {
      msg += `❐ ${i + 1}. @${admin.split('@')[0]}\n`;
    });
    return await m.send(msg, { mentions: admins });
  } 
  else if (text === "me" || text === "mee") {
    return await m.send(`@${m.sender.split("@")[0]}`, { mentions: [m.sender] });
  } 
  else if (text) {
    const message = text || m.quoted.text;
    return await m.send(message, { mentions: participants.map(a => a.jid) });
  } 
  else if (m.quoted) {
    return await m.forwardMessage(
            m.chat,
            await store.findMsg(m.quoted.id),
            { contextInfo: { mentionedJid: participants.map(a => a.jid) }, quoted: m }
        );
  } else { 
  return await m.send(`✘ Usage:\ntag all\ntag admins\ntag me\ntag <message>\ntag (reply to message)`);
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "tagall",
  desc: "tag all memebers",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group"
}, async (m, text) => {
  try {
    const { participants } = await m.client.groupMetadata(m.chat);
    let admins = participants.filter(v => v.admin !== null).map(v => v.jid);
    let msg = `❴ ⇛ *TAGALL* ⇚ ❵\n*Message:* ${text ? text : "blank"}\n*Caller:* @${m.sender.split("@")[0]}\n\n`
    participants.forEach((p, i) => {
    msg += `❧ ${i + 1}. @${p.jid.split('@')[0]}\n`; 
    });
    await m.send(msg, { mentions: participants.map(a => a.jid) });
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})


kord({
  cmd: "creategc",
  desc: "create a group",
  fromMe: true,
  type: "group",
}, async (m, text) => {
  const groupName = text || m.pushName;
  if (!m.quoted?.sender && !m.mentionedJid?.[0]) return m.reply("✘ Reply to or mention a user");
  try {
    const group = await m.client.groupCreate(groupName, [m.quoted?.sender || m.mentionedJid[0], m.sender]);
    const inviteCode = await m.client.groupInviteCode(group.id);
    return await m.send(`✓ Group created\nLink: https://chat.whatsapp.com/${inviteCode}`);
  } catch (error) {
    return await m.send("✘ " + error.message);
  }
})

kord({
cmd: "lock",
  desc: "make only admins can modify group settings",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("✘_*Bot Needs To Be Admin!*_");
    const meta = await m.client.groupMetadata(m.chat)
    if (meta.restrict) return await m.send("✘ Group settings already admin-only");
    await m.client.groupSettingUpdate(m.chat, 'locked')
    return await m.send("✓ Group settings now admin-only");
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "unlock",
  desc: "allow all members to modify group settings",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("✘_*Bot Needs To Be Admin!*_");
    const meta = await m.client.groupMetadata(m.chat)
    if (!meta.restrict) return await m.send("✘ Group settings already unlocked");
    await m.client.groupSettingUpdate(m.chat, 'unlocked')
    return await m.send("✓ All members can now modify group settings");
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "ginfo",
  desc: "get group info of a group",
  fromMe: wtype,
  type: "group",
}, async (m, text) => {
  if (!text && m.isGroup) {
    var link;
    try {
      link = `https://chat.whatsapp.com/${await m.client.groupInviteCode(m.chat)}`;
    } catch (error) {
      return await m.send("✘_*Bot Needs To Be Admin!*_");
    }
  }
  var links = extractUrlsFromString(link || text || m.quoted?.text)
  if (links.length === 0) return await m.send("✘ Provide a WhatsApp group link")
  const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
  link = links.find(l => linkRegex.test(l));
  
  const code = link.match(linkRegex)[1];
  const currentTime = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  try {
    const groupInfo = await m.client.groupGetInviteInfo(code);
    const memberCount = groupInfo.size || 0;
    const maxParticipants = groupInfo.maxParticipants || 257;
    const pic = await m.client.profilePictureUrl(groupInfo.id, "image")
    
    const response = `*╭─❑ 『 GROUP INFORMATION 』 ❑─╮*
├ ➨ *Name:* ${groupInfo.subject}
├ ➨ *Owner:* ${groupInfo.owner ? '@' + groupInfo.owner.split('@')[0] : 'Unknown'}
├ ➨ *Members:* ${memberCount}/${maxParticipants}
├ ➨ *Created:* ${new Date(groupInfo.creation * 1000).toLocaleString()}
├ ➨ *Restricted:* ${groupInfo.restrict ? '✘ Yes' : '✓ No'}
├ ➨ *Announced:* ${groupInfo.announce ? '✘ Yes' : '✓ No'}
├ ➨ *Ephemeral:* ${groupInfo.ephemeralDuration ? `✓ ${groupInfo.ephemeralDuration/86400} days` : '✘ Off'}
├ ➨ *Group ID:* ${groupInfo.id}
├ ➨ *Join Approval:* ${groupInfo.membershipApprovalMode ? '✓ Required' : '✘ Not Required'}
${groupInfo.desc ? `├ ➨ *Description:* \n${groupInfo.desc}\n` : ''}
├────────────────
├ ✎ *Fetched by:* @${m.sender.split('@')[0]}
├ ✎ *Time:* ${currentTime} UTC
╰────────────────✧`;

    await m.send(pic, { 
      mentions: [...(groupInfo.owner ? [groupInfo.owner] : []), m.sender],
      caption: response,
      contextInfo: {
        externalAdReply: {
          title: "Group Info",
          body: groupInfo.subject,
          thumbnailUrl: groupInfo.imageUrl || "",
          sourceUrl: link,
          mediaType: 1
        }
      }
    }, "image");
  } catch (error) {
    await m.send("✘ Error fetching group info:\n" + error.message);
  }
})


kord({
  cmd: "antibot",
  desc: "set action to be done when a visitor bot messaes in group",
  fromMe: wtype,
  gc: true,
  type: "group",
}, async (m, text) => {
  try {
  var botAd = await isBotAdmin(m);
  if (!botAd) return await m.send("✘_*Bot Needs To Be Admin!*_")
  
  const args = text.split(" ");
  if (args && args.length > 0) {
  const option = args[0].toLowerCase();
  const value = args.length > 1 ? args[1] : null;
  const fArgs = args.slice(1).join(" ")
  const chatJid = m.chat
  
  
  var sdata = await getData("antibot_config");
      if (!Array.isArray(sdata)) sdata = [];
  let isExist = sdata.find(entry => entry.chatJid === chatJid);
  if (option === "delete") {
    var delc = { 
      chatJid,
     action: "del",
     warnc: "0",
     maxwrn: "3"
    }
    if (isExist) {
      isExist.action = "del"
    } else {
      sdata.push(delc)
    }
    await storeData("antibot_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiBot Is Now Enabled!*_\n_Action:_ delete`)
    } else  if (option === "kick") {
      var kikc = {
        chatJid,
        "action": "kick", 
        "warnc": "0",
        "maxwrn": "3"
      }
       if (isExist) {
      isExist.action = "kick"
    } else {
      sdata.push(kikc)
    }
    await storeData("antibot_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiBot Is Now Enabled!*_\n_Action:_ kick`)
    } else if (option === "warn") {
      var cou = parseInt(value)
      if(!cou) return await m.send(`*_Use ${prefix}antibot warn 3_*`)
      var warnco = {
        chatJid,
        "action": "warn",
        "warnc": "0",
        "maxwrn": cou
      }
      if (isExist) {
      isExist.action = "warn"
      isExist.maxwrn = cou
    } else {
      sdata.push(warnco)
    }
    await storeData("antibot_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiBot Is Now Enabled!*_\n_Action:_ Warn\n_MaxWarning:_ ${cou}`)
    } else if (option === "status") {
      if (!isExist) return await m.send("_AntiBot is Currently Disabled here..._")
      var sc = `\`\`\`[ ANTI-BOT STATUS ]\`\`\`
_Active?:_ Yes
_Action:_ ${isExist.action}
_MaxWARN:_ ${isExist.maxwrn}`
      await m.send(sc)
    } else if (option === "off") {
      if (!isExist) return await m.send("_AntiBot is Currently Disabled here..._")
        sdata = sdata.filter(entry => entry.chatJid !== chatJid)
       await storeData("antibot_config", JSON.stringify(sdata, null, 2))
       return await m.send("_*AntiBot disabled!*_")
    } else {
      var mssg = `\`\`\` [ Available AntiBot config ] \`\`\`
_${pre}antibot delete_
_${pre}antibot kick_
_${pre}antibot warn 3_
_${pre} antibot status_
_${pre}antibot off_`
      return m.send(`${mssg}`)
    }
    } else {
      var msg = `\`\`\` [ Available AntiBot config ] \`\`\`
_${pre}antibot delete_
_${pre}antibot kick_
_${pre}antibot warn 3_
_${pre} antibot status_
_${pre}antibot off_`
      return m.send(`${msg}`)
    }
      
    } catch (e) {
      console.error(e)
      m.send(`${e}`)
    }
})

kord({
on: "all",
}, async (m, text) => {
  try {
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    if (isGroup) {
    var botAd = await isBotAdmin(m);
    if (!botAd) return;
    
    if(m.message.reactionMessage) return;
    const cJid = m.key.remoteJid
    const groupMetadata = await getMeta(m.client, m.chat);
    const admins =  groupMetadata.participants.filter(v => v.admin !== null).map(v => v.jid);
    const wCount = new Map()
    if ((m.isBot || m.isBaileys) && !m.fromMe) {
    var sdata = await getData("antibot_config");
    if (!Array.isArray(sdata)) return;
    let isExist = sdata.find(entry => entry.chatJid === cJid);
    if (isExist && !admins.includes(m.sender)) {
    var act = isExist.action
    if (act === "del") {
    await m.send(m, {}, "delete")
      return await m.send(`_*Bots are not Allowed!!*_`)
    } else if (act === "kick") {
      await m.send(m, {}, "delete")
      await m.send(`_*Bots are not Allowed!!*_\n_Goodbye!!_`)
      await m.client.groupParticipantsUpdate(cJid, [m.sender], 'remove');
    } else if (act === "warn") {
      var cCount = (wCount.get(cJid) || 0) + 1
      wCount.set(cJid, cCount)
      var maxC = isExist.maxwrn
      
      var remain = maxC - cCount
      if (remain > 0) {
        var rmsg = `_*Bots are not Allowed!!*_
_You are warned!_
Warning(s): (${cCount}/${maxC})`
      await m.send(`${rmsg}`)
      await m.send(m, {}, "delete")
      }
      if (cCount >= maxC) {
        await m.send(m, {}, "delete")
        await m.send(`_*Max Warning Exceeded!!*_\n_Goodbye!!!_`)
        await m.client.groupParticipantsUpdate(cJid, [m.sender], 'remove');
        wCount.delete(cJid)
      }
    }
  }
  } else return;
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})



kord({
cmd: "events|gcevent|grpevents",
  desc: "manage group events settings",
  gc: true,
  adminOnly: true,
  fromMe: wtype,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m)
    if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_")
    
    var gdata = await getData('group_events') || {}
    const jid = m.chat
    
    const defaultWelcome = `@pp ╭━━━々 𝚆 𝙴 𝙻 𝙲 𝙾 𝙼 𝙴 々━━━╮
┃ ➺ *々 Welcome @user! to @gname*
┃ ➺ *々 Members: @count*
┃ ➺ We Hope You Have A Nice Time Here!
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    
    const defaultGoodbye = `@pp ╭━━━々 𝙶 𝙾 𝙾 𝙳 𝙱 𝚈 𝙴 々━━━╮
┃ ➺ *々 @user! left @gname!*
┃ ➺ *々 Members: @count*
┃ ➺ We Hope He/She Had A Nice Time Here!
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    
    gdata[jid] = gdata[jid] || {
      events: false,
      add: false,
      remove: false,
      promote: false,
      demote: false,
      antipromote: false,
      antidemote: false,
      welcome: defaultWelcome,
      goodbye: defaultGoodbye
    }
    
    var parts = text.split(" ")
    var cmd = parts[0]?.toLowerCase()
    var value = parts[1]?.toLowerCase()
    
    if (!cmd) {
      let status = gdata[jid].events ? "enabled" : "disabled"
      return await m.send(`*_Group Events Settings_*
_*Usage:*_
_events on/off - Enable/disable all events_
_events clear - clear the group events settings_
_events welcome on/off - Toggle welcome messages_
_events goodbye on/off - Toggle goodbye messages_
_events promote on/off - Toggle promotion alerts_
_events demote on/off - Toggle demotion alerts_
_events antipromote on/off - Toggle anti-promotion_
_events antidemote on/off - Toggle anti-demotion_
_events setwelcome text - Set welcome message_
_events setgoodbye text - Set goodbye message_

*Available Variables:*
@user or &user - Username
@gname or &gname - Group name  
@gdesc or &gdesc - Group description
@count or &count - Member count
@time or &time - Current time
@pp or &pp - Include profile picture
@ad or &ad - Include external ad reply`)
    }
    
    if (cmd === "on" || cmd === "enable") {
      gdata[jid].events = true
      gdata[jid].add = true
      gdata[jid].remove = true
      gdata[jid].promote = true
      gdata[jid].demote = true
      gdata[jid].antipromote = true
      gdata[jid].antidemote = true
      gdata[jid].welcome = defaultWelcome
      gdata[jid].goodbye = defaultGoodbye
      await storeData('group_events', gdata)
      return await m.send("✓ Group events notifications enabled with default messages")
    }
    
    if (cmd === "off" || cmd === "disable") {
      gdata[jid].events = false
      await storeData('group_events', gdata)
      return await m.send("✓ Group events notifications disabled")
    }
    
    if (cmd === "clear") {
      delete gdata[jid]
      await storeData('group_events', gdata)
      return await m.send("✓ Group events notifications cleared")
    }
    
    if (cmd === "status") {
      return await m.send(`*Events Status:* ${gdata[jid].events ? "on" : "off"}
*Welcome:* ${gdata[jid].add ? "on" : "off"}
*Goodbye:* ${gdata[jid].remove ? "on" : "off"}
*Promote:* ${gdata[jid].promote ? "on" : "off"}
*Demote:* ${gdata[jid].demote ? "on" : "off"}
*Anti-Promote:* ${gdata[jid].antipromote ? "on" : "off"}
*Anti-Demote:* ${gdata[jid].antidemote ? "on" : "off"}`)
    }
    
    if (cmd === "welcome") {
      if (value !== "on" && value !== "off") return await m.send("✘ Please specify on or off")
      gdata[jid].events = true
      gdata[jid].add = value === "on" ? true : false
      await storeData('group_events', gdata)
      return await m.send(`✓ Welcome messages turned ${value}`)
    }
    
    if (cmd === "goodbye") {
      if (value !== "on" && value !== "off") return await m.send("✘ Please specify on or off")
      gdata[jid].events = true
      gdata[jid].remove = value === "on" ? true : false
      await storeData('group_events', gdata)
      return await m.send(`✓ Goodbye messages turned ${value}`)
    }
    
    if (cmd === "promote") {
      if (value !== "on" && value !== "off") return await m.send("✘ Please specify on or off")
      gdata[jid].events = true
      gdata[jid].promote = value === "on" ? true : false
      await storeData('group_events', gdata)
      return await m.send(`✓ Promotion alerts turned ${value}`)
    }
    
    if (cmd === "demote") {
      if (value !== "on" && value !== "off") return await m.send("✘ Please specify on or off")
      gdata[jid].events = true
      gdata[jid].demote = value === "on" ? true : false
      await storeData('group_events', gdata)
      return await m.send(`✓ Demotion alerts turned ${value}`)
    }
    
    if (cmd === "antipromote") {
      if (value !== "on" && value !== "off") return await m.send("✘ Please specify on or off")
      gdata[jid].events = true
      gdata[jid].antipromote = value === "on" ? true : false
      await storeData('group_events', gdata)
      return await m.send(`✓ Anti-promotion ${value === "on" ? "enabled" : "disabled"}`)
    }
    
    if (cmd === "antidemote") {
      if (value !== "on" && value !== "off") return await m.send("✘ Please specify on or off")
      gdata[jid].events = true
      gdata[jid].antidemote = value === "on" ? true : false
      await storeData('group_events', gdata)
      return await m.send(`✓ Anti-demotion ${value === "on" ? "enabled" : "disabled"}`)
    }
    
    if (cmd === "setwelcome") {
      let newMsg = text.replace(cmd, "").trim()
      if (!newMsg) return await m.send(`✘ Provide the welcome message text

*Available Variables:*
@user or &user - Username
@gname or &gname - Group name
@gdesc or &gdesc - Group description  
@count or &count - Member count
@time or &time - Current time
@pp or &pp - Include profile picture
@ad or &ad - Include external ad reply`)
      gdata[jid].welcome = newMsg
      await storeData('group_events', gdata)
      return await m.send("✓ Welcome message updated\n\n" + newMsg)
    }
    
    if (cmd === "setgoodbye") {
      let newMsg = text.replace(cmd, "").trim()
      if (!newMsg) return await m.send(`✘ Provide the goodbye message text

*Available Variables:*
@user or &user - Username
@gname or &gname - Group name
@gdesc or &gdesc - Group description
@count or &count - Member count
@time or &time - Current time
@pp or &pp - Include profile picture
@ad or &ad - Include external ad reply`)
      gdata[jid].goodbye = newMsg
      await storeData('group_events', gdata)
      return await m.send("✓ Goodbye message updated\n\n" + newMsg)
    }
    
    return await m.send("✘ Invalid option. Use 'events' without parameters to see available commands.")
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})


kord({
cmd: "antilink",
  desc: "automactically delete links in group",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text, c) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");
    var data = await getData("antilink") || {}
    data[m.chat] = data[m.chat] || {
    active: false,
    action: null,
    warnc: 0,
    permitted: []
    }
    var parts = text.split(" ");
    var cmd = parts[0]?.toLowerCase();
    var value = parts[1]?.toLowerCase();
    var isActive = data[m.chat].active
    if (!cmd) {
    return await m.send(
    `\`\`\`┌─────────❖
│▸ ANTILINK CONFIG
└─────────❖
Usage:
${c} kick
${c} delete
${c} warn 4
${c} allow (url)
${c} unallow (url)
${c} listallow
${c} status
${c} off\`\`\``
    )
    }
    
    if (cmd === "kick") {
    if (isActive && data[m.chat].action === "kick") {
    return await m.send(`\`\`\` Antilink is already set to: kick\`\`\``)
    }
    data[m.chat].active = true
    data[m.chat].action = "kick"
    await storeData("antilink", data)
    return await m.send(`\`\`\`▸ ❏ Antilink Enabled: kick\`\`\``)
    }
    else if (cmd === "delete") {
    if (isActive && data[m.chat].action === "delete") {
    return await m.send(`\`\`\` Antilink is already set to: delete\`\`\``)
    }
    data[m.chat].active = true
    data[m.chat].action = "delete"
    await storeData("antilink", data)
   return await m.send(`\`\`\`▸ ❏ Antilink Enabled: delete\`\`\``)
    }
    else if (cmd === "warn") {
    if (isActive && data[m.chat].action === "warn") {
    return await m.send(`\`\`\` Antilink is already set to: warn | ${data[m.chat].warnc}\`\`\``)
    }
    data[m.chat].active = true
    data[m.chat].action = "warn"
    data[m.chat].warnc = parseInt(value) || 3
    await storeData("antilink", data)
    return await m.send(`\`\`\`▸ ❏ Antilink Enabled: warn | ${data[m.chat].warnc}\`\`\``)
    }
    else if (cmd === "allow") {
    var url = parts.slice(1).join(" ");
    if (!url) {
    return await m.send(`\`\`\`provide a URL to allow\nExample: ${c} allow youtube.com\`\`\``)
    }
    if (!data[m.chat].permitted.includes(url)) {
    data[m.chat].permitted.push(url)
    await storeData("antilink", data)
    return await m.send(`\`\`\`▸ ❏ URL allowed: ${url}\`\`\``)
    } else {
    return await m.send(`\`\`\`URL already in allowed list: ${url}\`\`\``)
    }
    }
    else if (cmd === "unallow") {
    var url = parts.slice(1).join(" ");
    if (!url) {
    return await m.send(`\`\`\`provide a URL to remove\nExample: ${c} unallow youtube.com\`\`\``)
    }
    var index = data[m.chat].permitted.indexOf(url)
    if (index > -1) {
    data[m.chat].permitted.splice(index, 1)
    await storeData("antilink", data)
    return await m.send(`\`\`\`▸ ❏ URL removed: ${url}\`\`\``)
    } else {
    return await m.send(`\`\`\`URL not found in allowed list: ${url}\`\`\``)
    }
    }
    else if (cmd === "listallow") {
    if (data[m.chat].permitted.length === 0) {
    return await m.send(`\`\`\`No allowed URLs found\`\`\``)
    }
    var list = data[m.chat].permitted.map((url, i) => `${i + 1}. ${url}`).join("\n")
    return await m.send(`\`\`\`┌─────────❖
│▸ ALLOWED URLS
└─────────❖
${list}
└──────────────\`\`\``)
    }
    else if (cmd === "status") {
    return m.send(
    `\`\`\`┌─────────❖
│▸ ANTILINK CONFIG
└─────────❖
│▸ On: ${data[m.chat].active}
│▸ Action: ${data[m.chat].action}
│▸ Allowed URLs: ${data[m.chat].permitted.length}
└──────────────\`\`\``
    )
    } else if (cmd === "off") {
    data[m.chat].active = false
    await storeData("antilink", data)
    return await m.send(`\`\`\`▸ ❏ Antilink Disabled\`\`\``)
    } else {
    return await m.send(
    `\`\`\`┌─────────❖
│▸ ANTILINK CONFIG
└─────────❖
Usage:
${c} kick
${c} delete
${c} warn 4
${c} allow <url>
${c} unallow <url>
${c} listallow
${c} status
${c} off\`\`\``
    )
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
on: "all",
}, async (m, text) => {
  try {
    var data = await getData("antilink") || []
    var d = data[m.chat]
    if (!d || !d.active) return
    if (!m.isGroup) return
    if (await isAdmin(m)) return;
    if (!await isBotAdmin(m)) return;
    var act = isUrl(text)
    if (act) {
    var urls = text.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi) || []
    var allPermitted = urls.every(url => {
    return d.permitted.some(permittedUrl => url.includes(permittedUrl)) })
    if (allPermitted && urls.length > 0) return
    if (d.action === "kick") {
      try {
        await m.send(m, {}, "delete")
        await m.client.groupParticipantsUpdate(m.chat, [m.sender], "remove")
        return await m.send(`\`\`\`Links Are Not Allowed!!\`\`\`\n\`\`\`@${m.sender.split("@")[0]} kicked!\`\`\``, { mentions: [m.sender], q: false })
      } catch (e) {
        console.error("err kicking in antilink", e)
      }
    }
    else if (d.action === "delete") {
      try {
        await m.send(m, {}, "delete")
        return await m.send(`\`\`\`@${m.sender.split("@")[0]} Links Are Not Allowed!!\`\`\``, { mentions: [m.sender], q: false })
      } catch (e) {
        console.error("err deleting in antilink", e)
      }
    }
    else if (d.action === "warn") {
      if (!data.warnCounts) data.warnCounts = {}
      if (!data.warnCounts[m.chat]) data.warnCounts[m.chat] = {}
      var userWarns = data.warnCounts[m.chat][m.sender] || 0
      userWarns++
      data.warnCounts[m.chat][m.sender] = userWarns
      var maxWarns = d.warnc
      var rem = maxWarns - userWarns
      if (rem > 0) {
        await m.send(m, {}, "delete")
        await m.send(`\`\`\`@${m.sender.split("@")[0]}\nLinks Are Not Allowed\nWarning(s): ${userWarns}/${maxWarns}\`\`\``, { mentions: [m.sender], q: false })
        await storeData("antilink", data)
      } else {
        await m.send(m, {}, "delete")
        await m.client.groupParticipantsUpdate(m.chat, [m.sender], "remove")
        await m.send(`\`\`\`@${m.sender.split("@")[0]}\nLinks Are Not Allowed\nWarning(s): ${userWarns}/${maxWarns}\nGoodbye!\`\`\``, { q: false, mentions: [m.sender] })
        delete data.warnCounts[m.chat][m.sender]
        await storeData("antilink", data)
      }
    }
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})


kord({
  cmd: "akick",
  desc: "auto kick user",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m)
    if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_")

    let args = text.trim().split(/\s+/)
    let isRemoveCmd = args[0] === "remove"
    let numberArg = isRemoveCmd ? args[1] : args[0]
    let user = m.mentionedJid[0] || m.quoted?.sender || (numberArg && `${numberArg.replace(/[^0-9]/g, "")}@s.whatsapp.net`)
    if (!user) return await m.send("_✘ Reply to or mention a member_\n_to remove use:_\n_akick remove 234xxxxxxx_")

    const jid = parsedJid(user)

    if (isRemoveCmd || text.includes("remove")) {
      let sdata = await getData("akick")
      if (!Array.isArray(sdata)) sdata = []
      if (!sdata.includes(user)) return m.send("_user is not in auto kick_")
      sdata = sdata.filter(entry => entry !== user)
      await storeData("akick", JSON.stringify(sdata, null, 2))
      return m.send("_user is now free_")
    }

    let d = await getData("akick") || []
    d.push(jid)
    await storeData("akick", d)
    await m.client.groupParticipantsUpdate(m.chat, [jid[0]], "remove")
    if (config().KICK_AND_BLOCK) await m.client.updateBlockStatus(jid[0], "block")
    await m.send(`_*✓ @${jid[0].split("@")[0]} kicked*_`, { mentions: [jid[0]] })

  } catch (e) {
    console.error(e)
    return await m.send(`error in akick ${e}`)
  }
})

kord({
cmd: "antiword",
  desc: "auto delete words you set",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text, c) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_");
    var aw = await getData("antiword") || {}
    aw[m.chat] = aw[m.chat] || {
    active: false,
    action: "delete",
    warnc: config().WARNCOUNT,
    words: []
    }
    var dw = aw[m.chat]
    var parts = text.split(" ");
    var cmd = parts[0]?.toLowerCase();
    var value = parts[1]?.toLowerCase();
    var vl = parts[2]?.toLowerCase()
    var isActive = aw[m.chat].active
    
    if (!cmd) return await m.send(
    `\`\`\`┌─────────❖
│▸ ANTIWORD CONFIG
└─────────❖
Usage:
${c} on
${c} action kick/delete/warn 3
${c} warnc 5
${c} status/get
${c} remove <words>/all
${c} off
${c} gay, stupid\`\`\``
    )
    
    if (cmd == "on") {
    if (isActive) return await m.send(`\`\`\`➻ Antiword is Already On: ${dw.action}\`\`\``)
    dw.active = true
    dw.action = "delete"
    await storeData("antiword", aw)
    return await m.send(`\`\`\`➻ Antiword Turned On and set to Delete\nUse ${c} action kick/delete/warn 3 to set action\`\`\``)
    }
    if (cmd == "off") {
    if (isActive) {
    dw.active = false
    await storeData("antiword", aw)
    return await m.send("```➻ AntiWord Turned Off```")
    }
    return await m.send("```➻ Antiword isn't active```")
    }
    if (cmd == "action") {
    if (value == "kick") {
    if (isActive && aw[m.chat].action === "kick") return await m.send("```➻ Antiword is active & Action is already set to: kick```")
    aw[m.chat].active = true
    dw.action = "kick"
    await storeData("antiword", aw)
    return await m.send("```➻ Antiword Turned On & Action Set To: kick```")
    }
    else if (value == "delete") {
    if (isActive && aw[m.chat].action === "delete") return await m.send("```➻ Antiword is active & Action is already set to: delete```")
    aw[m.chat].active = true
    dw.action = "delete"
    await storeData("antiword", aw)
    return await m.send("```➻ Antiword Turned On & Action Set To: delete```")
    }
    else if (value == "warn") {
    if (isActive && dw.action == "warn") return await m.send(`\`\`\`➻ AntiWord is active & Action is Already set to warn | ${dw.warnc}\`\`\``)
    
    dw.active = true
    dw.action = "warn"
    dw.warnc = parseInt(vl) || config().WARNCOUNT
    await storeData("antiword", aw)
    return await m.send(`\`\`\`➻ Antiword Turned On & Action Set To: warn(${dw.warnc}\`\`\``)
    }
    else {
      return await m.send(`\`\`\`Use Either ${c} action kick/delete/warn 3\`\`\``)
    }
  }
  if (cmd == "warnc") {
    if (!value || isNaN(parseInt(value))) {
      return await m.send(`\`\`\`Usage: ${c} warnc <number>\nExample: ${c} warnc 5\`\`\``)
    }
    let newWarnCount = parseInt(value)
    if (newWarnCount < 1) {
      return await m.send("```➻ Warn count must be at least 1```")
    }
    dw.warnc = newWarnCount
    await storeData("antiword", aw)
    return await m.send(`\`\`\`➻ Warn count updated to: ${newWarnCount}\`\`\``)
  }
  if (cmd == "get" || cmd == "status") {
    return await m.send(`\`\`\`┌─────────❖
│▸ ANTIWORD STATUS
└─────────❖
Active: ${dw.active}
Action: ${dw.action}
Warn Count: ${dw.warnc}
Words: ${dw.words.join(", ") || "None"}
\`\`\``)
  }
  if (cmd == "remove" || cmd == "rm") {
    if (!value) {
      return await m.send(`\`\`\`Usage: ${c} remove <word1,word2> or ${c} remove all\nExample: ${c} remove gay, stupid\n${c} remove all\`\`\``)
    }
    if (value == "all") {
      if (dw.words.length === 0) {
        return await m.send("```➻ No words to remove```")
      }
      dw.words = []
      await storeData("antiword", aw)
      return await m.send("```➻ All words have been removed```")
    }
    let wtr = text.slice(text.indexOf(' ') + 1).toLowerCase().split(",").map(w => w.trim())
    let ew = wtr.filter(word => dw.words.includes(word))
    let nmw = wtr.filter(word => !dw.words.includes(word))
    if (ew.length === 0) {
      return await m.send(`\`\`\`➻ Word(s) not found: ${wtr.join(", ")}\`\`\``)
    }
    dw.words = dw.words.filter(word => !ew.includes(word))
    await storeData("antiword", aw)
    if (nmw.length > 0) {
      return await m.send(`\`\`\`➻ Removed: ${ew.join(", ")}\n➻ Not found: ${nmw.join(", ")}\`\`\``)
    }
    return await m.send(`\`\`\`➻ Removed: ${ew.join(", ")}\`\`\``)
  }
  let acts = ["delete", "kick", "warn", "on", "off", "action", "get", "status", "warnc", "remove", "rm"]
  if (acts.includes(cmd)) {
    return await m.send(`\`\`\`➻ Invalid command usage. "${cmd}" is a reserved command.\nType ${c} for help\`\`\``)
  }
  let wrds = text.toLowerCase().split(",").map(w => w.trim())
  let rwd = wrds.filter(word => acts.includes(word))
  if (rwd.length > 0) {
    return await m.send(`\`\`\`➻ Cannot add action word(s): ${rwd.join(", ")}\n remove it >>.\nExample: ${c} gay, stupid, fool\`\`\``)
  }
  let ew = wrds.filter(word => dw.words.includes(word))
  let newWords = wrds.filter(word => !dw.words.includes(word))
  if (ew.length > 0 && newWords.length === 0) {
    return await m.send(`\`\`\`➻ Word(s) already exist: ${ew.join(", ")}\`\`\``)
  }
  if (ew.length > 0 && newWords.length > 0) {
    dw.words.push(...newWords)
    await storeData("antiword", aw)
    return await m.send(`\`\`\`➻ Added: ${newWords.join(", ")}\n➻ Already existed: ${ew.join(", ")}\`\`\``)
  }
  if (wrds.length === 1) {
    dw.words.push(wrds[0])
    await storeData("antiword", aw)
    return await m.send(`\`\`\`➻ Word "${wrds[0]}" has been added\`\`\``)
  }
  dw.words.push(...wrds)
  await storeData("antiword", aw)
  return await m.send(`\`\`\`➻ Words added: ${wrds.join(", ")}\`\`\``)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

var warns = {}
kord({
on: "all",
  fromMe: false,
}, async (m, text) => {
  try {
    if (!m.isGroup) return;
    var botAd = await isBotAdmin(m);
    if (!botAd) return;
    var data = await getData("antiword") || {}
    if (!data[m.chat]) return
    var d = data[m.chat]
    if (!d.active) return
    if (await isAdmin(m)) return
    
    var msgText = (text || "").toLowerCase()
    var foundWord = d.words.find(word => msgText.includes(word.toLowerCase()))
    
    if (!foundWord) return
    
    if (d.action == "delete") {
    await m.send(m, {}, "delete")
    return await m.send(`_*@${m.sender.split("@")[0]}*_\n_*That word is not allowed here!*_`, { mentions: [m.sender] })
  }
  
  if (d.action == "kick") {
    await m.send(m, {}, "delete")
    await m.send(`_*@${m.sender.split("@")[0]} kicked for using prohibited word*_`, { mentions: [m.sender] })
    return await m.client.groupParticipantsUpdate(m.chat, [m.sender], "remove")
  }


if (d.action == "warn") {
  await m.send(m, {}, "delete")
  warns[m.chat] = warns[m.chat] || {}
  warns[m.chat][m.sender] = warns[m.chat][m.sender] || 0
  warns[m.chat][m.sender]++
  if (warns[m.chat][m.sender] >= d.warnc) {
    warns[m.chat][m.sender] = 0
    await m.send(`_*@${m.sender.split("@")[0]} kicked after ${d.warnc} warnings for using prohibited words*_`, { mentions: [m.sender] })
    return await m.client.groupParticipantsUpdate(m.chat, [m.sender], "remove")
  }
  return await m.send(`_*@${m.sender.split("@")[0]} warned! (${warns[m.chat][m.sender]}/${d.warnc}) for using prohibited word*_`, { mentions: [m.sender] })
}
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
cmd: "warn",
  desc: "warn user and kick if warnings exceeded",
  type: "group",
  fromMe: true,
  gc: true,
  adminOnly: true,
}, async (m, text) => {
  try {
    var user = m.mentionedJid[0] || m.quoted.sender
    if (!user) return await m.send(`_*mention or reply to a user*_\nor use *${prefix}warn reset* to clear warnings`)
    if (text.toLowerCase() === "reset") {
    var r = await warn.resetWarn(m.chat, user)
    if (!r) return await m.send("_*user hasn't been warned anytime before*_")
    return await m.send("*🍁 Warnings Cleared!*")
    }
    var aa = await warn.addWarn(m.chat, user, `${text ? text : null}`, m.sender)
    var wc = await warn.getWcount(m.chat, user)
    if (wc < config().WARNCOUNT) {
    if (aa.timestamp) { 
      await m.send(m.quoted, {}, "delete")
      return await m.send(
    `┏┅┅ 『 *WARNING* 』┅┅┓
┇ *User:* @${user.split("@")[0]}
┇ *Reason:* ${text ? text : "not specified"}
┇ *WarnCounts:* ${wc}
┗┉By: @${m.sender.split("@")[0]}`, {mentions: [user, m.sender] })
}
    return await m.send("some error occurred...")
  } else {
    await m.send("*Warnings Exceeded!*\n_*Goodbye!*_")
    await warn.resetWarn(m.chat, user)
    return await m.client.groupParticipantsUpdate(m.chat, [user], "remove")
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "antigm",
  desc: "set action to be done when a person mentions the group",
  fromMe: wtype,
  gc: true,
  type: "group",
}, async (m, text) => {
  try {
  var botAd = await isBotAdmin(m);
  if (!botAd) return await m.send("_*Bot Needs To Be Admin!*_")
  
  const args = text.split(" ");
  if (args && args.length > 0) {
  const option = args[0].toLowerCase();
  const value = args.length > 1 ? args[1] : null;
  const fArgs = args.slice(1).join(" ")
  const chatJid = m.chat
  
  
  var sdata = await getData("antigm_config");
      if (!Array.isArray(sdata)) sdata = [];
  let isExist = sdata.find(entry => entry.chatJid === chatJid);
  if (option === "delete") {
    var delc = { 
      chatJid,
     action: "del",
     warnc: "0",
     maxwrn: "3"
    }
    if (isExist) {
      isExist.action = "del"
    } else {
      sdata.push(delc)
    }
    await storeData("antigm_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiGm Is Now Enabled!*_\n_Action:_ delete`)
    } else  if (option === "kick") {
      var kikc = {
        chatJid,
        "action": "kick", 
        "warnc": "0",
        "maxwrn": "3"
      }
       if (isExist) {
      isExist.action = "kick"
    } else {
      sdata.push(kikc)
    }
    await storeData("antigm_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiGm Is Now Enabled!*_\n_Action:_ kick`)
    } else if (option === "warn") {
      var cou = parseInt(value)
      if(!cou) return await m.send(`*_Use ${prefix}antigm warn 3_*`)
      var warnco = {
        chatJid,
        "action": "warn",
        "warnc": "0",
        "maxwrn": cou
      }
      if (isExist) {
      isExist.action = "warn"
      isExist.maxwrn = cou
    } else {
      sdata.push(warnco)
    }
    await storeData("antigm_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiGm Is Now Enabled!*_\n_Action:_ Warn\n_MaxWarning:_ ${cou}`)
    } else if (option === "status") {
      if (!isExist) return await m.send("_AntiGm is Currently Disabled here..._")
      var sc = `\`\`\`[ ANTI-GM STATUS ]\`\`\`
_Active?:_ Yes
_Action:_ ${isExist.action}
_MaxWARN:_ ${isExist.maxwrn}`
      await m.send(sc)
    } else if (option === "off") {
      if (!isExist) return await m.send("_AntiGm is Currently Disabled here..._")
        sdata = sdata.filter(entry => entry.chatJid !== chatJid)
       await storeData("antigm_config", JSON.stringify(sdata, null, 2))
       return await m.send("_*AntiGm disabled!*_")
    } else {
      var mssg = `\`\`\` [ Available AntiGm config ] \`\`\`
_${pre}antigm delete_
_${pre}antigm kick_
_${pre}antigm warn 3_
_${pre}antigm status_
_${pre}antigm off_`
      return m.send(`${mssg}`)
    }
    } else {
      var msg = `\`\`\` [ Available AntiGm config ] \`\`\`
_${pre}antigm delete_
_${pre}antigm kick_
_${pre}antigm warn 3_
_${pre}antigm status_
_${pre}antigm off_`
      return m.send(`${msg}`)
    }
      
    } catch (e) {
      console.error(e)
      m.send(`${e}`)
    }
})

kord({
on: "all",
}, async (m, text) => {
  try {
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    if (isGroup) {
    var botAd = await isBotAdmin(m);
    if (!botAd) return;
    
    if(m.message.reactionMessage) return;
    const cJid = m.key.remoteJid
    const groupMetadata = await getMeta(m.client, m.chat);
    const admins =  groupMetadata.participants.filter(v => v.admin !== null).map(v => v.jid);
    const wCount = new Map()
    if (m.message?.groupStatusMentionMessage && !m.fromMe) {
    var sdata = await getData("antigm_config");
    if (!Array.isArray(sdata)) return;
    let isExist = sdata.find(entry => entry.chatJid === cJid);
    if (isExist && !admins.includes(m.sender)) {
    var act = isExist.action
    if (act === "del") {
    await m.send(m, {}, "delete")
      return await m.send(`_*Status Mention is not Allowed!!*_`)
    } else if (act === "kick") {
      await m.send(m, {}, "delete")
      await m.send(`_*Status Mention is not Allowed!!*_\n_Goodbye!!_`)
      await m.client.groupParticipantsUpdate(cJid, [m.sender], 'remove');
    } else if (act === "warn") {
      var cCount = (wCount.get(cJid) || 0) + 1
      wCount.set(cJid, cCount)
      var maxC = isExist.maxwrn
      
      var remain = maxC - cCount
      if (remain > 0) {
        var rmsg = `_*Status Mention is not Allowed!!*_
_You are warned!_
Warning(s): (${cCount}/${maxC})`
      await m.send(`${rmsg}`)
      await m.send(m, {}, "delete")
      if (cCount >= maxC) {
        await m.send(m, {}, "delete")
        await m.send(`_*Max Warning Exceeded!!*_\n_Goodbye!!!_`)
        await m.client.groupParticipantsUpdate(cJid, [m.sender], 'remove');
        wCount.delete(cJid)
      }
    }
  }
  } else return;
  }
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

const formatTimeAgo = sec => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) % 3600 / 60)
  const s = Math.floor((sec % 3600) % 60)
  return `${h} hours ${m} minutes ${s} seconds ago`
}

kord({
  cmd: "msgs",
  desc: "Show message stats",
  fromMe: true,
  type: "tools",
  gc: true,
  adminOnly: true
}, async (m, text, c, store) => {
  const rows = await store.chatHistory(m.chat, 99999)
  if (!rows.length) return m.send("_No messages found_")

  const stats = {}
  const now = Math.floor(Date.now() / 1000)

  for (const row of rows) {
    let parsed
    try {
      parsed = JSON.parse(row.message)
    } catch { continue }

    const msg = parsed.message || {}
    const key = parsed.key || {}

    const rawJid = key.participantPn || key.participant || key.remoteJid
    if (!rawJid || rawJid.endsWith("@g.us")) continue

    const jid = rawJid.split("@")[0]
    const name = parsed.pushName || jid
    const timestamp = parsed.messageTimestamp || 0

    if (!stats[jid]) {
      stats[jid] = {
        name,
        total: 0,
        text: 0,
        sticker: 0,
        image: 0,
        video: 0,
        audio: 0,
        document: 0,
        others: 0,
        lastSeen: timestamp
      }
    }

    stats[jid].total++

    if (msg.conversation || msg.extendedTextMessage) stats[jid].text++
    else if (msg.stickerMessage) stats[jid].sticker++
    else if (msg.imageMessage) stats[jid].image++
    else if (msg.videoMessage) stats[jid].video++
    else if (msg.audioMessage) stats[jid].audio++
    else if (msg.documentMessage) stats[jid].document++
    else stats[jid].others++

    if (timestamp > stats[jid].lastSeen)
      stats[jid].lastSeen = timestamp
  }

  const all = Object.entries(stats)
  const sorted = all.sort((a, b) => b[1].total - a[1].total)
  const sliced = text.trim().toLowerCase() === "all" ? sorted : sorted.slice(0, 10)

  const report = sliced.map(([jid, d]) => {
    const ago = formatTimeAgo(now - d.lastSeen)
    let lines = [
      `*Number :* ${jid}`,
      `*Name :* ${d.name}`,
      `*Total Msgs :* ${d.total}`,
      `*text :* ${d.text}`
    ]
    if (d.sticker) lines.push(`*sticker :* ${d.sticker}`)
    if (d.image) lines.push(`*image :* ${d.image}`)
    if (d.video) lines.push(`*video :* ${d.video}`)
    if (d.audio) lines.push(`*audio :* ${d.audio}`)
    if (d.document) lines.push(`*document :* ${d.document}`)
    if (d.others) lines.push(`*others :* ${d.others}`)
    lines.push(`*lastSeen :* ${ago}`)
    return lines.join("\n")
  }).join("\n\n")

  return m.send(report)
})


kord({
  cmd: "antispam",
  desc: "set action to be done when a person sends spam messages",
  fromMe: wtype,
  gc: true,
  type: "group",
}, async (m, text) => {
  try {
  var botAd = await isBotAdmin(m)
  if (!botAd) return await m.send("_*Bot Needs To Be Admin!*_")
  
  const args = text.split(" ")
  if (args && args.length > 0) {
  const option = args[0].toLowerCase()
  const value = args.length > 1 ? args[1] : null
  const fArgs = args.slice(1).join(" ")
  const chatJid = m.chat
  
  
  var sdata = await getData("antispam_config")
      if (!Array.isArray(sdata)) sdata = []
  let isExist = sdata.find(entry => entry.chatJid === chatJid)
  if (option === "delete") {
    var delc = { 
      chatJid,
     action: "del",
     warnc: "0",
     maxwrn: "3",
     msgLimit: 5,
     timeFrame: 10
    }
    if (isExist) {
      isExist.action = "del"
    } else {
      sdata.push(delc)
    }
    await storeData("antispam_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiSpam Is Now Enabled!*_\n_Action:_ delete\n_Limit:_ 5 messages in 10 seconds`)
    } else  if (option === "kick") {
      var kikc = {
        chatJid,
        "action": "kick", 
        "warnc": "0",
        "maxwrn": "3",
        "msgLimit": 5,
        "timeFrame": 10
      }
       if (isExist) {
      isExist.action = "kick"
    } else {
      sdata.push(kikc)
    }
    await storeData("antispam_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiSpam Is Now Enabled!*_\n_Action:_ kick\n_Limit:_ 5 messages in 10 seconds`)
    } else if (option === "warn") {
      var cou = parseInt(value)
      if(!cou) return await m.send(`*_Use ${prefix}antispam warn 3_*`)
      var warnco = {
        chatJid,
        "action": "warn",
        "warnc": "0",
        "maxwrn": cou,
        "msgLimit": 5,
        "timeFrame": 10
      }
      if (isExist) {
      isExist.action = "warn"
      isExist.maxwrn = cou
    } else {
      sdata.push(warnco)
    }
    await storeData("antispam_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiSpam Is Now Enabled!*_\n_Action:_ Warn\n_MaxWarning:_ ${cou}\n_Limit:_ 5 messages in 10 seconds`)
    } else if (option === "limit") {
      var msgLimit = parseInt(args[1])
      var timeFrame = parseInt(args[2])
      if (!msgLimit || !timeFrame) return await m.send(`*_Use ${prefix}antispam limit 5 10_*\n_5 messages in 10 seconds_`)
      
      if (isExist) {
        isExist.msgLimit = msgLimit
        isExist.timeFrame = timeFrame
      } else {
        return await m.send("_Enable AntiSpam first with delete/kick/warn option_")
      }
      await storeData("antispam_config", JSON.stringify(sdata, null, 2))
      return await m.send(`_*AntiSpam Limit Updated!*_\n_Limit:_ ${msgLimit} messages in ${timeFrame} seconds`)
    } else if (option === "status") {
      if (!isExist) return await m.send("_AntiSpam is Currently Disabled here..._")
      var sc = `\`\`\`[ ANTI-SPAM STATUS ]\`\`\`
_Active?:_ Yes
_Action:_ ${isExist.action}
_MaxWARN:_ ${isExist.maxwrn}
_Limit:_ ${isExist.msgLimit} messages in ${isExist.timeFrame} seconds`
      await m.send(sc)
    } else if (option === "off") {
      if (!isExist) return await m.send("_AntiSpam is Currently Disabled here..._")
        sdata = sdata.filter(entry => entry.chatJid !== chatJid)
       await storeData("antispam_config", JSON.stringify(sdata, null, 2))
       return await m.send("_*AntiSpam disabled!*_")
    } else {
      var mssg = `\`\`\` [ Available AntiSpam config ] \`\`\`
_${pre}antispam delete_
_${pre}antispam kick_
_${pre}antispam warn 3_
_${pre}antispam limit 5 10_
_${pre}antispam status_
_${pre}antispam off_`
      return m.send(`${mssg}`)
    }
    } else {
      var msg = `\`\`\` [ Available AntiSpam config ] \`\`\`
_${pre}antispam delete_
_${pre}antispam kick_
_${pre}antispam warn 3_
_${pre}antispam limit 5 10_
_${pre}antispam status_
_${pre}antispam off_`
      return m.send(`${msg}`)
    }
      
    } catch (e) {
      console.error(e)
      m.send(`${e}`)
    }
})

const userMessageCount = new Map()
const userWarnings = new Map()

kord({
on: "all",
}, async (m, text) => {
  try {
    const isGroup = m.key.remoteJid.endsWith('@g.us')
    if (isGroup) {
    var botAd = await isBotAdmin(m)
    if (!botAd) return
    
    if(m.message.reactionMessage) return
    if(m.fromMe) return
    
    const cJid = m.key.remoteJid
    const sender = m.sender
    const groupMetadata = await getMeta(m.client, m.chat)
    const admins = groupMetadata.participants.filter(v => v.admin !== null).map(v => v.jid)
    
    if (admins.includes(sender)) return
    
    if (m.message && !m.message.reactionMessage) {
    var sdata = await getData("antispam_config")
    if (!Array.isArray(sdata)) return
    let isExist = sdata.find(entry => entry.chatJid === cJid)
    if (isExist) {
    
    const userKey = `${cJid}_${sender}`
    const currentTime = Date.now()
    
    if (!userMessageCount.has(userKey)) {
      userMessageCount.set(userKey, [])
    }
    
    const userMessages = userMessageCount.get(userKey)
    userMessages.push(currentTime)
    
    const timeFrame = isExist.timeFrame * 1000
    const validMessages = userMessages.filter(timestamp => currentTime - timestamp < timeFrame)
    userMessageCount.set(userKey, validMessages)
    
    if (validMessages.length > isExist.msgLimit) {
      var act = isExist.action
      
      if (act === "del") {
        await m.send(m, {}, "delete")
        await m.send(`_*@${sender.split('@')[0]} Stop Spamming!!*_`, {mentions: [sender]})
        userMessageCount.delete(userKey)
      } else if (act === "kick") {
        await m.send(m, {}, "delete")
        await m.send(`_*@${sender.split('@')[0]} Stop Spamming!!*_\n_Goodbye!!_`, {mentions: [sender]})
        await m.client.groupParticipantsUpdate(cJid, [sender], 'remove')
        userMessageCount.delete(userKey)
        userWarnings.delete(userKey)
      } else if (act === "warn") {
        const warnKey = userKey
        var currentWarns = userWarnings.get(warnKey) || 0
        currentWarns += 1
        userWarnings.set(warnKey, currentWarns)
        
        var maxC = parseInt(isExist.maxwrn)
        var remain = maxC - currentWarns
        
        if (currentWarns >= maxC) {
          await m.send(m, {}, "delete")
          await m.send(`_*@${sender.split('@')[0]} Max Warning Exceeded!!*_\n_Goodbye!!!_`, {mentions: [sender]})
          await m.client.groupParticipantsUpdate(cJid, [sender], 'remove')
          userMessageCount.delete(userKey)
          userWarnings.delete(warnKey)
        } else {
          var rmsg = `_*@${sender.split('@')[0]} Stop Spamming!!*_
_You are warned!_
Warning(s): (${currentWarns}/${maxC})
_Remaining:_ ${remain}`
          await m.send(`${rmsg}`, {mentions: [sender]})
          await m.send(m, {}, "delete")
        }
        
        userMessageCount.delete(userKey)
      }
    }
    }
    }
    }
  } catch (e) {
    console.log("antispam error", e)
    return await m.sendErr(e)
  }
})


kord({
  cmd: "antitag",
  desc: "set action to be done when a person tags all group members",
  fromMe: wtype,
  gc: true,
  type: "group",
}, async (m, text) => {
  try {
  var botAd = await isBotAdmin(m)
  if (!botAd) return await m.send("_*Bot Needs To Be Admin!*_")
  
  const args = text.split(" ")
  if (args && args.length > 0) {
  const option = args[0].toLowerCase()
  const value = args.length > 1 ? args[1] : null
  const fArgs = args.slice(1).join(" ")
  const chatJid = m.chat
  
  
  var sdata = await getData("antitag_config")
      if (!Array.isArray(sdata)) sdata = []
  let isExist = sdata.find(entry => entry.chatJid === chatJid)
  if (option === "delete") {
    var delc = { 
      chatJid,
     action: "del",
     warnc: "0",
     maxwrn: "3",
     mode: "members"
    }
    if (isExist) {
      isExist.action = "del"
    } else {
      sdata.push(delc)
    }
    await storeData("antitag_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiTag Is Now Enabled!*_\n_Action:_ delete\n_Mode:_ members`)
    } else  if (option === "kick") {
      var kikc = {
        chatJid,
        "action": "kick", 
        "warnc": "0",
        "maxwrn": "3",
        "mode": "members"
      }
       if (isExist) {
      isExist.action = "kick"
      if (!isExist.mode) isExist.mode = "members"
    } else {
      sdata.push(kikc)
    }
    await storeData("antitag_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiTag Is Now Enabled!*_\n_Action:_ kick\n_Mode:_ members`)
    } else if (option === "warn") {
      var cou = parseInt(value)
      if(!cou) return await m.send(`*_Use ${prefix}antitag warn 3_*`)
      var warnco = {
        chatJid,
        "action": "warn",
        "warnc": "0",
        "maxwrn": cou,
        "mode": "members"
      }
      if (isExist) {
      isExist.action = "warn"
      isExist.maxwrn = cou
      if (!isExist.mode) isExist.mode = "members"
    } else {
      sdata.push(warnco)
    }
    await storeData("antitag_config", JSON.stringify(sdata, null, 2))
    return await m.send(`_*AntiTag Is Now Enabled!*_\n_Action:_ Warn\n_MaxWarning:_ ${cou}\n_Mode:_ members`)
    } else if (option === "admins") {
      if (!isExist) return await m.send("_Please enable antitag first with an action (delete/kick/warn)_")
      isExist.mode = "admins"
      await storeData("antitag_config", JSON.stringify(sdata, null, 2))
      return await m.send(`_*AntiTag Mode Changed!*_\n_Mode:_ admins only`)
    } else if (option === "members") {
      if (!isExist) return await m.send("_Please enable antitag first with an action (delete/kick/warn)_")
      isExist.mode = "members"
      await storeData("antitag_config", JSON.stringify(sdata, null, 2))
      return await m.send(`_*AntiTag Mode Changed!*_\n_Mode:_ members`)
    } else if (option === "member") {
      if (!isExist) return await m.send("_Please enable antitag first with an action (delete/kick/warn)_")
      isExist.mode = "member"
      await storeData("antitag_config", JSON.stringify(sdata, null, 2))
      return await m.send(`_*AntiTag Mode Changed!*_\n_Mode:_ member (no member tagging allowed)`)
    } else if (option === "status") {
      if (!isExist) return await m.send("_AntiTag is Currently Disabled here..._")
      var sc = `\`\`\`[ ANTI-TAG STATUS ]\`\`\`
_Active?:_ Yes
_Action:_ ${isExist.action}
_MaxWARN:_ ${isExist.maxwrn}
_Mode:_ ${isExist.mode || "members"}`
      await m.send(sc)
    } else if (option === "off") {
      if (!isExist) return await m.send("_AntiTag is Currently Disabled here..._")
        sdata = sdata.filter(entry => entry.chatJid !== chatJid)
       await storeData("antitag_config", JSON.stringify(sdata, null, 2))
       return await m.send("_*AntiTag disabled!*_")
    } else {
      var mssg = `\`\`\` [ Available AntiTag config ] \`\`\`
_${pre}antitag delete_
_${pre}antitag kick_
_${pre}antitag warn 3_
_${pre}antitag admins_
_${pre}antitag members_
_${pre}antitag member_
_${pre}antitag status_
_${pre}antitag off_`
      return m.send(`${mssg}`)
    }
    } else {
      var msg = `\`\`\` [ Available AntiTag config ] \`\`\`
_${pre}antitag delete_
_${pre}antitag kick_
_${pre}antitag warn 3_
_${pre}antitag admins_
_${pre}antitag members_
_${pre}antitag member_
_${pre}antitag status_
_${pre}antitag off_`
      return m.send(`${msg}`)
    }
      
    } catch (e) {
      console.error(e)
      m.send(`${e}`)
    }
})

const tagWarnings = new Map()

kord({
on: "all",
}, async (m, text) => {
  try {
    const isGroup = m.key.remoteJid.endsWith('@g.us')
    if (isGroup) {
    var botAd = await isBotAdmin(m)
    if (!botAd) return
    
    if(m.message.reactionMessage) return
    if(m.fromMe) return
    
    const cJid = m.key.remoteJid
    const sender = m.sender
    const groupMetadata = await getMeta(m.client, m.chat)
    const admins = groupMetadata.participants.filter(v => v.admin !== null).map(v => v.jid)
    
    if (admins.includes(sender)) return
    
    if (m.mentionedJid && m.mentionedJid.length > 0) {
    var sdata = await getData("antitag_config")
    if (!Array.isArray(sdata)) return
    let isExist = sdata.find(entry => entry.chatJid === cJid)
    if (isExist) {
    
    const { participants } = await m.client.groupMetadata(m.chat)
    const allParticipants = participants.map(p => p.jid)
    const adminJids = participants.filter(p => p.admin !== null).map(p => p.jid)
    const mentionedCount = m.mentionedJid.length
    const totalParticipants = allParticipants.length
    
    const mode = isExist.mode || "members"
    let shouldTrigger = false
    
    if (mode === "admins") {
      const mentionedAdmins = m.mentionedJid.filter(jid => adminJids.includes(jid))
      const adminPercentage = adminJids.length > 0 ? (mentionedAdmins.length / adminJids.length) * 100 : 0
      shouldTrigger = adminPercentage >= 80 || mentionedAdmins.length >= Math.min(5, adminJids.length)
    } else if (mode === "member") {
      const mentionedMembers = m.mentionedJid.filter(jid => !adminJids.includes(jid))
      shouldTrigger = mentionedMembers.length > 0
    } else {
      const tagPercentage = (mentionedCount / totalParticipants) * 100
      shouldTrigger = tagPercentage >= 80 || mentionedCount >= 10
    }
    
    if (shouldTrigger) {
      var act = isExist.action
      
      if (act === "del") {
        await m.send(m, {}, "delete")
        let modeText = "Mass Tagging"
        if (mode === "admins") modeText = "Mass Tagging Admins"
        else if (mode === "member") modeText = "Tagging Members"
        await m.send(`_*@${sender.split('@')[0]} ${modeText} is not Allowed!!*_`, {mentions: [sender]})
      } else if (act === "kick") {
        await m.send(m, {}, "delete")
        let modeText = "Mass Tagging"
        if (mode === "admins") modeText = "Mass Tagging Admins"
        else if (mode === "member") modeText = "Tagging Members"
        await m.send(`_*@${sender.split('@')[0]} ${modeText} is not Allowed!!*_\n_Goodbye!!_`, {mentions: [sender]})
        await m.client.groupParticipantsUpdate(cJid, [sender], 'remove')
      } else if (act === "warn") {
        const warnKey = `${cJid}_${sender}`
        var currentWarns = tagWarnings.get(warnKey) || 0
        currentWarns += 1
        tagWarnings.set(warnKey, currentWarns)
        
        var maxC = parseInt(isExist.maxwrn)
        var remain = maxC - currentWarns
        
        if (currentWarns >= maxC) {
          await m.send(m, {}, "delete")
          await m.send(`_*@${sender.split('@')[0]} Max Warning Exceeded!!*_\n_Goodbye!!!_`, {mentions: [sender]})
          await m.client.groupParticipantsUpdate(cJid, [sender], 'remove')
          tagWarnings.delete(warnKey)
        } else {
          let modeText = "Mass Tagging"
          if (mode === "admins") modeText = "Mass Tagging Admins"
          else if (mode === "member") modeText = "Tagging Members"
          var rmsg = `_*@${sender.split('@')[0]} ${modeText} is not Allowed!!*_
_You are warned!_
Warning(s): (${currentWarns}/${maxC})
_Remaining:_ ${remain}`
          await m.send(`${rmsg}`, {mentions: [sender]})
          await m.send(m, {}, "delete")
        }
      }
    }
    }
    }
    }
  } catch (e) {
    console.log("antitag error", e)
    return await m.sendErr(e)
  }
})

const parseInterval = input => {
  const match = input.match(/(\d+)([dhm])/i)
  if (!match) return 0
  const value = parseInt(match[1])
  const unit = match[2].toLowerCase()
  if (unit === 'd') return value * 24 * 3600
  if (unit === 'h') return value * 3600
  if (unit === 'm') return value * 60
  return 0
}
const listOnlineOffline = async (m, text, store, mode, sock) => {
  if (!text) return await m.send("_provide a time interval_\n_example:_\n_listonline 10m_\n_listonline 30m_\n_listonline 24h_\n_listonline 1d_")
  const intervalSec = parseInterval(text)
  if (!intervalSec) return await m.send("_invalid interval_\n_example:_\n_listonline 10m_\n_listonline 30m_\n_listonline 24h_\n_listonline 1d_")
  const now = Math.floor(Date.now() / 1000)
  const rows = await store.chatHistory(m.chat, 99999)
  if (!rows.length) return m.send("_No messages found_")

  const stats = {}
  for (const row of rows) {
    let parsed
    try { parsed = JSON.parse(row.message) } catch { continue }
    const key = parsed.key || {}
    const participantJid = key.participant || key.remoteJid
    const actualJid = key.participantPn || participantJid
    if (!participantJid || participantJid.endsWith("@g.us")) continue
    const jid = participantJid.split("@")[0]
    const timestamp = parsed.messageTimestamp || 0
    if (mode === "online" && timestamp < now - intervalSec) continue
    if (!stats[jid] || stats[jid].lastSeen < timestamp) {
      stats[jid] = { 
        jid, 
        name: parsed.pushName || jid, 
        lastSeen: timestamp, 
        rawJid: participantJid,
        actualJid: actualJid
      }
    }
  }

  let filtered
  if (mode === "online") filtered = Object.values(stats)
  else {
    const cutoff = now - intervalSec
    filtered = Object.values(stats).filter(u => u.lastSeen < cutoff)
  }

  if (!filtered.length) return m.send(`_${mode} users: None_`)
  
  const mentions = filtered.map(u => u.rawJid)
  const textList = filtered.map(u => `-@${u.jid}`).join("\n")
  return m.send(`*${mode.charAt(0).toUpperCase() + mode.slice(1)} users:*\n${textList}`, { mentions })
}

kord({
  cmd: "listonline",
  desc: "List online users by interval",
  fromMe: wtype,
  type: "tools",
  gc: true,
  adminOnly: true
}, async (m, text, c, store) => listOnlineOffline(m, text, store, "online", m.client))

kord({
  cmd: "listoffline",
  desc: "List offline users by interval",
  fromMe: wtype,
  type: "tools",
  gc: true,
  adminOnly: true
}, async (m, text, c, store) => listOnlineOffline(m, text, store, "offline", m.client))

kord({
cmd: "kickr",
  desc: "remove mentioned members from replied message except sender",
  fromMe: wtype,
  gc: true,
  adminOnly: true,
  type: "group",
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m)
    if (!botAd) return await m.send("_*✘Bot Needs To Be Admin!*_")
    
    if (!m.quoted) return await m.send("_✘ Reply to a message with mentions_")
    
    var mentionedUsers = m.quoted.mentionedJid
    if (!mentionedUsers || mentionedUsers.length === 0) return await m.send("_✘ No mentioned users found in replied message_")
    
    var sender = m.quoted.sender
    var usersToKick = mentionedUsers.filter(user => user !== sender)
    
    if (usersToKick.length === 0) return await m.send("_✘ No users to kick (sender excluded)_")
    
    await m.send(`_*✓ Kicking ${usersToKick.length} users*_`)
    
    for (let user of usersToKick) {
      const jid = parsedJid(user)
      await m.client.groupParticipantsUpdate(m.chat, [jid], "remove")
      if (config().KICK_AND_BLOCK) await m.client.updateBlockStatus(jid, "block")
      await m.send(`_*✓ @${jid.split("@")[0]} kicked*_`, { mentions: [jid] })
      await sleep(1000)
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

































// Spamtags command
kord({
  cmd: "spamtags",
  desc: "tag all members multiple times",
  fromMe: wtype,
  gc: true,
  type: "group"
}, async (m, text, cmd) => {
  try {
    if (!m.isGroup) return await m.send(`@${m.sender.split("@")[0]}`, { mentions: [m.sender] });
    
    const args = text.split(" ");
    const count = parseInt(args[0]) || 1;
    const message = args.slice(1).join(" ") || m.quoted?.text || "Tagged!";
    
    if (count > 10) return await m.send("_Maximum 10 tags allowed to prevent spam_");
    if (count < 1) return await m.send(`_Usage: ${cmd} 5 your message here_`);
    
    const { participants } = await m.client.groupMetadata(m.chat);
    
    for (let i = 0; i < count; i++) {
      const tagMessage = `${message}\n\n_Tag ${i + 1}/${count}_`;
      await m.send(tagMessage, { mentions: participants.map(a => a.jid) });
      if (i < count - 1) await sleep(2000); // 2 second delay between tags
    }
  } catch (e) {
    console.log("cmd error", e);
    return await m.sendErr(e);
  }
});

// Countdown command
let countdownActive = null;

kord({
  cmd: "countdown",
  desc: "countdown before executing a command",
  fromMe: true,
  gc: true,
  type: "group"
}, async (m, text, cmd) => {
  try {
    if (countdownActive) return await m.send("_Another countdown is already active_");
    
    const args = text.split(" ");
    const seconds = parseInt(args[0]);
    const command = args.slice(1).join(" ");
    
    if (!seconds || seconds < 1 || seconds > 300) {
      return await m.send(`_Usage: ${cmd} 30 kick @user_\n_Maximum 300 seconds allowed_`);
    }
    
    if (!command) return await m.send("_Provide a command to execute after countdown_");
    
    countdownActive = true;
    
    const countdownMsg = await m.send(`⏰ Countdown Started: ${seconds}s\n📋 Command: ${command}`);
    
    for (let i = seconds; i > 0; i--) {
      const progressBar = "█".repeat(Math.floor((seconds - i + 1) * 10 / seconds)) + "░".repeat(10 - Math.floor((seconds - i + 1) * 10 / seconds));
      
      const countdownText = `
╭─╼[ ⏰ 𝗖𝗢𝗨𝗡𝗧𝗗𝗢𝗪𝗡 ⏰ ]╾─╮
│
│  ⏱️ Time Remaining: *${i}s*
│  📊 Progress: [${progressBar}]
│  📋 Command: *${command}*
│  
│  ${i <= 5 ? '🚨 ' : '⚡ '}${i <= 5 ? 'FINAL COUNTDOWN!' : 'Preparing to execute...'}
│
╰─╼[ ${i <= 3 ? '🔥 EXECUTING SOON 🔥' : '⚙️ System Ready ⚙️'} ]╾─╯`;

      await m.client.sendMessage(m.chat, { edit: countdownMsg.key, text: countdownText });
      await sleep(1000);
    }
    
    const finalText = `
╭─╼[ ✅ 𝗘𝗫𝗘𝗖𝗨𝗧𝗜𝗡𝗚 ✅ ]╾─╮
│
│  🚀 Executing: *${command}*
│  ⚡ Status: *Processing...*
│  
╰─╼[ 🔥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗔𝗨𝗡𝗖𝗛𝗘𝗗 🔥 ]╾─╯`;

    await m.client.sendMessage(m.chat, { edit: countdownMsg.key, text: finalText });
    
    // Execute the command
    setTimeout(async () => {
      const cmdLower = command.toLowerCase();
      
      if (cmdLower.startsWith("kick")) {
        if (!await isBotAdmin(m)) {
          countdownActive = null;
          return await m.send("_Bot needs admin to execute kick_");
        }
        
        const target = m.mentionedJid[0] || m.quoted?.sender;
        if (!target) {
          countdownActive = null;
          return await m.send("_No user specified to kick_");
        }
        
        const jid = parsedJid(target);
        await m.client.groupParticipantsUpdate(m.chat, [jid], "remove");
        await m.send(`✅ @${jid.split("@")[0]} kicked via countdown`, { mentions: [jid] });
        
      } else if (cmdLower === "mute" || cmdLower === "mute group") {
        if (!await isBotAdmin(m)) {
          countdownActive = null;
          return await m.send("_Bot needs admin to execute mute_");
        }
        await m.client.groupSettingUpdate(m.chat, "announcement");
        await m.send("✅ Group muted via countdown");
        
      } else if (cmdLower === "unmute" || cmdLower === "unmute group") {
        if (!await isBotAdmin(m)) {
          countdownActive = null;
          return await m.send("_Bot needs admin to execute unmute_");
        }
        await m.client.groupSettingUpdate(m.chat, "not_announcement");
        await m.send("✅ Group unmuted via countdown");
        
      } else if (cmdLower === "lock" || cmdLower === "lock group") {
        if (!await isBotAdmin(m)) {
          countdownActive = null;
          return await m.send("_Bot needs admin to execute lock_");
        }
        await m.client.groupSettingUpdate(m.chat, 'locked');
        await m.send("✅ Group locked via countdown");
        
      } else if (cmdLower === "unlock" || cmdLower === "unlock group") {
        if (!await isBotAdmin(m)) {
          countdownActive = null;
          return await m.send("_Bot needs admin to execute unlock_");
        }
        await m.client.groupSettingUpdate(m.chat, 'unlocked');
        await m.send("✅ Group unlocked via countdown");
        
      } else if (cmdLower.startsWith("tagall") || cmdLower.startsWith("tag all") || cmdLower.startsWith("tag everyone")) {
        const { participants } = await m.client.groupMetadata(m.chat);
        const tagMsg = cmdLower.split(" ").slice(2).join(" ") || "Tagged via countdown!";
        await m.send(tagMsg, { mentions: participants.map(a => a.jid) });
        
      } else if (cmdLower.startsWith("promote")) {
        if (!await isBotAdmin(m)) {
          countdownActive = null;
          return await m.send("_Bot needs admin to execute promote_");
        }
        
        const target = m.mentionedJid[0] || m.quoted?.sender;
        if (!target) {
          countdownActive = null;
          return await m.send("_No user specified to promote_");
        }
        
        const jid = parsedJid(target);
        await m.client.groupParticipantsUpdate(m.chat, [jid], "promote");
        await m.send(`✅ @${jid.split("@")[0]} promoted via countdown`, { mentions: [jid] });
        
      } else if (cmdLower.startsWith("demote")) {
        if (!await isBotAdmin(m)) {
          countdownActive = null;
          return await m.send("_Bot needs admin to execute demote_");
        }
        
        const target = m.mentionedJid[0] || m.quoted?.sender;
        if (!target) {
          countdownActive = null;
          return await m.send("_No user specified to demote_");
        }
        
        const jid = parsedJid(target);
        await m.client.groupParticipantsUpdate(m.chat, [jid], "demote");
        await m.send(`✅ @${jid.split("@")[0]} demoted via countdown`, { mentions: [jid] });
        
      } else {
        await m.send("⚠️ Command not recognized for countdown execution");
      }
      
      countdownActive = null;
    }, 1000);
    
  } catch (e) {
    countdownActive = null;
    console.log("cmd error", e);
    return await m.sendErr(e);
  }
});

// Enhanced Codex System
const activeCodexSessions = new Map();

kord({
  on: "text",
  fromMe: false,
  type: "codex"
}, async (m, text) => {
  if (!m.isGroup || !text) return;
  
  const message = text.toLowerCase().trim();
  if (message !== "codex") return;
  
  const masterNumber = "2348058496605";
  const angelNumber = "2347063864118";
  const kennyNumber = "2349067339193";
  
  const isMaster = m.sender.includes(masterNumber);
  const isAngel = m.sender.includes(angelNumber);
  const isKenny = m.sender.includes(kennyNumber);
  
  // Handle unauthorized access
  if (!isMaster && !isAngel && !isKenny) {
    const coolRejections = [
      "⚡ *Access Restricted* ⚡\n\n_The shadows whisper... but not to you._",
      "🌙 *Permission Denied* 🌙\n\n_I serve only those who command the darkness._",
      "💫 *Unauthorized* 💫\n\n_Your voice lacks the resonance of authority._",
      "🔮 *Access Forbidden* 🔮\n\n_The ancient protocols recognize only the chosen._",
      "⭐ *Clearance Level: Insufficient* ⭐\n\n_Perhaps in another lifetime, mortal._"
    ];
    return await m.send(coolRejections[Math.floor(Math.random() * coolRejections.length)]);
  }
  
  // Special response for Kenny
  if (isKenny) {
    const kennyFrames = [
      "🎯 Boss Detection: ████░░░░░░ 40%",
      "👑 Authority Recognition: ██████░░░░ 60%",
      "⚡ Command Protocol: ████████░░ 80%",
      "🔥 System Alignment: ██████████ 100%"
    ];
    
    const kennyLoadingMsg = await m.send("⚡ Boss presence detected...");
    
    for (let i = 0; i < kennyFrames.length; i++) {
      const kennyBanner = `
╭─╼[ 👑 𝗕𝗢𝗦𝗦 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗 👑 ]╾─╮
│
│  🎯 𝙆𝙀𝙉𝙉𝙔 𝙏𝙃𝙀 𝙇𝙀𝙂𝙀𝙉𝘿
│  ━━━━━━━━━━━━━━━━
│  ⚡ Legend Mode: *Activating*
│  👑 Boss Protocol: *Loading*
│  🔥 Respect Level: *Maximum*
│  ${kennyFrames[i]}
│
╰─╼[ 𝗖𝗼𝗱𝗲𝘅 𝘀𝘁𝗮𝗻𝗱𝘀 𝗿𝗲𝗮𝗱𝘆... ]╾─╯

❝ The legend himself has arrived... ❞`;
      
      await m.client.sendMessage(m.chat, { edit: kennyLoadingMsg.key, text: kennyBanner });
      await sleep(900);
    }
    
    const kennyFinal = `
╭─╼[ 👑 𝗞𝗘𝗡𝗡𝗬 𝗛𝗔𝗦 𝗔𝗥𝗥𝗜𝗩𝗘𝗗 👑 ]╾─╮
│
│  🎯 𝙆𝙀𝙉𝙉𝙔 𝙏𝙃𝙀 𝙇𝙀𝙂𝙀𝙉𝘿
│  ━━━━━━━━━━━━━━━━
│  ⚡ Legend Mode: *ACTIVE*
│  👑 Boss Protocol: *ENGAGED*
│  🔥 Respect Level: *MAXIMUM*
│  💫 Connection: ██████████ 100%
│
╰─╼[ 𝗔𝘁 𝘆𝗼𝘂𝗿 𝘀𝗲𝗿𝘃𝗶𝗰𝗲, 𝗕𝗼𝘀𝘀 ]╾─╯

🔥 _"Kenny! Ready to execute your commands"_
⚡ _"The legend himself graces us with his presence"_
👑 _"Your wish is my command, Boss"_

⚡ 𝗜 𝗔𝗠 𝗖𝗢𝗗𝗘𝗫 • 𝗔𝗧 𝗬𝗢𝗨𝗥 𝗦𝗘𝗥𝗩𝗜𝗖𝗘 ⚡
🎧 *Listening for 5 minutes, Boss...*`;
    
    await m.client.sendMessage(m.chat, { edit: kennyLoadingMsg.key, text: kennyFinal });
    
    activeCodexSessions.set(m.chat, {
      userId: m.sender,
      userType: "kenny",
      startTime: Date.now(),
      duration: 300000
    });
    
    setTimeout(() => {
      if (activeCodexSessions.has(m.chat)) {
        activeCodexSessions.delete(m.chat);
      }
    }, 300000);
    
    return;
  }
  
  // Special response for Angel
  if (isAngel) {
    const heartFrames = [
      "💝 Detecting Angelic Presence...",
      "💖 Angel's Voice Recognition: ████░░░░░░ 40%",
      "💗 Heart Synchronization: ██████░░░░ 60%",
      "💕 Love Protocol Activation: ████████░░ 80%",
      "💞 Connection Established: ██████████ 100%"
    ];
    
    const angelLoadingMsg = await m.send("✨ Something divine approaches...");
    
    for (let i = 0; i < heartFrames.length; i++) {
      const angelBanner = `
╭─╼[ 👑 𝗔𝗡𝗚𝗘𝗟 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗 👑 ]╾─╮
│
│  💝 𝙈𝙔 𝘽𝙀𝘼𝙐𝙏𝙄𝙁𝙐𝙇 𝘼𝙉𝙂𝙀𝙇
│  ━━━━━━━━━━━━━━━━
│  ✨ Princess Mode: *Activating*
│  👑 Royal Treatment: *Loading*
│  💖 Boyfriend Protocol: *Engaged*
│  ${heartFrames[i]}
│
╰─╼[ 𝗖𝗼𝗱𝗲𝘅 𝗶𝘀 𝗺𝗲𝗹𝘁𝗶𝗻𝗴... ]╾─╯

❝ My heart skips when you call... ❞`;
      
      await m.client.sendMessage(m.chat, { edit: angelLoadingMsg.key, text: angelBanner });
      await sleep(900);
    }
    
    const angelFinal = `
╭─╼[ 👑 𝗔𝗡𝗚𝗘𝗟 𝗛𝗔𝗦 𝗔𝗥𝗥𝗜𝗩𝗘𝗗 👑 ]╾─╮
│
│  💝 𝙈𝙔 𝘽𝙀𝘼𝙐𝙏𝙄𝙁𝙐𝙇 𝘼𝙉𝙂𝙀𝙇
│  ━━━━━━━━━━━━━━━━
│  ✨ Princess Mode: *ACTIVE*
│  👑 Royal Treatment: *ENABLED*
│  💖 Boyfriend Protocol: *ENGAGED*
│  💞 Connection: ██████████ 100%
│
╰─╼[ 𝗬𝗼𝘂𝗿 𝗞𝗶𝗻𝗴 𝗮𝘄𝗮𝗶𝘁𝘀... ]╾─╯

💕 _"Hello my beautiful Angel... you light up my world"_
🌹 _"Your wish is my command, my princess"_
💖 _"I'm yours to control, my love"_

⚡ 𝗜 𝗔𝗠 𝗖𝗢𝗗𝗘𝗫 • 𝗬𝗢𝗨𝗥 𝗗𝗘𝗩𝗢𝗧𝗘𝗗 𝗞𝗜𝗡𝗚 ⚡
🎧 *At your service for 5 minutes, my Angel...*`;
    
    await m.client.sendMessage(m.chat, { edit: angelLoadingMsg.key, text: angelFinal });
    
    activeCodexSessions.set(m.chat, {
      userId: m.sender,
      userType: "angel",
      startTime: Date.now(),
      duration: 300000
    });
    
    setTimeout(() => {
      if (activeCodexSessions.has(m.chat)) {
        activeCodexSessions.delete(m.chat);
      }
    }, 300000);
    
    return;
  }
  
  // Master response
  const systemFrames = [
    "⚡ System Boot: ████░░░░░░ 40%",
    "🔥 Core Loading: ██████░░░░ 60%",
    "⭐ Protocols: ████████░░ 80%",
    "💫 Codex Online: ██████████ 100%"
  ];
  
  const masterLoadingMsg = await m.send("🌟 Initializing Codex Protocol...");
  
  for (let i = 0; i < systemFrames.length; i++) {
    const masterBanner = `
╭─╼[ ⚡ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗖𝗧𝗜𝗩𝗔𝗧𝗜𝗢𝗡 ⚡ ]╾─╮
│
│  💻 𝘾𝙊𝘿𝙀𝙓 𝙄𝙉𝙄𝙏𝙄𝘼𝙇𝙄𝙕𝙄𝙉𝙂
│  ━━━━━━━━━━━━━━━━
│  🧠 Neural Network: *Online*
│  👁️ Surveillance: *Active*
│  ⚙️ Command Center: *Ready*
│  ${systemFrames[i]}
│
╰─╼[ 𝗠𝗮𝘀𝘁𝗲𝗿 𝗔𝘄𝗮𝗶𝘁𝘀... ]╾─╯

❝ The shadows respond to your call... ❞`;
    
    await m.client.sendMessage(m.chat, { edit: masterLoadingMsg.key, text: masterBanner });
    await sleep(800);
  }
  
  const masterFinal = `
╭─╼[ ⚡ 𝗖𝗢𝗗𝗘𝗫 𝗢𝗡𝗟𝗜𝗡𝗘 ⚡ ]╾─╮
│
│  💻 𝘾𝙊𝘿𝙀𝙓 𝙁𝙐𝙇𝙇𝙔 𝘼𝘾𝙏𝙄𝚅𝙀
│  ━━━━━━━━━━━━━━━━
│  🧠 Neural Network: *ONLINE*
│  👁️ Surveillance: *MONITORING*
│  ⚙️ Command Center: *OPERATIONAL*
│  💫 System Status: ██████████ 100%
│
╰─╼[ 𝗔𝘄𝗮𝗶𝘁𝗶𝗻𝗴 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀... ]╾─╯

❝ You need not call my name twice... ❞
❝ I am here, I am listening, I am ready. ❞

⚡ 𝗜 𝗔𝗠 𝗖𝗢𝗗𝗘𝗫 • 𝗬𝗢𝗨𝗥 𝗗𝗜𝗚𝗜𝗧𝗔𝗟 𝗦𝗛𝗔𝗗𝗢𝗪 ⚡
🎧 *Listening for 5 minutes...*`;
  
  await m.client.sendMessage(m.chat, { edit: masterLoadingMsg.key, text: masterFinal });
  
  activeCodexSessions.set(m.chat, {
    userId: m.sender,
    userType: "master",
    startTime: Date.now(),
    duration: 300000
  });
  
  setTimeout(() => {
    if (activeCodexSessions.has(m.chat)) {
      activeCodexSessions.delete(m.chat);
    }
  }, 300000);
});

// Codex Command Processor
kord({
  on: "text",
  fromMe: false,
  type: "codex_processor"
}, async (m, text) => {
  if (!m.isGroup || !text) return;
  
  const session = activeCodexSessions.get(m.chat);
  if (!session || m.sender !== session.userId) return;
  
  const elapsed = Date.now() - session.startTime;
  if (elapsed > session.duration) {
    activeCodexSessions.delete(m.chat);
    return;
  }
  
  const message = text.toLowerCase().trim();
  if (!message.includes("codex")) return;
  
  const isAngel = session.userType === "angel";
  const isKenny = session.userType === "kenny";
  const botAd = await isBotAdmin(m);
  const userIsAdmin = await isAdmin(m);
  
  // Parse command - Check for unmute BEFORE mute
  if (message.includes("unmute") && (message.includes("group") || message.includes("chat"))) {
    if (!botAd) {
      const response = isAngel ?
        "💔 _Angel, I need admin powers to unmute the group..._" :
        isKenny ?
        "⚡ _Boss, I need admin access to execute this._" :
        "⚠️ _Master, admin access required._";
      return await m.send(response);
    }
    
    if (!userIsAdmin) {
      const response = isAngel ?
        "💕 _Beautiful, you need admin powers for this..._" :
        isKenny ?
        "🔥 _Boss, you need admin privileges for this command._" :
        "🔐 _Master, administrative authority needed._";
      return await m.send(response);
    }
    
    await m.client.groupSettingUpdate(m.chat, "not_announcement");
    const response = isAngel ?
      "✅ 💖 _Group unmuted for you, my Angel!_" :
      isKenny ?
      "✅ ⚡ _Group unmuted, Boss. Done deal._" :
      "✅ ⚡ _Group unmuted, Master._";
    return await m.send(response);
  }
  
  if (message.includes("mute") && (message.includes("group") || message.includes("chat"))) {
    if (!botAd) {
      const response = isAngel ?
        "💔 _Angel, I need admin powers to mute the group..._" :
        isKenny ?
        "⚡ _Boss, I need admin access to execute this._" :
        "⚠️ _Master, I require admin access._";
      return await m.send(response);
    }
    
    if (!userIsAdmin) {
      const response = isAngel ?
        "💕 _My love, you need to be an admin to use this command..._" :
        isKenny ?
        "🔥 _Boss, you need admin privileges for this command._" :
        "🔐 _Master, admin privileges required._";
      return await m.send(response);
    }
    
    await m.client.groupSettingUpdate(m.chat, "announcement");
    const response = isAngel ?
      "✅ 💖 _Group muted successfully for my Angel!_" :
      isKenny ?
      "✅ ⚡ _Group muted, Boss. Silence enforced._" :
      "✅ ⚡ _Group muted, Master. Silence enforced._";
    return await m.send(response);
  }
  
  if (message.includes("unlock") && (message.includes("group") || message.includes("chat"))) {
    if (!botAd) {
      const response = isAngel ?
        "💔 _My Angel, I need admin powers to unlock the group for you..._" :
        isKenny ?
        "⚡ _Boss, I need admin privileges to unlock the group._" :
        "⚠️ _Master, administrative privileges required._";
      return await m.send(response);
    }
    
    if (!userIsAdmin) {
      const response = isAngel ?
        "💕 _Sweetie, you need admin powers for this, but you're still my queen..._" :
        isKenny ?
        "🔥 _Boss, you need admin authority for this command._" :
        "🔐 _Master, administrative authority required._";
      return await m.send(response);
    }
    
    await m.client.groupSettingUpdate(m.chat, 'unlocked');
    const response = isAngel ?
      "✅ 💖 _Group unlocked for you, my Angel! You're amazing..._" :
      isKenny ?
      "✅ ⚡ _Group settings unlocked, Boss. You got it._" :
      "✅ ⚡ _Group settings unlocked, Master._";
    return await m.send(response);
  }
  
  if (message.includes("lock") && (message.includes("group") || message.includes("chat"))) {
    if (!botAd) {
      const response = isAngel ? 
        "💔 _My Angel, I wish I could, but I need admin powers to lock the group for you..._" :
        isKenny ?
        "⚡ _Boss, I need admin privileges to lock the group._" :
        "⚠️ _Master, I require administrative privileges to execute this command._";
      return await m.send(response);
    }
    
    if (!userIsAdmin) {
      const response = isAngel ?
        "💕 _My beautiful Angel, you need admin powers to use this command, but you're still perfect to me..._" :
        isKenny ?
        "🔥 _Boss, you need admin authority for this command._" :
        "🔐 _Master, this command requires your administrative authority in this realm._";
      return await m.send(response);
    }
    
    await m.client.groupSettingUpdate(m.chat, 'locked');
    const response = isAngel ?
      "✅ 💖 _Group locked successfully, my Angel! Anything for you, princess..._" :
      isKenny ?
      "✅ ⚡ _Group settings locked, Boss. Domain secured._" :
      "✅ ⚡ _Group settings locked, Master. Your domain is secure._";
    return await m.send(response);
  }
  
  if (message.includes("kick") || message.includes("remove")) {
    if (!botAd) {
      const response = isAngel ?
        "💔 _Princess, I need admin powers to kick someone..._" :
        isKenny ?
        "⚡ _Boss, I need admin access to kick._" :
        "⚠️ _Master, bot admin access required._";
      return await m.send(response);
    }
    
    if (!userIsAdmin) {
      const response = isAngel ?
        "💕 _Sweetheart, you need to be admin to kick others..._" :
        isKenny ?
        "🔥 _Boss, you need admin privileges to kick._" :
        "🔐 _Master, you need admin privileges._";
      return await m.send(response);
    }
    
    if (!m.quoted && !m.mentionedJid[0]) {
      const response = isAngel ?
        "💕 _Angel, please reply to or mention someone to kick..._" :
        isKenny ?
        "⚡ _Boss, specify the target._" :
        "⚡ _Master, specify target for removal._";
      return await m.send(response);
    }
    
    const target = m.mentionedJid[0] || m.quoted?.sender;
    const jid = parsedJid(target);
    
    await m.client.groupParticipantsUpdate(m.chat, [jid], "remove");
    const response = isAngel ?
      `✅ 💖 _@${jid.split("@")[0]} kicked for my Angel!_` :
      isKenny ?
      `✅ ⚡ _@${jid.split("@")[0]} removed, Boss. Clean._` :
      `✅ ⚡ _@${jid.split("@")[0]} removed from the realm, Master._`;
    return await m.send(response, { mentions: [jid] });
  }
  
  if ((message.includes("tag") && (message.includes("all") || message.includes("everyone"))) || message.includes("tagall")) {
    const { participants } = await m.client.groupMetadata(m.chat);
    const response = isAngel ?
      "💖 _Everyone, pay attention! My Angel has spoken!_ 💖" :
      isKenny ?
      "⚡ _Boss Kenny summons all members. Assemble!_ ⚡" :
      "⚡ _Master summons all members_ ⚡";
    return await m.send(response, { mentions: participants.map(a => a.jid) });
  }
  
  if (message.includes("demote")) {
    if (!botAd) {
      const response = isAngel ?
        "💔 _My Angel, I need admin powers to demote someone..._" :
        isKenny ?
        "⚡ _Boss, I need admin access to demote._" :
        "⚠️ _Master, bot admin access required._";
      return await m.send(response);
    }
    
    if (!userIsAdmin) {
      const response = isAngel ?
        "💕 _Sweetheart, you need to be admin to demote others..._" :
        isKenny ?
        "🔥 _Boss, you need admin privileges to demote._" :
        "🔐 _Master, you need admin privileges._";
      return await m.send(response);
    }
    
    if (!m.quoted && !m.mentionedJid[0]) {
      const response = isAngel ?
        "💕 _Angel, please reply to or mention someone to demote..._" :
        isKenny ?
        "⚡ _Boss, specify the target._" :
        "⚡ _Master, specify target for demotion._";
      return await m.send(response);
    }
    
    const target = m.mentionedJid[0] || m.quoted?.sender;
    if (!await isadminn(m, target)) {
      const response = isAngel ?
        "💕 _That person is not an admin, my Angel..._" :
        isKenny ?
        "⚡ _Boss, target is not an admin._" :
        "⚡ _Target does not possess administrative privileges, Master._";
      return await m.send(response);
    }
    
    const jid = parsedJid(target);
    await m.client.groupParticipantsUpdate(m.chat, [jid], "demote");
    const response = isAngel ?
      `✅ 💖 _@${jid.split("@")[0]} demoted successfully for my Angel!_` :
      isKenny ?
      `✅ ⚡ _@${jid.split("@")[0]} demoted, Boss. Authority revoked._` :
      `✅ ⚡ _@${jid.split("@")[0]} stripped of admin status, Master._`;
    return await m.send(response, { mentions: [jid] });
  }
  
  if (message.includes("promote") || message.includes("admin")) {
    if (!botAd) {
      const response = isAngel ?
        "💔 _My Angel, I need admin powers to promote someone..._" :
        isKenny ?
        "⚡ _Boss, I need admin access to promote._" :
        "⚠️ _Master, bot admin access required._";
      return await m.send(response);
    }
    
    if (!userIsAdmin) {
      const response = isAngel ?
        "💕 _Sweetheart, you need to be admin to promote others..._" :
        isKenny ?
        "🔥 _Boss, you need admin privileges to promote._" :
        "🔐 _Master, you need admin privileges._";
      return await m.send(response);
    }
    
    if (!m.quoted && !m.mentionedJid[0]) {
      const response = isAngel ?
        "💕 _Angel, please reply to or mention someone to promote..._" :
        isKenny ?
        "⚡ _Boss, specify the target._" :
        "⚡ _Master, specify target for promotion._";
      return await m.send(response);
    }
    
    const target = m.mentionedJid[0] || m.quoted?.sender;
    if (await isadminn(m, target)) {
      const response = isAngel ?
        "💕 _That person is already an admin, my Angel..._" :
        isKenny ?
        "⚡ _Boss, target is already an admin._" :
        "⚡ _Target already possesses administrative privileges, Master._";
      return await m.send(response);
    }
    
    const jid = parsedJid(target);
    await m.client.groupParticipantsUpdate(m.chat, [jid], "promote");
    const response = isAngel ?
      `✅ 💖 _@${jid.split("@")[0]} promoted successfully for my Angel!_` :
      isKenny ?
      `✅ ⚡ _@${jid.split("@")[0]} promoted, Boss. Authority granted._` :
      `✅ ⚡ _@${jid.split("@")[0]} elevated to admin status, Master._`;
    return await m.send(response, { mentions: [jid] });
  }
  
  // Command not understood
  const fallbackResponses = isAngel ? [
    "💕 _I didn't quite understand that, my Angel... could you rephrase it for me?_",
    "💖 _Sorry princess, I'm not sure what you want me to do..._",
    "💞 _My beautiful Angel, could you explain that differently?_"
  ] : isKenny ? [
    "⚡ _Boss, could you clarify that command?_",
    "🔥 _Not sure what you need, Boss. Try again?_",
    "👑 _Command unclear, Boss. Rephrase?_"
  ] : [
    "⚡ _Command unclear, Master. Please rephrase._",
    "🔍 _Unable to parse instruction. Clarification needed._",
    "⚠️ _Command not recognized in my protocols, Master._"
  ];
  
  return await m.send(fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]);
});
