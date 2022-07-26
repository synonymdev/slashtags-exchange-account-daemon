'use strict'

const path = require('path')
const fs = require('fs/promises')
const Sqlite3 = require('sqlite3')
const customErr = require('./CustomError')

const _err = {
  dbNameMissing: 'DB_NAME_MISSING',
  configMissing: 'CONFIG_MISSING',
  notReady: 'DB_NOT_INITED'
}

const SqliteErr = customErr({
  errName: 'SQLITE_ERROR:',
  fileName: __filename
})

class Sqlite {
  constructor (config) {
    if (!config) throw new SqliteErr(_err.configMissing)
    this.config = config
    if (!this.config?.name) throw new SqliteErr(_err.dbNameMissing)
    this.version = '0.0.1'
    this.ready = false
    this.dbPath = path.resolve(this.config.path, `sqlite-${this.config.name}-${this.version}.sqlite`)
  }

  static Error = SqliteErr

  deleteSqlite () {
    if (!this.ready) throw new Error(_err.notReady)
    return fs.unlink(this.dbPath)
  }

  async start () {
    return new Promise((resolve, reject) => {
      this.sqlite = new Sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          return reject(err)
        }
        this.ready = true
        resolve()
      })
    })
  }

  static err = _err
}

module.exports = Sqlite
