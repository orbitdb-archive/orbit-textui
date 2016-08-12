require('logplease').setLogLevel('ERROR')

const _ = require('lodash')
const blessed = require('blessed')
const Ipfs = require('ipfs-api')
const Orbit = require('./Orbit.js')
const Promise = require('bluebird')

// Options
let channel = 'test222'
let user = process.argv[2] || 'anonymous' + new Date().getTime().toString().split('').splice(-4, 4).join('')

// State
const ipfs = new Ipfs()
let orbit
let _currentChannel// = '!orbit.mainWindow'
let unreadMessages = {}
let channelViews = {}
// Constants
const bracketOpen = '{cyan-fg}[{/cyan-fg}'
const bracketClose = '{cyan-fg}]{/cyan-fg}'
const notificationMarker = '{blue-fg}-{/blue-fg}!{blue-fg}-{/blue-fg}'

const barStyle = {
  fg: 'white',
  bg: 'blue',
}

var screen = blessed.screen({
  smartCSR: true,
  forceUnicode: true,
  fullUnicode: true
})

const createChannelView = () => {
  const messagesContainer = blessed.box({
    top: 1,
    height: '100%-3',
    content: '',
    input: false,
    tags: true,
    scrollable: true,
    alwaysScroll: true,
  })
  // 🎁
  messagesContainer.on('click', function(data) {
    if(orbit && _currentChannel) orbit.send(_currentChannel, "🐋")
  })
  return messagesContainer
}

let messagesContainer = createChannelView()

var statusBar = blessed.textbox({
  bottom: 1,
  width: '50%',
  height: 1,
  tags: true,
  style: barStyle
})

var commandBar = blessed.textbox({
  bottom: 1,
  right: 0,
  width: '50%',
  height: 1,
  tags: true,
  style: barStyle
})

var headerBar = blessed.textbox({
  top: 0,
  width: '100%',
  height: 1,
  tags: true,
  style: barStyle
})

var channelBox = blessed.textbox({
  bottom: 0,
  height: 1,
  tags: true,
  style: {
    fg: 'white',
  }
})

var inputField = blessed.textbox({
  bottom: 0,
  width: "100%",
  height: 1,
  style: {
    fg: 'white',
  }
})

function getFormattedTime(timestamp) {
  const safeTime = (time) => ("0" + time).slice(-2)
  const date = new Date(timestamp)
  return safeTime(date.getHours()) + ":" + safeTime(date.getMinutes()) + ":" + safeTime(date.getSeconds())
}

const sanitizeChannelName = (ircChannel) => {
  let arr = ircChannel.split('')
  if(arr[0] === '#') arr.shift()
  return arr.join('')
}


// Append our box to the screen.
screen.append(headerBar)
screen.append(messagesContainer)
screen.append(statusBar)
screen.append(commandBar)
screen.append(channelBox)
screen.append(inputField)

channelViews['!orbit.mainWindow'] = messagesContainer

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0)
})

const send = (input) => {
  if(!input)
    return

  const characters = input.split('')
  if(characters[0] === '/') {
    // is a command, eg '/join #news'
    const args = input.split(' ') // ['/join', '#news']
    const cmd = args[0].replace('/', '') // 'join'

    if(cmd === 'quit' || cmd === 'q')
      process.exit(0)
    else if ((cmd === 'join' || cmd === 'j') && args[1])
      orbit.join(sanitizeChannelName(args[1]))
    else if (cmd === 'leave' || cmd === 'part') {
      if(args[1]) {
        const channel = sanitizeChannelName(args[1])
        const isChannelOpen = Object.keys(orbit.channels).indexOf(channel) != -1
        if (isChannelOpen)
          orbit.leave(channel)
      } else if (_currentChannel) {
        orbit.leave(_currentChannel)
      }
    }

  } else {
    orbit.send(_currentChannel, input)
  }
}

const read = () => {
  inputField.clearValue()
  inputField.focus()
  screen.render()

  inputField.readInput((err, input) => {
    send(input)
    read()
  })
}

log = (text) => {
  const t = getFormattedTime(new Date().getTime()) + " " + notificationMarker + " " + text
  if(channelViews[_currentChannel]) {
    channelViews[_currentChannel].pushLine(t)
    channelViews[_currentChannel].scrollTo(10000)
    messagesContainer.pushLine(t)
    messagesContainer.scrollTo(10000)
  } else {
    messagesContainer.pushLine(t)
    messagesContainer.scrollTo(10000)
  }

  screen.render()
}

orbit = new Orbit(ipfs)

/* Event handlers */
orbit.events.on('connected', (network) => {
  log(`Connected to {bold}${network.name}{/bold} at ${network.publishers[0]}`)
  logHelp()
  screen.render()
})

