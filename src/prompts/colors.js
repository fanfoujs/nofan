'use strict'

module.exports = config => {
  return [
    {
      type: 'color-input',
      name: 'text',
      message: 'Text color',
      default: config.COLORS.text || ''
    }, {
      type: 'color-input',
      name: 'name',
      message: 'Name color',
      default: config.COLORS.name || 'green'
    }, {
      type: 'color-input',
      name: 'at',
      message: 'ATs color',
      default: config.COLORS.at || 'blue'
    }, {
      type: 'color-input',
      name: 'link',
      message: 'Link color',
      default: config.COLORS.link || 'blue'
    }, {
      type: 'color-input',
      name: 'tag',
      message: 'Tag color',
      default: config.COLORS.tag || 'blue'
    }, {
      type: 'color-input',
      name: 'photo',
      message: 'Photo color',
      default: config.COLORS.photo || 'blue'
    }, {
      type: 'color-input',
      name: 'timeago',
      message: 'Timeago color',
      default: config.COLORS.timeago || 'green'
    }, {
      type: 'color-input',
      name: 'highlight',
      message: 'Highlight color',
      default: config.COLORS.highlight || 'bold'
    }
  ]
}
