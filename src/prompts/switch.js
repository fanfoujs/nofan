'use strict'

module.exports = choices => {
  return [
    {
      type: 'list',
      name: 'username',
      message: 'Switch account to',
      choices,
      pageSize: 20
    }
  ]
}
