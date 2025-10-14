const { kord, isAdmin, prefix, TicTacToe, WCG, wtype } = require("../core")

kord({
  cmd: "delttt",
  desc: "delete TicTacToe running game.",
  fromMe: wtype,
  type: "game",
}, async (m) => {
  try {
  global.tictactoe = global.tictactoe || {}
  let found = Object.values(global.tictactoe).find(room => room.id.startsWith("tictactoe"))
  if (found) {
    delete global.tictactoe[found.id]
    return m.send("_Successfully Deleted running TicTacToe game._")
  } else {
    return m.send("No TicTacToe game🎮 is running.")
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "ttt",
  desc: "Play TicTacToe",
  fromMe: wtype,
  type: "game"
}, async (m, text) => {
  try {
  global.tictactoe = global.tictactoe || {}
  let active = Object.values(global.tictactoe).find(room => room.id.startsWith("tictactoe") && [room.game.playerX, room.game.playerO].includes(m.sender))
  if (active) return m.send("_You're still in the game_")
  let room = Object.values(global.tictactoe).find(room => room.state === "WAITING" && (text ? room.name === text : true))
  if (room) {
    room.o = m.chat
    room.game.playerO = m.mentionedJid[0] || m.sender
    room.state = "PLAYING"
    let arr = room.game.render().map(v => ({
      X: "❌", O: "⭕", 1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣", 7: "7️⃣", 8: "8️⃣", 9: "9️⃣"
    }[v]))
    let str = `*🎮 TicTacToe Game Started!*\n\n${arr.slice(0,3).join("")}\n${arr.slice(3,6).join("")}\n${arr.slice(6).join("")}\n\n*Current turn:* @${room.game.currentTurn.split("@")[0]}\n\n*How to play:* Type numbers 1-9 to place your mark\n*Surrender:* Type "give up" or "surrender"`
    let mentions = [room.game.playerX, room.game.playerO, room.game.currentTurn]
    return await m.send(str, { mentions, quoted: m })
  } else {
    room = {
      id: "tictactoe-" + +new Date(),
      x: m.chat,
      o: "",
      game: new TicTacToe(m.sender, "o"),
      state: "WAITING"
    }
    if (text) room.name = text
    let waitMsg = `*🎮 TicTacToe Game Created!*\n\n*Player 1:* @${m.sender.split("@")[0]} ❌\n\n*Waiting for Player 2...*\n\n*How to join:*\n• Type "${prefix}ttt" to join\n• Type "join" to join this game\n• Mention someone to invite them`
    m.send(waitMsg, { mentions: [m.sender] })
    global.tictactoe[room.id] = room
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  on: "text",
  fromMe: false
}, async (m, text) => {
  try {
  global.tictactoe = global.tictactoe || {}
  
  let waitingRoom = Object.values(global.tictactoe).find(room => 
    room.state === "WAITING" && room.x === m.chat
  )
  
  if (waitingRoom && text.toLowerCase() === "join" && m.sender !== waitingRoom.game.playerX) {
    waitingRoom.o = m.chat
    waitingRoom.game.playerO = m.sender
    waitingRoom.state = "PLAYING"
    let arr = waitingRoom.game.render().map(v => ({
      X: "❌", O: "⭕", 1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣", 7: "7️⃣", 8: "8️⃣", 9: "9️⃣"
    }[v]))
    let str = `*🎮 TicTacToe Game Started!*\n\n${arr.slice(0,3).join("")}\n${arr.slice(3,6).join("")}\n${arr.slice(6).join("")}\n\n*Current turn:* @${waitingRoom.game.currentTurn.split("@")[0]}\n\n*How to play:* Type numbers 1-9 to place your mark\n*Surrender:* Type "give up" or "surrender"`
    let mentions = [waitingRoom.game.playerX, waitingRoom.game.playerO, waitingRoom.game.currentTurn]
    return await m.send(str, { mentions })
  }
  
  let room = Object.values(global.tictactoe).find(room =>
    room.id && room.game && room.state &&
    room.id.startsWith("tictactoe") &&
    [room.game.playerX, room.game.playerO].includes(m.sender) &&
    room.state == "PLAYING"
  )
  if (!room) return
  let ok, isWin = false, isTie = false, isSurrender = false
  if (!/^([1-9]|(me)?give_up|surr?ender|off|skip)$/i.test(text)) return
  isSurrender = !/^[1-9]$/.test(text)
  if (m.sender !== room.game.currentTurn && !isSurrender) return
  if (!isSurrender && 1 > (ok = room.game.turn(m.sender === room.game.playerO, parseInt(text) - 1))) {
    return m.send({
      "-3": "The game is over",
      "-2": "Invalid",
      "-1": "_Invalid Position_",
      0: "_Invalid Position_"
    }[ok])
  }
  if (m.sender === room.game.winner) isWin = true
  else if (room.game.board === 511) isTie = true
  if (isSurrender) {
    room.game._currentTurn = m.sender === room.game.playerX
    isWin = true
  }
  let arr = room.game.render().map(v => ({
    X: "❌", O: "⭕", 1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣", 7: "7️⃣", 8: "8️⃣", 9: "9️⃣"
  }[v]))
  let winner = isSurrender ? room.game.currentTurn : room.game.winner
  let str = `Room ID: ${room.id}\n\n${arr.slice(0,3).join("")}\n${arr.slice(3,6).join("")}\n${arr.slice(6).join("")}\n\n${
    isWin ? `🎉 @${winner.split("@")[0]} Won !` :
    isTie ? `🤝 Tie Game!` :
    `*Current Turn:* ${["❌", "⭕"][1 * room.game._currentTurn]} @${room.game.currentTurn.split("@")[0]}`
  }\n❌: @${room.game.playerX.split("@")[0]}\n⭕: @${room.game.playerO.split("@")[0]}`
  let side = (room.game._currentTurn ^ isSurrender) ? "x" : "o"
  if (room[side] !== m.chat) room[side] = m.chat
  let mentions = [room.game.playerX, room.game.playerO, winner || room.game.currentTurn]
  await m.send(str, { mentions, quoted: m })
  if (isWin || isTie) delete global.tictactoe[room.id]
  } catch (e) {
    console.log("ttt error", e)
  }
})

const wordChainGames = {}
let validWords = new Set()
const messageProcessed = new Set()

async function initWords() {
  try {
    const { default: wordList } = await import('word-list')
    const fs = await import('fs')
    const wordListContent = fs.readFileSync(wordList, 'utf8')
    validWords = new Set(wordListContent.split('\n').map(word => word.trim().toLowerCase()).filter(word => word.length > 0))
    console.log(`Loaded ${validWords.size} words`)
  } catch (error) {
    console.log('word-list package not found. Install it with: npm install word-list')
    validWords = null
  }
}

function clearWords() {
  validWords = new Set()
}

class WordChainGame {
  constructor() {
    this.players = []
    this.currentPlayerIndex = 0
    this.previousWord = ''
    this.wordChain = ''
    this.wordsCount = 0
    this.wordLength = 3
    this.maxWordLength = 7
    this.wordLengthIncrement = 3
    this.longestWordBy = 'No longest word yet'
    this.gameStatus = false
    this.waitingForPlayers = false
    this.botPlayer = false
    this.wrongAttempts = {}
    this.maxAttempts = 5
    this.turnTimeLimit = 45
    this.turnStartTime = 0
    this.currentRemTime = 45
    this.turnIntervalId = null
    this.waitingTimeoutId = null
    this.validWords = validWords
    this.processingTurn = false
    this.gameEnded = false
    this.finalWarningShown = false
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex]
  }

  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length
  }

  stopTurn() {
    if (this.turnIntervalId) {
      clearInterval(this.turnIntervalId)
      this.turnIntervalId = null
    }
    if (this.waitingTimeoutId) {
      clearTimeout(this.waitingTimeoutId)
      this.waitingTimeoutId = null
    }
  }

  async wait(seconds) {
    await new Promise(r => setTimeout(r, seconds * 1000))
    this.botPlayer = false
  }

  getRandomLetter() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'
    return alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  async startWaitingTimer(m) {
    this.waitingTimeoutId = setTimeout(async () => {
      if (this.gameEnded) return
      if (this.players.length >= 2) {
        await this.startGame(m)
      } else {
        await m.send('```❌ Not Enough Players```\n\nNeed at least 2 players to start the game')
        this.gameEnded = true
        delete wordChainGames[m.chat]
      }
    }, 30000)
  }

  async startGame(m) {
    if (this.gameEnded) return
    this.stopTurn()
    this.gameStatus = true
    this.waitingForPlayers = false
    this.botPlayer = true
    this.turnStartTime = Date.now()
    this.finalWarningShown = false
    
    this.players.forEach(player => {
      this.wrongAttempts[player] = 0
    })
    
    this.previousWord = this.getRandomLetter()
    this.wordChain = this.previousWord
    this.currentPlayerIndex = 0
    this.turnTimeLimit = Math.floor(Math.random() * 21) + 30
    
    const playerList = this.players.map((p, i) => `${i + 1}. @${p.split('@')[0]}`).join('\n')
    
    await m.send(`\`\`\`🚀 WORD CHAIN GAME STARTED!\`\`\`

👥 *Players (${this.players.length}):*
${playerList}

🎯 *Current Turn:* @${this.currentPlayer.split('@')[0]}

📝 *Start with:* "${this.previousWord}"
📏 *Min length:* ${this.wordLength} letters
⏱️ *Time limit:* ${this.turnTimeLimit}s

🔥 *Rules:*
• Length increases every ${this.wordLengthIncrement} words
• Max ${this.maxAttempts} wrong attempts per player
• Must start with last letter of previous word
• Only single words allowed

_Let the word battle begin!_`, {
      mentions: this.players
    })
    
    this.startTurn(m)
    await this.wait(2)
  }

  async startTurn(m) {
    if (this.gameEnded) return
    this.finalWarningShown = false
    
    this.turnIntervalId = setInterval(async () => {
      if (this.gameEnded) {
        this.stopTurn()
        return
      }
      
      const elapsed = Math.floor((Date.now() - this.turnStartTime) / 1000)
      this.currentRemTime = this.turnTimeLimit - elapsed

      if (this.currentRemTime <= 0 && this.gameStatus && !this.processingTurn) {
        this.processingTurn = true
        this.botPlayer = true
        
        if (this.players.length >= 2) {
          await m.send(`\`\`\`⏰ TIME'S UP!\`\`\`

@${this.currentPlayer.split('@')[0]} ran out of time...

*Game continues with remaining players*`, {
            mentions: [this.currentPlayer]
          })
          
          this.players.splice(this.currentPlayerIndex, 1)
          if (this.currentPlayerIndex >= this.players.length) {
            this.currentPlayerIndex = 0
          }
          
          if (this.players.length === 1) {
            await m.send(`\`\`\`🎉 GAME OVER!\`\`\`

🏆 *Winner:* @${this.players[0].split('@')[0]}

📊 *Final Statistics:*
• Total words: ${this.wordsCount}
• ${this.longestWordBy}
• Wrong attempts: ${this.wrongAttempts[this.players[0]] || 0}

🔗 *Chain:* ${this.wordChain}`, {
              mentions: [this.players[0]]
            })
            
            this.gameEnded = true
            this.stopTurn()
            clearWords()
            delete wordChainGames[m.chat]
            return
          }
          
          this.turnTimeLimit = Math.floor(Math.random() * 21) + 30
          this.turnStartTime = Date.now()
          this.processingTurn = false
          
          await m.send(`\`\`\`🎯 NEXT PLAYER'S TURN!\`\`\`

@${this.currentPlayer.split('@')[0]} - your turn!

📝 *Start with:* "${this.previousWord.slice(-1)}"
📏 *Min length:* ${this.wordLength} letters
⏱️ *Time limit:* ${this.turnTimeLimit}s

*Game continues!*`, {
            mentions: [this.currentPlayer]
          })
          
          this.startTurn(m)
        } else {
          await m.send(`\`\`\`❌ GAME TERMINATED\`\`\`

All players were inactive`)
          this.gameEnded = true
          this.stopTurn()
          clearWords()
          delete wordChainGames[m.chat]
        }
      } else if (this.currentRemTime === 10 && this.gameStatus && !this.processingTurn && !this.finalWarningShown) {
        this.finalWarningShown = true
        this.botPlayer = true
        if (this.players.length >= 2) {
          await m.send(`\`\`\`⚠️ FINAL WARNING!\`\`\`

@${this.currentPlayer.split('@')[0]} - *10 seconds left!*

📝 Start with: "${this.previousWord.slice(-1)}"
📏 Min length: ${this.wordLength} letters`, {
            mentions: [this.currentPlayer]
          })
        }
        await this.wait(1)
      }
    }, 1000)
  }
}

kord({
  cmd: 'wcg',
  desc: 'start a Word Chain Game',
  fromMe: wtype,
  type: 'game'
}, async (m, text) => {
  try {
  if (m.isBot) return
  
  const chat = m.chat
  let game = wordChainGames[chat]

  if (text.startsWith('end') && game) {
    game.gameEnded = true
    game.stopTurn()
    clearWords()
    delete wordChainGames[chat]
    return await m.send(`\`\`\`🎮 GAME ENDED\`\`\`

Successfully terminated the game

_See you next time!_`)
  }

  if (text.startsWith('start') && game && game.waitingForPlayers) {
    if (game.players.length < 2) {
      return await m.send(`\`\`\`❌ NOT ENOUGH PLAYERS\`\`\`

Need at least 2 players to start the game`)
    }
    return await game.startGame(m)
  }

  if (game && game.gameStatus) {
    return await m.send(`\`\`\`⚠️ GAME ALREADY RUNNING\`\`\`

A game is currently in progress

🛑 Stop game: *${prefix}wcg end*`)
  }

  const opponent = m.quoted ? m.quoted.sender : m.mentionedJid ? m.mentionedJid[0] : false

  if (!game) {
    await initWords()
    game = new WordChainGame()
    wordChainGames[chat] = game
  }

  if (!game.players.includes(m.sender)) {
    if (game.players.length >= 5) {
      return await m.send(`\`\`\`🚫 ROOM FULL\`\`\`

Maximum 5 players allowed per game`)
    }
    
    game.players.push(m.sender)
    
    if (opponent && opponent !== m.sender && !game.players.includes(opponent)) {
      if (game.players.length >= 5) {
        return await m.send(`\`\`\`🚫 ROOM FULL\`\`\`

Maximum 5 players allowed per game`)
      }
      game.players.push(opponent)
    }
  }

  if (game.players.length === 1) {
    game.waitingForPlayers = true
    game.startWaitingTimer(m)
    return await m.send(`\`\`\`🎮 WORD CHAIN GAME\`\`\`

👤 *Player:* @${game.players[0].split('@')[0]}

⏳ *Waiting for more players...*

🎯 Type *${prefix}wcg* or *"join"* to join (max 5 players)
🚀 Type *${prefix}wcg start* to start with current players
⏱️ *Auto-start in 30 seconds* if 2+ players`, {
      mentions: game.players
    })
  } else {
    const playerList = game.players.map((p, i) => `${i + 1}. @${p.split('@')[0]}`).join('\n')
    
    if (game.waitingForPlayers) {
      return await m.send(`\`\`\`🎮 PLAYERS UPDATED\`\`\`

👥 *Current Players (${game.players.length}/5):*
${playerList}

🎯 Type *${prefix}wcg* or *"join"* to join
🚀 Type *${prefix}wcg start* to begin
⏱️ *Auto-start in a few seconds*`, {
        mentions: game.players
      })
    } else {
      return await game.startGame(m)
    }
  }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: 'delwcg',
  desc: 'delete running WCG game',
  fromMe: wtype,
  type: 'game'
}, async (m) => {
  try {
  if (m.isBot) return
  
  const chat = m.chat
  const game = wordChainGames[chat]
  const isOwner = m.isCreator || await isAdmin(m) || (game && game.players.includes(m.sender))

  if (!game) {
    return await m.send(`\`\`\`❌ NO ACTIVE GAME\`\`\`

No Word Chain game is running in this chat`)
  }

  if (!isOwner) {
    return await m.send(`\`\`\`🚫 ACCESS DENIED\`\`\`

Only participants or admins can delete the game`)
  }

  game.gameEnded = true
  game.stopTurn()
  clearWords()
  delete wordChainGames[chat]

  return await m.send(`\`\`\`🗑️ GAME DELETED\`\`\`

*Room:* wcg-${chat.split('@')[0]}

${game.wordsCount ? `📊 *Final Stats:*
• Total words: ${game.wordsCount}
• ${game.longestWordBy}
• Chain: ${game.wordChain}` : ''}`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  on: 'text',
  fromMe: false
}, async (m, text) => {
  try {
  if (m.isBot) return

  const chat = m.chat
  const game = wordChainGames[chat]
  const sender = m.sender
  const message = text.trim().toLowerCase()
  
  const messageId = `${sender}-${Date.now()}-${text}`
  if (messageProcessed.has(messageId)) return
  messageProcessed.add(messageId)
  
  setTimeout(() => messageProcessed.delete(messageId), 5000)

  if (game && game.waitingForPlayers && message == 'join') {
    if (game.players.includes(sender)) {
      return await m.send(`\`\`\`✅ ALREADY JOINED\`\`\`

You're already in the game!`)
    }
    
    if (game.players.length >= 5) {
      return await m.send(`\`\`\`🚫 ROOM FULL\`\`\`

Maximum 5 players allowed per game`)
    }
    
    game.players.push(sender)
    const playerList = game.players.map((p, i) => `${i + 1}. @${p.split('@')[0]}`).join('\n')
    
    return await m.send(`\`\`\`🎮 PLAYER JOINED\`\`\`

👥 *Current Players (${game.players.length}/5):*
${playerList}

🎯 Type *"join"* to join
🚀 Type *${prefix}wcg start* to begin
⏱️ *Auto-start soon*`, {
      mentions: game.players
    })
  }

  if (!game || !game.gameStatus || game.currentPlayer !== sender || !text || game.botPlayer || game.processingTurn || game.gameEnded) return

  game.processingTurn = true
  const inputWords = text.trim().split(/\s+/)
  
  if (inputWords.length > 1) {
    game.processingTurn = false
    return await m.send(`\`\`\`❌ MULTIPLE WORDS NOT ALLOWED\`\`\`

Please use only single words

@${game.currentPlayer.split('@')[0]}'s turn continues
⏱️ *Time left:* ${game.currentRemTime}s`, {
      mentions: [game.currentPlayer]
    })
  }
  
  const word = inputWords[0].toLowerCase()

  if (word.length >= game.wordLength && word[0] === game.previousWord.slice(-1)) {
    const verifyMsg = await m.send(`\`\`\`🔍 VERIFYING WORD...\`\`\``)
    
    if (!game.validWords || !game.validWords.has(word)) {
      await verifyMsg.edit(`\`\`\`❌ INVALID WORD\`\`\`

Word not found in dictionary`)
      
      game.wrongAttempts[sender] = (game.wrongAttempts[sender] || 0) + 1
      
      if (game.wrongAttempts[sender] >= game.maxAttempts) {
        game.players.splice(game.currentPlayerIndex, 1)
        if (game.currentPlayerIndex >= game.players.length) {
          game.currentPlayerIndex = 0
        }
        
        if (game.players.length === 1) {
          game.stopTurn()
          game.gameEnded = true
          clearWords()
          delete wordChainGames[chat]
          game.processingTurn = false
          return await m.send(`\`\`\`🎉 GAME OVER!\`\`\`

🏆 *Winner:* @${game.players[0].split('@')[0]}

💀 @${sender.split('@')[0]} exceeded max attempts (${game.wrongAttempts[sender]})

🔗 *Final chain:* ${game.wordChain}`, {
            mentions: [sender, game.players[0]]
          })
        } else {
          await m.send(`\`\`\`💀 PLAYER ELIMINATED!\`\`\`

@${sender.split('@')[0]} exceeded max attempts (${game.wrongAttempts[sender]})

*${game.players.length} players remaining*

🎯 *Current Turn:* @${game.currentPlayer.split('@')[0]}
📝 *Start with:* "${game.previousWord.slice(-1)}"
📏 *Min length:* ${game.wordLength} letters
⏱️ *Time limit:* ${game.turnTimeLimit}s`, {
            mentions: [sender, game.currentPlayer]
          })
          game.turnTimeLimit = Math.floor(Math.random() * 21) + 30
          game.turnStartTime = Date.now()
          game.processingTurn = false
          game.startTurn(m)
          return
        }
      }
      
      game.processingTurn = false
      return await m.send(`\`\`\`❎ WORD REJECTED\`\`\`

*Reason:* Not a valid dictionary word

@${game.currentPlayer.split('@')[0]}'s turn continues
⏱️ *Time left:* ${game.currentRemTime}s`, {
        mentions: [game.currentPlayer]
      })
    }

    await verifyMsg.edit(`\`\`\`✅ WORD VERIFIED\`\`\``)
    
    if (word.length > (game.longestWordBy.includes('No longest') ? game.wordLength - 1 : parseInt(game.longestWordBy.match(/\((\d+)\)/)[1]))) {
      game.longestWordBy = `Longest word (${word.length}): "${word}" by @${sender.split('@')[0]}`
    }

    game.wordsCount++
    game.botPlayer = true
    game.stopTurn()
    game.previousWord = word
    game.wordChain += ` → ${word}`
    game.turnTimeLimit = Math.floor(Math.random() * 21) + 30
    
    if (game.wordsCount % game.wordLengthIncrement === 0 && game.wordLength < game.maxWordLength) {
      game.wordLength++
    }
    
    await m.react("✅")
    game.nextPlayer()
    
    const nextPlayerIndex = game.currentPlayerIndex < game.players.length - 1 ? game.currentPlayerIndex + 1 : 0
    const nextPlayer = game.players[nextPlayerIndex]

    const levelUp = (game.wordsCount % game.wordLengthIncrement === 0 && game.wordLength <= game.maxWordLength) 
      ? `\n🔥 *Level Up!* Min length now: ${game.wordLength}` : ''
    
    const msg = `\`\`\`✅ WORD ACCEPTED!\`\`\`

🎯 *Current Turn:* @${game.currentPlayer.split('@')[0]}
⏭️ *Next:* @${nextPlayer.split('@')[0]}

📝 *Start with:* "${game.previousWord.slice(-1)}"
📏 *Min length:* ${game.wordLength} letters
⏱️ *Time limit:* ${game.turnTimeLimit}s
📊 *Total words:* ${game.wordsCount}${levelUp}`
    
    game.turnStartTime = Date.now()
    game.processingTurn = false
    game.startTurn(m)
    await game.wait(2)
    return await m.send(msg, { mentions: game.players })
    
  } else {
    game.botPlayer = true
    await m.react("❌")

    game.wrongAttempts[sender] = (game.wrongAttempts[sender] || 0) + 1

    if (game.wrongAttempts[sender] >= game.maxAttempts) {
      game.players.splice(game.currentPlayerIndex, 1)
      if (game.currentPlayerIndex >= game.players.length) {
        game.currentPlayerIndex = 0
      }
      
      if (game.players.length === 1) {
        game.stopTurn()
        game.gameEnded = true
        clearWords()
        delete wordChainGames[chat]
        game.processingTurn = false
        return await m.send(`\`\`\`🎉 GAME OVER!\`\`\`

🏆 *Winner:* @${game.players[0].split('@')[0]}

💀 @${sender.split('@')[0]} exceeded max attempts (${game.wrongAttempts[sender]})

🔗 *Final chain:* ${game.wordChain}`, {
          mentions: [sender, game.players[0]]
        })
      } else {
        await m.send(`\`\`\`💀 PLAYER ELIMINATED!\`\`\`

@${sender.split('@')[0]} exceeded max attempts (${game.wrongAttempts[sender]})

*${game.players.length} players remaining*

🎯 *Current Turn:* @${game.currentPlayer.split('@')[0]}
📝 *Start with:* "${game.previousWord.slice(-1)}"
📏 *Min length:* ${game.wordLength} letters
⏱️ *Time limit:* ${game.turnTimeLimit}s`, {
          mentions: [sender, game.currentPlayer]
        })
        game.turnTimeLimit = Math.floor(Math.random() * 21) + 30
        game.turnStartTime = Date.now()
        game.processingTurn = false
        game.startTurn(m)
        return
      }
    }

    const reason = word[0] !== game.previousWord.slice(-1) 
      ? `Must start with "${game.previousWord.slice(-1)}"` 
      : `Must be at least ${game.wordLength} letters`
    
    const msg = `\`\`\`❎ INVALID WORD\`\`\`

*Reason:* ${reason}

@${game.currentPlayer.split('@')[0]}'s turn continues
⏱️ *Time left:* ${game.currentRemTime}s

*Try again!*`
    
    game.processingTurn = false
    await game.wait(2)
    return await m.send(msg, { mentions: [game.currentPlayer] })
  }
  } catch (e) {
    console.log("wcg error", e)
  }
})

// Truth or Dare
const truthQuestions = [
  "What's the most embarrassing thing you've ever done?",
  "What's your biggest secret?",
  "Who was your first crush?",
  "What's the worst lie you've ever told?",
  "What's something you've never told anyone?",
  "What's your biggest fear?",
  "What's the most childish thing you still do?",
  "What's a rumor you spread that you regret?",
  "What's your biggest insecurity?",
  "What's the meanest thing you've ever said to someone?",
  "Have you ever cheated on a test?",
  "What's the worst date you've ever been on?",
  "What's your guilty pleasure?",
  "What's something illegal you've done?",
  "Who in this group would you date?",
  "What's the longest you've gone without showering?",
  "What's your biggest regret?",
  "Have you ever had a crush on a friend's partner?",
  "What's the most expensive thing you've stolen?",
  "What's your most embarrassing nickname?"
]

const dareActions = [
  "Do 20 pushups",
  "Send a voice message singing a song",
  "Change your profile picture to something embarrassing for 24 hours",
  "Text your crush and tell them how you feel",
  "Do your best impression of someone in the group",
  "Speak in an accent for the next 3 messages",
  "Let someone else type your status for a day",
  "Post an embarrassing selfie",
  "Call someone random and sing 'Happy Birthday'",
  "Do 50 jumping jacks",
  "Eat a spoonful of hot sauce",
  "Let the group choose your profile pic for a week",
  "Dance to a song and send a video",
  "Text your parents saying you love them in a dramatic way",
  "Speak only in rhymes for the next 5 messages",
  "Do the silliest dance you know",
  "Send a message to your ex",
  "Let someone go through your phone for 1 minute",
  "Post a really bad joke on your status",
  "Howl like a wolf and send a voice note"
]

kord({
  cmd: "truth",
  desc: "Get a random truth question",
  fromMe: wtype,
  type: "game"
}, async (m) => {
  try {
    const question = truthQuestions[Math.floor(Math.random() * truthQuestions.length)]
    return await m.send(`\`\`\`🎭 TRUTH\`\`\`

❓ *${question}*

_Answer honestly!_`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

kord({
  cmd: "dare",
  desc: "Get a random dare challenge",
  fromMe: wtype,
  type: "game"
}, async (m) => {
  try {
    const dare = dareActions[Math.floor(Math.random() * dareActions.length)]
    return await m.send(`\`\`\`🎭 DARE\`\`\`

💪 *${dare}*

_I dare you to do it!_`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

// Russian Roulette
const rouletteGames = {}

kord({
  cmd: "roulette",
  desc: "Play Russian roulette",
  fromMe: wtype,
  type: "game"
}, async (m) => {
  try {
    const chat = m.chat
    const sender = m.sender
    
    if (!rouletteGames[chat]) {
      rouletteGames[chat] = {
        chamber: Math.floor(Math.random() * 6) + 1,
        currentShot: 0
      }
    }
    
    const game = rouletteGames[chat]
    game.currentShot++
    
    await m.send(`\`\`\`🔫 RUSSIAN ROULETTE\`\`\`

@${sender.split('@')[0]} pulls the trigger...

_*Click*_`, { mentions: [sender] })
    
    await new Promise(r => setTimeout(r, 2000))
    
    if (game.currentShot === game.chamber) {
      await m.send(`\`\`\`💥 BANG!\`\`\`

@${sender.split('@')[0]} is out! 💀

_Game over. Starting new game..._`, { mentions: [sender] })
      delete rouletteGames[chat]
    } else {
      const remaining = 6 - game.currentShot
      await m.send(`\`\`\`✅ SAFE!\`\`\`

@${sender.split('@')[0]} survived!

🔫 *Shots fired:* ${game.currentShot}/6
🎯 *Remaining chambers:* ${remaining}

_Pass the gun to the next player..._`, { mentions: [sender] })
    }
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

// Dice Roll
kord({
  cmd: "dice",
  desc: "Roll a dice",
  fromMe: wtype,
  type: "game"
}, async (m) => {
  try {
    const result = Math.floor(Math.random() * 6) + 1
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
    
    return await m.send(`\`\`\`🎲 DICE ROLL\`\`\`

${diceEmojis[result - 1]}

*You rolled a ${result}!*`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

// Coin Flip
kord({
  cmd: "coin",
  desc: "Flip a coin",
  fromMe: wtype,
  type: "game"
}, async (m) => {
  try {
    const result = Math.random() < 0.5 ? "Heads" : "Tails"
    const emoji = result === "Heads" ? "🪙" : "💰"
    
    return await m.send(`\`\`\`🪙 COIN FLIP\`\`\`

_*Flipping...*_

${emoji}

*Result: ${result}!*`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

// Magic 8 Ball
kord({
  cmd: "8ball",
  desc: "Ask the magic 8 ball a question",
  fromMe: wtype,
  type: "game"
}, async (m, text) => {
  try {
    if (!text) {
      return await m.send(`\`\`\`🔮 MAGIC 8 BALL\`\`\`

Please ask a question!

_Example: ${prefix}8ball Will I be rich?_`)
    }
    
    const responses = [
      "It is certain",
      "It is decidedly so",
      "Without a doubt",
      "Yes definitely",
      "You may rely on it",
      "As I see it, yes",
      "Most likely",
      "Outlook good",
      "Yes",
      "Signs point to yes",
      "Reply hazy, try again",
      "Ask again later",
      "Better not tell you now",
      "Cannot predict now",
      "Concentrate and ask again",
      "Don't count on it",
      "My reply is no",
      "My sources say no",
      "Outlook not so good",
      "Very doubtful"
    ]
    
    const answer = responses[Math.floor(Math.random() * responses.length)]
    
    return await m.send(`\`\`\`🔮 MAGIC 8 BALL\`\`\`

*Question:* ${text}

_*Shaking the ball...*_

🎱 *${answer}*`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

// Mocking SpongeBob Text
kord({
  cmd: "mock",
  desc: "Convert text to mOcKiNg SpOnGeBoB format",
  fromMe: wtype,
  type: "game"
}, async (m, text) => {
  try {
    if (!text && !m.quoted) {
      return await m.send(`\`\`\`🧽 MOCKING SPONGEBOB\`\`\`

Please provide text or reply to a message!

_Example: ${prefix}mock your text here_`)
    }
    
    const input = text || (m.quoted ? m.quoted.text : "")
    if (!input) {
      return await m.send("No text found to mock!")
    }
    
    let mocked = ""
    for (let i = 0; i < input.length; i++) {
      if (Math.random() < 0.5) {
        mocked += input[i].toLowerCase()
      } else {
        mocked += input[i].toUpperCase()
      }
    }
    
    return await m.send(`\`\`\`🧽 MOCKING SPONGEBOB\`\`\`

${mocked}`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})

// Reverse Text
kord({
  cmd: "reverse",
  desc: "Reverse your text",
  fromMe: wtype,
  type: "game"
}, async (m, text) => {
  try {
    if (!text && !m.quoted) {
      return await m.send(`\`\`\`🔄 REVERSE TEXT\`\`\`

Please provide text or reply to a message!

_Example: ${prefix}reverse your text here_`)
    }
    
    const input = text || (m.quoted ? m.quoted.text : "")
    if (!input) {
      return await m.send("No text found to reverse!")
    }
    
    const reversed = input.split("").reverse().join("")
    
    return await m.send(`\`\`\`🔄 REVERSED TEXT\`\`\`

${reversed}`)
  } catch (e) {
    console.log("cmd error", e)
    return await m.sendErr(e)
  }
})
