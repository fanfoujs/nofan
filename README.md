# Nofan

[![](https://badges.greenkeeper.io/LitoMore/nofan.svg)](https://greenkeeper.io/)
[![](https://img.shields.io/travis/LitoMore/nofan/master.svg)](https://travis-ci.org/LitoMore/nofan)
[![](https://img.shields.io/appveyor/ci/LitoMore/nofan/master.svg)](https://ci.appveyor.com/project/LitoMore/nofan)
[![](https://img.shields.io/npm/v/nofan.svg)](https://www.npmjs.com/package/nofan)
[![](https://img.shields.io/npm/l/nofan.svg)](https://github.com/LitoMore/nofan/blob/master/LICENSE)
[![](https://img.shields.io/badge/unicorn-approved-ff69b4.svg)](https://www.youtube.com/watch?v=9auOCbH5Ns4)
[![](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

FanFou Cli for Node.js

<div style="text-align: center;"><img src="https://raw.githubusercontent.com/LitoMore/nofan/master/screenshot.png" alt="Nofan" /></div>

## Features

- Fetch home-timeline
- Fetch public-timeline
- Fetch mentions-timeline
- Fetch self-timeline
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

## Config & Login

```bash
# config consumer key and consumer secret
$ nofan config

# login fanfou account
$ nofan login
```

## Usage

### Commands

```bash
$ nofan --help               # show help
$ nofan config               # config consumer key and consumer secret
$ nofan colors               # customize color style
$ nofan login                # login fanfou account
$ nofan logout               # logout current account
$ nofan switch               # switch fanfou account
$ nofan                      # get the latest 10 statuses from home timeline
$ nofan home                 # get the latest 10 statuses from home timeline
$ nofan mentions             # get the latest 10 statuses from mentions
$ nofan me                   # get the latest 10 statuses from yourself
$ nofan public               # get the latest 10 statuses from public timeline
$ nofan home 20              # get the latest 20 statuses from public timeline
$ nofan s                    # alias for `nofan switch`
$ nofan h                    # alias for `nofan home`
$ nofan p                    # alias for `nofan public`
$ nofan m                    # alias for `nofan mentions`
$ nofan hi nofan.            # post status "hi nofan."
$ nofan undo                 # delete last status
$ nofan hi -p ~/hola.png     # post status "hi" with a photo
$ nofan home -t              # show timeline with time ago tag
$ nofan --no-photo-tag       # show timeline whihout photo tag
```

### Color scheme

Use `nofan colors` to customize your color scheme.

**Format**

Use dot `.` to separeate multiple styles.

Here is [valid styles list](https://github.com/LitoMore/chalk-pipe#valid-stylese).

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

## License

MIT © [LitoMore](https://github.com/LitoMore)
