const bonjour = require('bonjour');
const debug = require('debug')('googlecast:discoverer');
const { CastDevice } = require('./CastDevice');
const { buildDeviceState } = require('neeo-sdk');

const QUERY_CAST_DEVICES_INTERVAL = 10000;

const DEFAULT_DISCOVER_TIME_MILLIS = 2000;

const deviceState = buildDeviceState();

let onDeviceDiscoveredCallbacks = [];
let mdnsQueryIntervalHandle;

const browser = bonjour()
    .find({
        type: 'googlecast'
    })
    .on('up', function (service) {
        const newDevice = new CastDevice({
            id: service.name,
            host: service.host,
            name: service.txt.fn
        });
        const existingDevice = getDiscoveredCastDevice(newDevice.getId());

        if (!existingDevice) {
            newDevice.connect();
            deviceState.addDevice(newDevice.getId(), newDevice);
        }
    });

function queryCastDevices() {
    browser.update();
}

function setTimeoutPromise(millis) {
    return new Promise(function (resolve) {
        setTimeout(resolve, millis);
    });
}

function discoverCastDevices(discoveryTimeMillis = DEFAULT_DISCOVER_TIME_MILLIS) {
    queryCastDevices();

    return setTimeoutPromise(discoveryTimeMillis).then(getDiscoveredCastDevices);
}

function getDiscoveredCastDevices() {
    return deviceState.getAllDevices().map(device => device.clientObject);
}

function getDiscoveredCastDevice(deviceId) {
    return getDiscoveredCastDevices().find(device => device.getId() === deviceId);
}

function stopDiscoveringDevices() {
    if (!mdnsQueryIntervalHandle) {
        return;
    }

    debug('Stopping device discovery');
    browser.stop();
    clearInterval(mdnsQueryIntervalHandle);
}

function startDiscoveringDevices() {
    if (mdnsQueryIntervalHandle) {
        return;
    }

    debug('Starting device discovery');
    browser.start();
    setInterval(queryCastDevices, QUERY_CAST_DEVICES_INTERVAL);
}

function registerOnCastDeviceDiscovered(onDeviceDiscovered) {
    onDeviceDiscoveredCallbacks.push(onDeviceDiscovered);
}

module.exports = {
    startDiscoveringDevices,
    stopDiscoveringDevices,
    discoverCastDevices,
    getDiscoveredCastDevices,
    getDiscoveredCastDevice,
    registerOnCastDeviceDiscovered
};
