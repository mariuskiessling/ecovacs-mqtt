'use strict';

const config = require('./config.json');
const mqtt = require('async-mqtt');
const Ecovacs = require('./src/ecovacs')
const Bridge = require('./src/bridge')

async function main() {
  console.log('Starting the Deboot bridge...')

  let mqttClient;

  try {
    mqttClient = await mqtt.connectAsync({
      host: config.mqtt.server,
      port: config.mqtt.port,
      username: config.mqtt.username,
      password: config.mqtt.password
    });

    console.log('Successfully connected to the MQTT server.')
  } catch (e) {
    console.log('Failed to connect to the MQTT server!', e);
    process.exit();
  }

  let eco = new Ecovacs(config.deboot.username, config.deboot.password, config.deboot.country);

  try {
    let bridge = new Bridge(eco, mqttClient, config.mqtt.topic);
    bridge.link();
  } catch (e) {
    console.log(e);
  }
}

main()
