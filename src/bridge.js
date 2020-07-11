'use strict';

class Bridge {
  constructor(ecovacsClient, mqttClient, topic) {
    this.ecovacsClient = ecovacsClient;
    this.mqttClient = mqttClient;
    this.topic = topic;

    this.commands = [
      'clean',
      'cleancustomarea',
      'charge',
      'stop'
    ];

    this.events = [
      {
        name: 'ChargeState',
        trigger: 'chargestate',
        topic: 'chargestate'
      },
      {
        name: 'BatteryInfo',
        trigger: 'batterystate',
        topic: 'batterystate'
      },
      {
        name: 'CleanReport',
        trigger: 'cleanstate',
        topic: 'cleanstate'
      },
      {
        name: 'DeebotPosition',
        trigger: 'getposition',
        topic: 'position'
      }
    ];
  }

  async link() {
    try {
      await this.ecovacsClient.connect();
      console.log('Successfully connected to the Ecovacs systems.');
    } catch (e) {
      console.log('Failed to connect to the Ecovacs systems!', e);
    }

    this.ecovacsClient.getDevice().then((device) => {
      this.publishDeviceInfo(device);
      this.subscribeToEvents(device);
      this.subscribeToCommands(device.vacuum.did);
      this.handleCommands(device);
      this.triggerAllEvents(device);
    }).catch((e) => {
      console.log('Failed to establish a connection to the vacuum!', e);
    });

    this.updateStatus('online');



    //setInterval(() => {

      //this.updateStatus('online');
    //}, 60000);

  }

  async updateStatus(status) {
    try {
      await this.mqttClient.publish(this.topic + '/bridge/status', status);
    } catch (e) {
      console.log('Failed to write to the topic!', e);
    }
  }

  async publishDeviceInfo(device) {
    try {
      await this.mqttClient.publish(this.topic + '/' + device.vacuum.did + '/info', JSON.stringify(device.vacuum));
    } catch (e) {
      console.log('Failed to publish device info!', e);
    }
  }

  async triggerAllEvents(device) {
    this.events.forEach((event) => {
      device.run(event.trigger);
      console.log('Executed `' + event.trigger + '` event trigger.');
    });
  }

  async subscribeToEvents(device) {
    let topic = this.topic + '/' + device.vacuum.did + '/';

    this.events.forEach((event) => {
      let fullTopic = topic + event.topic;

      device.on(event.name, async (result) => {
        try {
          await this.mqttClient.publish(fullTopic, String(result));
        } catch (e) {
          console.log('Failed to republish `' + event.name + '` under ' + fullTopic + '!', e);
        }
      });

      console.log('Subscribed to `' + event.name + '` event.');
    });
  }

  async subscribeToCommands(did) {

    this.commands.forEach((cmd) => {
      let fullTopic = this.topic + '/' + did + '/cmd/' + cmd;

      this.mqttClient.subscribe(fullTopic).then((message, second) => {
        console.log('Subscribed to ' + fullTopic + ' command topic.');
      }).catch ((e) => {
        console.log('Failed to subscribe to ' + fullTopic + ' command topic!', e);
      });
    });
  }

  async handleCommands(device) {
    this.mqttClient.on('message', (topic, message) => {
      let topicParts = topic.split('/')
      let command = topicParts[topicParts.length - 1]

      switch (command) {
        case 'clean':
          console.log('Received `clean` command.');
          device.run("clean")
          break;
        case 'cleancustomarea':
          console.log('Received `cleancustomarea` command.');
          break;
        case 'charge':
          console.log('Received `charge` command.');
          device.run("charge")
          break;
        case 'stop':
          console.log('Received `stop` command.');
          device.run("stop")
          break;
      }
    });
  }
}

module.exports = Bridge;
