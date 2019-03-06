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
- Fetch status item
- Search statuses
- Post statuses
- Post photos
- Reply status
- Repost status
- Multiple account login
- HTTPS secure connection
- Customizable timeline
- Customizable color themes
- Customizable GET/POST request

## Install

```bash
$ npm i -g nofan
```

---

<a href="https://www.patreon.com/LitoMore">
	<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## Login

```bash
# Login fanfou account
$ nofan login
```

## Usage

### Commands

```bash
$ nofan -h                     # Show help
$ nofan config                 # Config nofan
$ nofan colors                 # Customize color style
$ nofan login                  # Login fanfou account
$ nofan logout                 # Logout current account
$ nofan switch                 # Switch fanfou account
$ nofan                        # Fetch home timeline
$ nofan home|h                 # Fetch home timeline
$ nofan mentions|m             # Fetch mentions timeline
$ nofan me                     # Fetch self timeline
$ nofan public|p               # Fetch public timeline
$ nofan trends|tr              # Fetch trends timeline
$ nofan search|se <query>      # Search public timeline
$ nofan user <id>              # Fetch user timeline
$ nofan show <id>              # Fetch status item
$ nofan reply|re <id> [text]   # Reply status
$ nofan repost|rt <id> [text]  # Repost status
$ nofan undo                   # Delete last status
$ nofan <text> [more...]       # Post status
$ nofan get <uri>              # Create GET request
$ nofan post <uri>             # Create POST request
```

## Tips

### Color Scheme

Use `nofan colors` to customize your color scheme.

<img width="50%" height="50%" src="https://raw.githubusercontent.com/LitoMore/nofan/master/media/nofan-colors.gif" />

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

### Photos Posting

Nofan support post a photo from a local path or clipboard:

```bash
# Post a photo from local path, use `-p` or `--photo`
$ nofan unicorn -p ~/Desktop/heart.png

# Post a photo from clipboard (macOS only), use `-c` or `--clipboard`
$ nofan hi my love -c
```

### Verbose Mode

Now we have a verbose mode for the timeline.

<img width="815" alt="image" src="https://user-images.githubusercontent.com/8186898/53097674-fe3a2e80-355c-11e9-8884-5037f789bcd6.png">

### Reply & Repost

You could do a quick action by use `reply` and `repost` command:

```bash
# Reply
$ nofan re _5gqZTpjAlM hi litomore

# Repost
$ nofan rt _5gqZTpjAlM hi litomore
```

### API Parameter Flags

Nofan is very easy to use, but also very powerful. You could pass to [API](https://github.com/FanfouAPI/FanFouAPIDoc/wiki/Apicategory) parameters as flags to the CLI.

You could do something like this:

```bash
$ nofan --page=2 --count=30
$ nofan se unicron --count=60
```

### Customizable GET/POST Request

Use `nofan get` or `nofan post` to create a GET/POST request:

```bash
$ nofan get account/notification
$ nofan get statuses/home_timeline --mode=lite
$ nofan post statuses/update --status=hi
```

## Related

- [fanfou-sdk](https://github.com/LitoMore/fanfou-sdk-node) - Fanfou SDK for Node.js
- [inquirer-chalk-pipe](https://github.com/LitoMore/inquirer-chalk-pipe) - Prompt for input chalk-pipe style strings

## License

MIT © [LitoMore](https://github.com/LitoMore)
