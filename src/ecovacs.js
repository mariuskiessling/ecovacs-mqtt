'use strict';

const ecovacsDeebot = require('ecovacs-deebot');
const EcoVacsAPI = ecovacsDeebot.EcoVacsAPI;
const VacBot = ecovacsDeebot.VacBot;
const machineId = require('node-machine-id');

class Ecovacs {
  constructor(username, password, country) {
    this.username = username;
    // The complete interaction with the Ecovacs ecosystem is authenticated
    // using the MD5 hash of the password. There is no need to store the
    // unhashed version.
    this.country = country;
    this.continent = ecovacsDeebot.countries['DE'].continent.toLowerCase();
    this.password = EcoVacsAPI.md5(password);
    this.deviceId = EcoVacsAPI.md5(machineId.machineIdSync());
    this.api = new EcoVacsAPI(this.deviceId, this.country, this.continent);
  }

  connect() {
    return this.api.connect(this.username, this.password)
  }

  getDevice() {
    return new Promise((resolve, reject) => {
      this.api.devices().then((devices) => {
        if (devices.length != 1) {
          reject('Received ' + devices.length + ' Ecovacs device(s). Can only deal with one device')
        }

        let vacuum = devices[0]
        let vacbot = this.api.getVacBot(this.api.uid, EcoVacsAPI.REALM, this.api.resource, this.api.user_access_token, vacuum, this.continent);

        let timeout = setTimeout(() => {
          reject('Failed to establish a connection to the bot within 30 seconds!');
        }, 30000);

        vacbot.on('ready', (event) => {
          clearTimeout(timeout)
          resolve(vacbot);
        });
      })
    });
  }
}

module.exports = Ecovacs;