const updateUI = () => {
  const channelBoxText = _currentChannel ? `[#${_currentChannel}] ` : `[(orbit)] `
  channelBox.setContent(channelBoxText)
  channelBox.width = channelBoxText.split('').length
  inputField.width = screen.width - channelBox.width
  inputField.left = channelBox.width

  const time = new Date().getHours() + ":" + new Date().getMinutes()
  let channels = !_currentChannel ? `{bold}orbit{/bold}{cyan-fg}|{/cyan-fg}` : `orbit{cyan-fg}|{/cyan-fg}`
  channels += Object.keys(orbit.channels).map((e) => {
    return e === _currentChannel ?
      `{bold}#${e}{/bold} (${unreadMessages[e]})` :
      '#' + e + " (" + unreadMessages[e] + ")"
  })
  .join('{cyan-fg}|{/cyan-fg}')

  const channelsInfo = `${bracketOpen}${channels}${bracketClose}`
  statusBar.setContent(`${bracketOpen}${time}${bracketClose} ${bracketOpen}${user}${bracketClose} ${channelsInfo}`)

  screen.render()
}

orbit.events.on('joined', (channel) => {
  messagesContainer.hide()
  if(_currentChannel) channelViews[_currentChannel].hide()
  channelViews[channel] = createChannelView(channel)
  unreadMessages[channel] = 0
  screen.insert(channelViews[channel], 1)
  _currentChannel = channel
  log(`{cyan-fg}{bold}${user}{/bold}{/cyan-fg} has joined channel {bold}#${channel}{/bold}`)
  updateUI()
})

orbit.events.on('left', (channel) => {
  messagesContainer.hide()
  screen.remove(channelViews[channel])
  channelViews[channel].destroy()
  delete unreadMessages[channel]
  if(_currentChannel === channel) {
    _currentChannel = null
    messagesContainer.show()
  }

  log(`{cyan-fg}{bold}${user}{/bold}{/cyan-fg} has left channel {bold}#${channel}{/bold}`)
  updateUI()
})

const addMessagesToUI = (channel, messages) => {
  Promise.map(messages, (msg) => {
    return orbit.getPost(msg.payload.value).then((post) => {
      const username = `{grey-fg}<{/grey-fg} {bold}${post.meta.from}{/bold}{grey-fg}>{/grey-fg}`
      const line = `${getFormattedTime(post.meta.ts)} ${username} ${post.content}`
      channelViews[channel].pushLine(line)
      channelViews[channel].scrollTo(10000)

      if(channel !== _currentChannel)
        unreadMessages[channel] ? unreadMessages[channel] += 1 : unreadMessages[channel] = 1

      return
    })
  }, { concurrency: 1 })
    .then((res) => updateUI())
    .catch((e) => console.error(e))
}

orbit.events.on('message', (channel, message) => {
  addMessagesToUI(channel, [message])
})

/* Start */

const nextView = (direction) => {
  if(!direction) direction = 'next'

  let currentIndex = Object.keys(orbit.channels).indexOf(_currentChannel)
  if((currentIndex === Object.keys(orbit.channels).length-1 && direction === 'next')
    || (currentIndex === 0 && direction === 'prev')) {
    // go to the main window
    channelViews[_currentChannel].hide()
    messagesContainer.show()
    _currentChannel = null
    updateUI()
  } else {
    let nextIndex
    if(direction === 'next')
      nextIndex = currentIndex+1
    else
      nextIndex = _currentChannel ? currentIndex-1 : Object.keys(orbit.channels).length-1

    const channel = Object.keys(orbit.channels)[nextIndex]
    if(channel) {
      if(!_currentChannel) messagesContainer.hide()
      if(_currentChannel) channelViews[_currentChannel].hide()
      channelViews[channel].show()
      unreadMessages[channel] = 0
      _currentChannel = channel
      updateUI()
    }
  }
}

inputField.key(['C-n'], function(ch, key) {
  nextView('next')
})

inputField.key(['C-p'], function(ch, key) {
  nextView('prev')
})

// wait for input
read()

// render
screen.render()

const boldText = (text) => `{bold}${text}{/bold}`
const logHelp = () => {
  log("")
  log("Commands:")
  log(`${boldText("/join <channel>")} - Join a new <channel>`)
  log(`${boldText("/part")} - Leave the current channel`)
  log(`${boldText("/part <channel>")} - Leave <channel>`)
  log(`${boldText("/quit")} - Exit the program`)
  log("")
}

// Init UI
screen.title = 'Orbit'
commandBar.setContent(`{right}Type ${boldText("/quit")} to exit. ${boldText("Ctrl-n")} and ${boldText("Ctrl-p")} to move between channels.{/right}`)
headerBar.setContent(` 🐼  Orbit v0.0.1 - https://github.com/haadcode/orbit`)

// Connect to Orbit network
log("Connecting to network at 178.62.241.75:3333")
orbit.connect('178.62.241.75:3333', user)
  .then(() => orbit.join(channel))
