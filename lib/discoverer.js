import mdns from 'multicast-dns';
import rawDebug from 'debug';
import dnsTxt from 'dns-txt';
import { CastDevice } from './CastDevice';
import { buildDeviceState } from 'neeo-sdk';

const QUERY_CAST_DEVICES_INTERVAL = 10000;

const DEFAULT_DISCOVER_TIME_MILLIS = 2000;

const GOOGLECAST_MDNS_NAME = '_googlecast._tcp.local';

const deviceState = buildDeviceState();
const debug = rawDebug('googlecast:discoverer');

let onDeviceDiscoveredCallbacks = [];
let mdnsQueryIntervalHandle;

const browser = mdns();
browser.on('response', onMdnsResponse);

function onMdnsResponse(response) {
    const service = parseMdnsResponse(response);

    if (!service) {
        return;
    }

    const newDevice = new CastDevice(service);
    const existingDevice = getDiscoveredCastDevice(newDevice.getName());

    if (!existingDevice) {
        newDevice.connect();
        deviceState.addDevice(newDevice.getName(), newDevice);
    }
}

function parseMdnsResponse(response) {
    const relevantAnswer = response.answers.find(answer => answer.name === GOOGLECAST_MDNS_NAME);

    if (!relevantAnswer) {
        return;
    }

    const serviceName = relevantAnswer.data.replace(GOOGLECAST_MDNS_NAME, '');

    const service = {
        name: serviceName,
        txtRecord: {},
        addresses: []
    };

    response.additionals.forEach(function (additional) {
        switch (additional.type) {
            case 'TXT': {
                const decodedData = dnsTxt().decode(additional.data);
                Object.assign(service.txtRecord, decodedData);
                break;
            }
            case 'A':
                service.addresses.push(additional.data);
        }
    });

    return service;
}

function queryCastDevices() {
    browser.query({
        questions: [{
            name: '_googlecast._tcp.local',
            type: 'PTR'
        }]
    });
}

function setTimeoutPromise(millis) {
    return new Promise(function (resolve) {
        setTimeout(resolve, millis);
    });
}

function discoverCastDevices(discoveryTimeMillis = DEFAULT_DISCOVER_TIME_MILLIS) {
    queryCastDevices();

    return setTimeoutPromise(discoveryTimeMillis).then(deviceState.getAllDevices);
}

function getDiscoveredCastDevices() {
    return deviceState.getAllDevices().map(device => device.clientObject)
}

function getDiscoveredCastDevice(deviceId) {
    return getDiscoveredCastDevices().find(device => device.getName() === deviceId);
}

function stopDiscoveringDevices() {
    if (!mdnsQueryIntervalHandle) {
        return;
    }

    debug('Stopping device discovery');
    clearInterval(mdnsQueryIntervalHandle)
}

function startDiscoveringDevices() {
    if (mdnsQueryIntervalHandle) {
        return;
    }

    debug('Starting device discovery');
    queryCastDevices();
    setInterval(queryCastDevices, QUERY_CAST_DEVICES_INTERVAL);
}

function registerOnCastDeviceDiscovered(onDeviceDiscovered) {
    onDeviceDiscoveredCallbacks.push(onDeviceDiscovered);
}

export {
    startDiscoveringDevices,
    stopDiscoveringDevices,
    discoverCastDevices,
    getDiscoveredCastDevices,
    getDiscoveredCastDevice,
    registerOnCastDeviceDiscovered
};
