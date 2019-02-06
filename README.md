# Nofan

[![](https://badges.greenkeeper.io/LitoMore/nofan.svg)](https://greenkeeper.io/)
[![](https://img.shields.io/travis/LitoMore/nofan/master.svg)](https://travis-ci.org/LitoMore/nofan)
[![](https://img.shields.io/appveyor/ci/LitoMore/nofan/master.svg)](https://ci.appveyor.com/project/LitoMore/nofan)
[![](https://img.shields.io/npm/v/nofan.svg)](https://www.npmjs.com/package/nofan)
[![](https://img.shields.io/npm/l/nofan.svg)](https://github.com/LitoMore/nofan/blob/master/LICENSE)
[![](https://img.shields.io/badge/unicorn-approved-ff69b4.svg)](https://www.youtube.com/watch?v=9auOCbH5Ns4)
[![](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

CLI for Fanfou

<div align="center"><img src="https://raw.githubusercontent.com/LitoMore/nofan/master/media/screenshot.png" alt="Nofan" /></div>

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

## Installation

```bash
$ npm install -g nofan
```

## Login

```bash
# Login fanfou account
$ nofan login
```

## Usage

### Commands

```bash
$ nofan -h                 # Show help
$ nofan config             # Customize display
$ nofan colors             # Customize color style
$ nofan login              # Login fanfou account
$ nofan logout             # Logout current account
$ nofan switch             # Switch fanfou account
$ nofan                    # Fetch home-timeline
$ nofan home|h             # Fetch home-timeline
$ nofan mentions|m         # Fetch mentions-timeline
$ nofan me                 # Fetch self-timeline
$ nofan public|p           # Fetch public-timeline
$ nofan trends|tr          # Fetch trends-timeline
$ nofan search|se <query>  # Search public-timeline
$ nofan user <id>          # Fetch user-timeline by ID
$ nofan undo               # Delete last status
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
> bgYellow.black
```

## Related

- [fanfou-sdk](https://github.com/LitoMore/fanfou-sdk-node) - Fanfou SDK for Node.js
- [inquirer-chalk-pipe](https://github.com/LitoMore/inquirer-chalk-pipe) - Prompt for input chalk-pipe style strings

## License

MIT © [LitoMore](https://github.com/LitoMore)
