# orbit-textui

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/orbitdb/Lobby) [![Matrix](https://img.shields.io/badge/matrix-%23orbitdb%3Apermaweb.io-blue.svg)](https://riot.permaweb.io/#/room/#orbitdb:permaweb.io) 

> Prototype terminal client for [Orbit](https://github.com/orbitdb/orbit)

**Status**: The project hasn't been updated in a long time and is definitely out of date. We would love help, if you're interested in contributing!

<img src="https://raw.githubusercontent.com/orbitdb/orbit-textui/master/screenshot.gif">

***Hats off to [irssi](https://en.wikipedia.org/wiki/Irssi), inseparable since 2001.***

Built with the following packages:

- [orbit-core](https://github.com/orbitdb/orbit-core) - Core Orbit communication library.
- [orbit-db](https://github.com/orbitdb/orbit-db) - Serverless, p2p database that orbit-core uses to store its data.
- [js-ipfs](https://github.com/ipfs/js-ipfs) - A new p2p hypermedia protocol for content-addressed storage.

See also other Orbit clients:

- [orbit-web](https://github.com/orbitdb/orbit-web) - Browser App
- [orbit-electron](https://github.com/orbitdb/orbit-electron) - Desktop App

## Run

Get the source code and install dependencies:

```sh
git clone https://github.com/orbitdb/orbit-textui.git
cd orbit-textui
npm install
```

Start the program:

```sh
npm start
```

Or instead of `npm start`, run the following to specify your chat name:

```sh
node index <nickname>
```

## Contribute

We would be happy to accept PRs! If you want to work on something, it'd be good to talk beforehand to make sure nobody else is working on it. You can reach us [on Gitter](https://gitter.im/orbitdb/Lobby), or in the [issues section](https://github.com/orbitdb/orbit-textui/issues).

We also have **regular community calls**, which we announce in the issues in [the @orbitdb welcome repository](https://github.com/orbitdb/welcome/issues). Join us!

For specific guidelines for contributing to this repository, check out the [Contributing guide](CONTRIBUTING.md). For more on contributing to OrbitDB in general, take a look at the [@OrbitDB welcome repository](https://github.com/orbitdb/welcome). Please note that all interactions in [@OrbitDB](https://github.com/orbitdb) fall under our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2016-2018 Protocol Labs Inc., Haja Networks Oy
