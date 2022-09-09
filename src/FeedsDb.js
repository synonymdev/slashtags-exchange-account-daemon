'use strict'

const async = require('async')
const Sqlite = require('./Sqlite')
const util = require('../src/util')

class FeedManager {
  constructor (config) {
    if (!config?.path) {
      throw new Error('DB_PATH_NOT_SET')
    }
    this.config = config
  }

  async init () {
    await util.mkdir(this.config.path)
    this.db = new Sqlite(this.config)

    await this.db.start()
    await async.eachSeries([
      `CREATE TABLE IF NOT EXISTS slashtags_feeds (
            user_id VARCHAR(255) NOT NULL,
            feed_key TEXT NOT NULL,
            state INT,
            encrypt_key TEXT,
            meta TEXT,
            ts_created BIGINT,
            PRIMARY KEY (feed_key)
          )`,
      'CREATE INDEX IF NOT EXISTS slashtags_ix1 ON slashtags_feeds (user_id)'
    ], (cmd, next) => {
      this.db.sqlite.run(cmd, next)
    })
  }

  findByUser (userId) {
    return new Promise((resolve, reject) => {
      this.db.sqlite.get(`SELECT * from slashtags_feeds WHERE user_id is "${userId}" and state = 1`, [], (err, data) => {
        if (err) {
          return reject(err)
        }
        if (!data) {
          return resolve(null)
        }
        data.meta = JSON.parse(data.meta)
        resolve(data)
      })
    })
  }

  getAllActiveFeeds (userId) {
    return new Promise((resolve, reject) => {
      this.db.sqlite.all('SELECT * from slashtags_feeds WHERE state is 1', [], (err, data) => {
        if (err) {
          return reject(err)
        }
        if (!data) {
          return resolve(null)
        }
        resolve(data)
      })
    })
  }

  insert (data) {
    return new Promise((resolve, reject) => {
      this.db.sqlite.run(`INSERT OR ${data.replace ? 'REPLACE' : 'IGNORE'} INTO slashtags_feeds 
          (
            user_id,
            feed_key,
            state,
            encrypt_key,
            meta,
            ts_created
          ) VALUES 
          (
            $user_id,
            $feed_key,
            $state,
            $encrypt_key,
            $meta,
            $ts_created
          )`, {
        $user_id: data.user_id,
        $feed_key: data.feed_key,
        $state: 1,
        $encrypt_key: data.encrypt_key,
        $meta: JSON.stringify(data.meta),
        $ts_created: Date.now()
      }, (err, data) => {
        if (err) return reject(err)
        resolve(data)
      })
    })
  }

  removeUser (userId) {
    return new Promise((resolve, reject) => {
      this.db.sqlite.run(`UPDATE slashtags_feeds SET state = 0 WHERE user_id="${userId}" `, [], (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      })
    })
  }
}
module.exports = FeedManager