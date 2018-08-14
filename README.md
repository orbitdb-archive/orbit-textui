# orbit-textui

> Terminal client for [Orbit](https://github.com/orbitdb/orbit)

***A prototype terminal client for [Orbit](https://github.com/orbitdb/orbit)***

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

```
git clone https://github.com/orbitdb/orbit-textui.git
cd orbit-textui
npm install
```

Start the program:

```
npm start
```

Or instead of `npm start`, run the following to specify your chat name:

```
node index <nickname>
```

## Contribute

Contributions are welcome! Please open [an issue](https://github.com/orbitdb/orbit-textui/issues) if there is something you would like to see.

## License

[MIT](LICENSE) © 2016-2018 Protocol Labs Inc., Haja Networks Oy
