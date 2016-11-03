'use strict'

require('logplease').setLogLevel('ERROR')

const Promise = require('bluebird')
const blessed = require('blessed')
const IpfsDaemon = require('ipfs-daemon')
const Orbit = require('orbit_')
const logo = require('./logo.js')

// Options
let channel = 'ipfs'
let user = process.argv[2] || 'anonymous' + new Date().getTime().toString().split('').splice(-4, 4).join('')

// Directories to save IPFS and Orbit data to
const dataDir = './data/' + user
const ipfsDataDir = dataDir + '/ipfs'

// State
let orbit
let _currentChannel
let unreadMessages = {}
let channelViews = {}

// Constants
const themes = {
  'blue': {
    barColor: 'blue',
    higlightColor: 'cyan',
  },
  'magenta': {
    barColor: 'magenta',
    higlightColor: 'cyan',
  },
  'yellow': {
    barColor: 'yellow',
    barTextColor: 'black',
    higlightColor: 'magenta',
  },
  'black': {
    barColor: 'black',
    barTextColor: 'white',
    higlightColor: 'white',
  },
}

const theme = themes['blue']
const backgroundColor = 'transparent'
const textColor = 'white'

const mainColor = 'green'
const higlight = 'blue'
const bracketOpen = `{${theme.higlightColor}-fg}[{/${theme.higlightColor}-fg}`
const bracketClose = `{${theme.higlightColor}-fg}]{/${theme.higlightColor}-fg}`
const notificationMarker = `{${theme.barColor}-fg}-{/${theme.barColor}-fg}!{${theme.barColor}-fg}-{/${theme.barColor}-fg}`

const barStyle = {
  fg: theme.barTextColor,
  bg: theme.barColor,
}

var screen = blessed.screen({
  smartCSR: true,
  forceUnicode: true,
  fullUnicode: true
})

const createChannelView = () => {
  const view = blessed.box({
    top: 1,
    height: '100%-3',
    content: '',
    input: false,
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    style: {
      fg: textColor,
      bg: backgroundColor
    }
  })
  // 🎁
  view.on('click', function(data) {
    if(orbit && _currentChannel) {
      orbit.send(_currentChannel, "🐋")
        .catch((e) => log(`{${theme.higlightColor}-fg}ERROR!{/${theme.higlightColor}-fg} ${e}`))
    }
  })
  return view
}

let logWindow = createChannelView()

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
    fg: textColor,
    bg: backgroundColor
  }
})

var inputField = blessed.textbox({
  bottom: 0,
  width: "100%",
  height: 1,
  style: {
    fg: textColor,
    bg: backgroundColor
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
screen.append(logWindow)
screen.append(statusBar)
screen.append(commandBar)
screen.append(channelBox)
screen.append(inputField)

channelViews['!orbit.mainWindow'] = logWindow

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
        const isChannelOpen = Object.keys(orbit.channels).includes(channel)
        if (isChannelOpen)
          orbit.leave(channel)
      } else if (_currentChannel) {
        orbit.leave(_currentChannel)
      }
    }
    else if ((cmd === 'clear')) {
      logWindow.setContent('')
      screen.render()
    }

  } else {
    orbit.send(_currentChannel, input)      
      .catch((e) => log(`{${theme.higlightColor}-fg}ERROR!{/${theme.higlightColor}-fg} ${e}`))
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

const log = (text, textOnly) => {
  const t = textOnly ? text : getFormattedTime(new Date().getTime()) + " " + notificationMarker + " " + text
  if(channelViews[_currentChannel]) {
    channelViews[_currentChannel].pushLine(t)
    channelViews[_currentChannel].scrollTo(10000)
    logWindow.pushLine(t)
    logWindow.scrollTo(10000)
  } else {
    logWindow.pushLine(t)
    logWindow.scrollTo(10000)
  }

  screen.render()
}

const updateUI = () => {
  const channelBoxText = _currentChannel ? `[#${_currentChannel}] ` : `[(orbit)] `
  channelBox.setContent(channelBoxText)
  channelBox.width = channelBoxText.split('').length
  inputField.width = screen.width - channelBox.width
  inputField.left = channelBox.width

  const time = new Date().getHours() + ":" + new Date().getMinutes()
  let channels = !_currentChannel ? `{bold}orbit{/bold}{${theme.higlightColor}-fg}${Object.keys(orbit.channels).length > 0 ? "|" : ""}{/${theme.higlightColor}-fg}` : `orbit{${theme.higlightColor}-fg}|{/${theme.higlightColor}-fg}`
  channels += Object.keys(orbit.channels).map((e) => {
    return e === _currentChannel ?
      `{bold}#${e}{/bold} (${unreadMessages[e]})` :
      '#' + e + " (" + unreadMessages[e] + ")"
  })
  .join(`{${theme.higlightColor}-fg}|{/${theme.higlightColor}-fg}`)

  const channelsInfo = `${bracketOpen}${channels}${bracketClose}`
  statusBar.setContent(`${bracketOpen}${time}${bracketClose} ${bracketOpen}${user}${bracketClose} ${channelsInfo}`)

  screen.render()
}

const addMessagesToUI = (channel, messages) => {
  Promise.map(messages, (msg) => {
    return orbit.getPost(msg.payload.value).then((post) => {
      return orbit.getUser(post.meta.from).then((user) => {
        const username = `{grey-fg}<{/grey-fg} {bold}${user.name}{/bold}{grey-fg}>{/grey-fg}`
        const line = `${getFormattedTime(post.meta.ts)} ${username} ${post.content}`
        channelViews[channel].pushLine(line)
        channelViews[channel].scrollTo(10000)

        if(channel !== _currentChannel)
          unreadMessages[channel] ? unreadMessages[channel] += 1 : unreadMessages[channel] = 1

        return
      })
    })
  }, { concurrency: 1 })
    .then((res) => updateUI())
    .catch((e) => console.error(e))
}

/* Start */

const nextView = (direction) => {
  if(!direction) direction = 'next'

  let currentIndex = Object.keys(orbit.channels).indexOf(_currentChannel)
  if(_currentChannel && (currentIndex === Object.keys(orbit.channels).length-1 && direction === 'next')
    || (currentIndex === 0 && direction === 'prev')) {
    // go to the main window
    channelViews[_currentChannel].hide()
    logWindow.show()
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
      if(!_currentChannel) logWindow.hide()
      if(_currentChannel) channelViews[_currentChannel].hide()
      channelViews[channel].show()
      unreadMessages[channel] = 0
      _currentChannel = channel
      updateUI()
    }
  }
}

