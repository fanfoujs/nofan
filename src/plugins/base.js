const _ = require('lodash')
const Base = require('inquirer/lib/prompts/base')
const Choices = require('inquirer/lib/objects/choices')
const ScreenManager = require('./screen-manager')

Base.contructor = function (question, rl, answers) {
  // Setup instance defaults property
  _.assign(this, {
    answers: answers,
    status: 'pending'
  })

  // Set defaults prompt options
  this.opt = _.defaults(_.clone(question), {
    validate: function () {
      return true
    },
    filter: function (val) {
      return val
    },
    when: function () {
      return true
    }
  })

  // Check to make sure prompt requirements are there
  if (!this.opt.message) {
    this.throwParamError('message')
  }
  if (!this.opt.name) {
    this.throwParamError('name')
  }

  // Normalize choices
  if (Array.isArray(this.opt.choices)) {
    this.opt.choices = new Choices(this.opt.choices, answers)
  }

  this.rl = rl
  this.screen = new ScreenManager(this.rl)
}

module.exports = Base
