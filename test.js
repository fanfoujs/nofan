'use strict'

const test = require('ava')
const execa = require('execa')

const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  FANFOU_USERNAME,
  FANFOU_PASSWORD
} = process.env

const PULL_REQUEST_FROM_FORKED = !(CONSUMER_KEY && CONSUMER_SECRET && FANFOU_USERNAME && FANFOU_PASSWORD)

test('nofan config', async t => {
  const {stdout} = await execa('./bin/nofan.js', ['config', CONSUMER_KEY, CONSUMER_SECRET])
  t.is(stdout, '')
})

test('nofan login', async t => {
  const {stdout} = await execa('./bin/nofan.js', ['login', FANFOU_USERNAME, FANFOU_PASSWORD])
  PULL_REQUEST_FROM_FORKED ? t.is(stdout, '') : t.is(stdout, '')
})

test('nofan switch', async t => {
  const {stdout} = await execa('./bin/nofan.js', ['switch', FANFOU_USERNAME])
  PULL_REQUEST_FROM_FORKED ? t.is(stdout, '') : t.is(stdout, '')
})

test('nofan logout', async t => {
  const {stdout} = await execa('./bin/nofan.js', ['logout'])
  PULL_REQUEST_FROM_FORKED ? t.is(stdout, '') : t.is(stdout, '')
})
