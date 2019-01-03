# Nofan

[![](https://badges.greenkeeper.io/LitoMore/nofan.svg)](https://greenkeeper.io/)
[![](https://img.shields.io/travis/LitoMore/nofan/master.svg)](https://travis-ci.org/LitoMore/nofan)
[![](https://img.shields.io/appveyor/ci/LitoMore/nofan/master.svg)](https://ci.appveyor.com/project/LitoMore/nofan)
[![](https://img.shields.io/npm/v/nofan.svg)](https://www.npmjs.com/package/nofan)
[![](https://img.shields.io/npm/l/nofan.svg)](https://github.com/LitoMore/nofan/blob/master/LICENSE)
[![](https://img.shields.io/badge/unicorn-approved-ff69b4.svg)](https://www.youtube.com/watch?v=9auOCbH5Ns4)
[![](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

CLI for Fanfou

<div align="center"><img src="https://raw.githubusercontent.com/LitoMore/nofan/master/screenshot.png" alt="Nofan" /></div>

## Features

- Fetch home-timeline
- Fetch public-timeline
- Fetch mentions-timeline
- Fetch self-timeline
- Fetch user-timeline
- Fetch trends-timeline
- Search statuses
- Post statuses
- Post photos
- Multiple account login
- HTTPS secure connection
- Customizable timeline
- Customizable color themes
- Desktop notifier support

## Installation

```bash
$ npm install -g nofan
```

## Config & Login

```bash
# Config consumer key and consumer secret
$ nofan config

# Login fanfou account
$ nofan login
```

> If you don't have consumer key, come [here](https://fanfou.com/apps) to create one.

## Usage

### Commands

```bash
$ nofan --help               # Show help
$ nofan config               # Config consumer key and consumer secret
$ nofan colors               # Customize color style
$ nofan login                # Login fanfou account
$ nofan logout               # Logout current account
$ nofan switch               # Switch fanfou account
$ nofan                      # Fetch the latest 10 statuses from home-timeline
$ nofan home                 # Fetch the latest 10 statuses from home-timeline
$ nofan mentions             # Fetch the latest 10 statuses from mentions-timeline
$ nofan me                   # Fetch the latest 10 statuses from yourself
$ nofan public               # Fetch the latest 10 statuses from public-timeline
$ nofan trends               # Fetch trends
$ nofan search <query>       # Search status from public timeline
$ nofan home 20              # Fetch the latest 20 statuses from public-timeline
$ nofan user <id>            # Fetch user-timeline by ID
$ nofan s                    # Alias for `nofan switch`
$ nofan h                    # Alias for `nofan home`
$ nofan p                    # Alias for `nofan public`
$ nofan se                   # Alias for `nofan search`
$ nofan tr                   # Alias for `nofan trends`
$ nofan m                    # Alias for `nofan mentions`
$ nofan hi nofan.            # Post status "hi nofan."
$ nofan undo                 # Delete last status
$ nofan hi -p ~/hola.png     # Post status "hi" with a photo
$ nofan hi -c                # Post status "hi" with a photo from clipboard
$ nofan home -t              # Display timeline with time ago tag
$ nofan notifier start       # Start Nofan Notifier process
$ nofan notifier stop        # Stop Nofan Notifier process
$ nofan notifier restart     # Restart Nofan Notifier process
$ nofan notifier delete      # Delete Nofan Notifier process
```

### Color scheme

Use `nofan colors` to customize your color scheme.

![nofan-colors](https://raw.githubusercontent.com/LitoMore/nofan/master/media/nofan-colors.gif)

**Format**

Use dot `.` to separeate multiple styles.

Here is [valid styles list](https://github.com/LitoMore/chalk-pipe#valid-styles).

**Example**

```
> #ff99cc
> bold.#ff0000
> pink.underline
> cyanBright
> orange.inverse.underline
```

## Related

- [fanfou-sdk](https://github.com/LitoMore/fanfou-sdk-node) - Fanfou SDK for Node.js
- [fanfou-streamer](https://github.com/LitoMore/fanfou-streamer) - Fanfou Streaming SDK for Node.js
- [fanfou-desktop-notifier](https://github.com/LitoMore/fanfou-desktop-notifier) - Fanfou Desktop Notifier
- [inquirer-chalk-pipe](https://github.com/LitoMore/inquirer-chalk-pipe) - Prompt for input chalk-pipe style strings

## License

MIT © [LitoMore](https://github.com/LitoMore)
