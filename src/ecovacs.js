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

  getDevices() {
    return new Promise((resolve, reject) => {
      this.api.devices().then((devices) => {
        let deviceReadyPromises = []

        devices.forEach(async (device) => {
          let deviceReady = this.isDeviceReady(device);
          deviceReadyPromises.push(deviceReady);

          deviceReady.then((vacuum) => {
            console.log('The vacuum ' + vacuum.vacuum.did + ' (Nick: `' + vacuum.vacuum.nick + '`) is ready.');
          }).catch((e) => {
            console.log('One device did not get ready in time!', e)
            reject(e)
          });
        });

        Promise.all(deviceReadyPromises).then((devices) => {
          resolve(devices);
        });
      })
    });
  }

  async isDeviceReady(device) {
    return new Promise((resolve, reject) => {
      let vacuum = this.api.getVacBot(this.api.uid, EcoVacsAPI.REALM, this.api.resource, this.api.user_access_token, device, this.continent);

      let timeout = setTimeout(() => {
        reject('Failed to establish a connection to at the vacuums within 30 seconds!');
      }, 30000);

      vacuum.on('ready', (event) => {
        clearTimeout(timeout);
        resolve(vacuum);
      });
    });
  }
}

module.exports = Ecovacs;
