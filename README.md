# Nofan

[![](https://github.com/fanfoujs/nofan/workflows/Node/badge.svg)](https://github.com/fanfoujs/nofan/actions)
[![](https://img.shields.io/npm/v/nofan.svg)](https://www.npmjs.com/package/nofan)
[![](https://img.shields.io/npm/l/nofan.svg)](https://github.com/fanfoujs/nofan/blob/master/LICENSE)
[![](https://img.shields.io/badge/unicorn-approved-ff69b4.svg)](https://www.youtube.com/watch?v=9auOCbH5Ns4)
[![](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

CLI for Fanfou

<div align="center"><img src="https://raw.githubusercontent.com/fanfoujs/nofan/master/media/screenshot.png" alt="Nofan" /></div>

## Features

- Fetch home-timeline
- Fetch public-timeline
- Fetch mentions-timeline
- Fetch context-timeline
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

```sh
npm i -g nofan
```

## Login

```sh
nofan login
```

## Usage

### Commands

```sh
nofan -h                     # Show help
nofan config                 # Config nofan
nofan colors                 # Customize color style
nofan login                  # Login fanfou account
nofan logout                 # Logout current account
nofan switch                 # Switch fanfou account
nofan                        # Fetch home timeline
nofan home|h                 # Fetch home timeline
nofan mentions|m             # Fetch mentions timeline
nofan me                     # Fetch self timeline
nofan public|p               # Fetch public timeline
nofan context|cont           # Fetch context timeline
nofan trends|tr              # Fetch trends timeline
nofan search|se <query>      # Search public timeline
nofan user <id>              # Fetch user timeline
nofan show <id>              # Fetch status item
nofan reply|re <id> [text]   # Reply status
nofan repost|rt <id> [text]  # Repost status
nofan undo                   # Delete last status
nofan <text> [more...]       # Post status
nofan get <uri>              # Create GET request
nofan post <uri>             # Create POST request
```

## Tips

### Color Scheme

Use `nofan colors` to customize your color scheme.

<img width="50%" height="50%" src="https://raw.githubusercontent.com/fanfoujs/nofan/master/media/nofan-colors.gif" />

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

#### Use `-p` or `--photo` to post photo from local path

```sh
nofan unicorn -p ~/Desktop/heart.png
```

#### Use `-c` or `--clipboard` to post photo from clipboard (only support macOS, Windows and WSL)

```sh
nofan hi my love -c
```

### Verbose Mode

Now we have a verbose mode for the timeline.

<img width="815" alt="image" src="https://user-images.githubusercontent.com/8186898/53097674-fe3a2e80-355c-11e9-8884-5037f789bcd6.png">

### Reply & Repost

You could do a quick action by use `reply` and `repost` command:

#### Use `re` or `reply` to reply

```sh
nofan re _5gqZTpjAlM hi litomore
```

#### Use `rt` or `repost` to repost

```sh
nofan rt _5gqZTpjAlM hi litomore
```

### API Parameter Flags

Nofan is very easy to use, but also very powerful. You could pass to [API](https://github.com/FanfouAPI/FanFouAPIDoc/wiki/Apicategory) parameters as flags to the CLI.

#### Fetch home-timeline with pagination

```sh
nofan --page=2
```

#### Search statuses with specific page size

```sh
nofan search unicron --count=60
```

### Customizable GET/POST Request

Use `nofan get` or `nofan post` to make a GET/POST request:

#### Make a GET request

```sh
nofan get account/notification
```

#### Make a GET request with parameters

```sh
nofan get statuses/home_timeline --mode=lite
```

#### Make a POST request with parameters

```sh
nofan post statuses/update --status=hi
```

#### Specify a console type

You could specify a [console type](https://nodejs.org/dist/latest/docs/api/console.html) for output, default is `console.log`:

```sh
nofan get account/notification --console-type=table
```

#### REPL

You could use `--repl` option to inspect the result in [REPL](https://nodejs.org/dist/latest/docs/api/repl.html):

```sh
nofan get users/show --id=litomore --repl

#=> result.name
#=> 'LitoMore' 
```

## Related

- [fanfou-sdk](https://github.com/fanfoujs/fanfou-sdk-node) - Fanfou SDK for Node.js
- [bitbar-fanfou](https://github.com/LitoMore/bitbar-fanfou) - Fanfou notification indicator on BitBar

## License

MIT
