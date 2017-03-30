# nofan

FanFou Cli for Node.js

## Installation

```bash
$ npm install -g nofan
```

## Config & Login

```bash
# config consumer key and consumer secret
$ nofan config

# login fanfou
$ nofan login
```

## Usage

```bash
$ nofan --help         # show help
$ nofan                # get the latest 10 messages from home timeline
$ nofan home           # get the latest 10 messages from home timeline
$ nofan mentions       # get the latest 10 messages from mentions
$ nofan public         # get the latest 10 messages from public timeline
$ nofan home 20        # get the latest 20 messages from public timeline
$ nofan h              # alias for `nofan home`
$ nofan p              # alias for `nofan public`
$ nofan m              # alias for `nofan mentions`
$ nofan "hi nofan."    # post status "hi nofan"
$ nofan undo           # delete last status
```
