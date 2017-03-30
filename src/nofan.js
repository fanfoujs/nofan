'use strict';

const fs = require('fs');
const colors = require('colors');
const prompt = require('prompt');
const homedir = require('homedir');
const Fanfou = require('fanfou-sdk');

class Nofan {
  static login() {
    Nofan._getConfig((config) => {
      const schema = {
        properties: {
          username: {
            description: 'Enter your username',
            required: true
          },
          password: {
            description: 'Enter your password',
            hidden: true,
            replace: '*'
          }
        }
      };
      prompt.message = '<nofan>';
      prompt.start();
      prompt.get(schema, function (e, res) {
        if (e) console.error(e);
        else {
          const ff = new Fanfou({
            auth_type: 'xauth',
            consumer_key: config.CONSUMER_KEY,
            consumer_secret: config.CONSUMER_SECRET,
            username: res.username,
            password: res.password,
          });
          ff.xauth((e, res) => {
            if (e) console.log('Login failed!');
            else {
              Nofan._createTokenFile(JSON.stringify(res), () => {
                console.log('Login succeed!');
              })
            }
          });
        }
      });
    });
  }

  static logout() {
    Nofan._createTokenFile(JSON.stringify({
      oauth_token: '',
      oauth_token_secret: '',
    }), () => {
      console.log('Logout succeed!');
    });
  }

  static config() {
    const schema = {
      properties: {
        consumer_key: {
          description: 'Enter your consumer key',
          required: true
        },
        consumer_secret: {
          description: 'Enter your consumer secret',
          required: true
        }
      }
    };
    prompt.message = '<nofan>';
    prompt.start();
    prompt.get(schema, function (e, res) {
      if (e) console.error(e);
      else {
        const config = {
          CONSUMER_KEY: res.consumer_key,
          CONSUMER_SECRET: res.consumer_secret,
        };
        Nofan._createConfigFile(
          JSON.stringify(config),
          () => {
            console.log(JSON.stringify(config));
          }
        );
      }
    });
  }

  static homeTimeline(count) {
    count = count || 10;
    Nofan._get('/statuses/home_timeline', {count: count}, (e, res, obj) => {
      if (e) console.error(e);
      else {
        Nofan._displayTimeline(obj);
      }
    });
  }

  static publicTimeline(count) {
    count = count || 10;
    Nofan._get('/statuses/public_timeline', {count: count}, (e, res, obj) => {
      if (e) console.error(e);
      else {
        Nofan._displayTimeline(obj);
      }
    });
  }

  static update(text) {
    Nofan._post('/statuses/update', {status: text}, (e, res, obj) => {
      if (e) console.log(e);
    });
  }

  static mentions(count) {
    count = count || 10;
    Nofan._get('/statuses/mentions', {count: count}, (e, res, obj) => {
      if (e) console.error(e);
      else {
        Nofan._displayTimeline(obj);
      }
    });
  }

  static _createNofanDir(callback) {
    fs.mkdir(homedir() + '/.nofan/', (res) => {
      callback(res);
    });
  }

  static _createConfigFile(config, callback) {
    Nofan._createNofanDir((res) => {
      fs.writeFile(homedir() + '/.nofan/config.json', config, 'utf8', (err) => {
        if (err) console.error(err);
        else callback(null);
      });
    });
  }

  static _createTokenFile(token, callback) {
    Nofan._createNofanDir((res) => {
      fs.writeFile(homedir() + '/.nofan/token.json', token, 'utf8', (err) => {
        if (err) console.error(err);
        else {
          callback(null);
        }
      })
    });
  }

  static _getTokens(callback) {
    fs.readFile(homedir() + '/.nofan/token.json', 'utf8', (err, data) => {
      if (err) callback(err);
      else {
        callback(null, data);
      }
    });
  }

  static _getConfig(callback) {
    fs.open(homedir() + '/.nofan/config.json', 'r', (e, fd) => {
      if (e) {
        if (e.code === 'ENOENT') {
          console.error(`file '${homedir()}/.nofan/config.json' does not exist`.red);
          return;
        }
        throw e;
      }
      else callback(require(`${homedir()}/.nofan/config`));
    });
  }

  static _get(uri, params, callback) {
    Nofan._getConfig((config) => {
      Nofan._getTokens((e, data) => {
        if (e) callback(e);
        else {
          const tokens = JSON.parse(data);
          const ff = new Fanfou({
            auth_type: 'oauth',
            consumer_key: config.CONSUMER_KEY,
            consumer_secret: config.CONSUMER_SECRET,
            oauth_token: tokens.oauth_token,
            oauth_token_secret: tokens.oauth_token_secret,
          });
          ff.get(uri, params, (e, res, obj) => {
            callback(e, res, obj);
          });
        }
      });
    });
  }

  static _post(uri, params, callback) {
    Nofan._getConfig((config) => {
      Nofan._getTokens((e, data) => {
        if (e) callback(e);
        else {
          const tokens = JSON.parse(data);
          const ff = new Fanfou({
            auth_type: 'oauth',
            consumer_key: config.CONSUMER_KEY,
            consumer_secret: config.CONSUMER_SECRET,
            oauth_token: tokens.oauth_token,
            oauth_token_secret: tokens.oauth_token_secret,
          });
          ff.post(uri, params, (e, res, obj) => {
            callback(e, res, obj);
          });
        }
      });
    });
  }

  static _displayTimeline(timeline) {
    for (let i = 0; i < timeline.length; i++) {
      const status = timeline[i];
      let text = status.text;
      let ats = status.text.match(/@([\u4E00-\u9FA5\uF900-\uFA2D\w\.]+)/g);
      if (ats === null) ats = [];
      ats.forEach((v) => {
        text = text.replace(eval(`/${v}/`), v.blue);
      });
      let photo_url = '';
      // if (status.hasOwnProperty('photo')) photo_url = ` ${status.photo.originurl}`.blue;
      console.log(`[${status.user.name.green}] ${text}${photo_url}`);
    }
  }
}

module.exports = Nofan;