inputField.key(['C-c'], function(ch, key) {
  return process.exit(0)
})

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
  log(boldText("Click the messages!"))
  log("")
}

// Init UI
screen.title = 'Orbit'
commandBar.setContent(`{right}Type ${boldText("/quit")} to exit. ${boldText("Ctrl-n")} and ${boldText("Ctrl-p")} to move between channels.{/right}`)
headerBar.setContent(` 🐼  Orbit v0.0.1 - https://github.com/haadcode/orbit`)

// Output the logo
log(logo, true)

log("Starting IPFS daemon...")

const daemonOptions = { 
  IpfsDataDir: ipfsDataDir,
  Addresses: {
    API: '/ip4/127.0.0.1/tcp/0',
    Swarm: ['/ip4/0.0.0.0/tcp/0'],
    Gateway: '/ip4/0.0.0.0/tcp/0'
  },
}

IpfsDaemon(daemonOptions).then((res) => {
  const options = {
    cachePath: dataDir + '/orbit-db',
    maxHistory: 0, 
    keystorePath: dataDir + '/keys'
  }

  orbit = new Orbit(res.ipfs, options)

  /* Event handlers */
  orbit.events.on('connected', (network) => {
    log(`Connected to {bold}${network.name}{/bold}`)
    logHelp()
    screen.render()
  })

  orbit.events.on('joined', (channel) => {
    logWindow.hide()
    if(_currentChannel) channelViews[_currentChannel].hide()
    channelViews[channel] = createChannelView(channel)
    unreadMessages[channel] = 0
    screen.insert(channelViews[channel], 1)
    _currentChannel = channel
    log(`{${theme.higlightColor}-fg}{bold}${user}{/bold}{/${theme.higlightColor}-fg} has joined channel {bold}#${channel}{/bold}`)
    updateUI()
  })

  orbit.events.on('left', (channel) => {
    screen.remove(channelViews[channel])
    channelViews[channel].destroy()
    delete unreadMessages[channel]
    if(_currentChannel === channel) {
      _currentChannel = null
      logWindow.show()
    }

    log(`{${theme.higlightColor}-fg}{bold}${user}{/bold}{/${theme.higlightColor}-fg} has left channel {bold}#${channel}{/bold}`)
    updateUI()
  })

  orbit.events.on('message', (channel, message) => {
    addMessagesToUI(channel, [message])
  })

  // Connect to Orbit network
  log("Connecting to the network")
  orbit.connect(user)
    .then(() => orbit.join(channel))
    .catch((e) => console.error(e))
})
