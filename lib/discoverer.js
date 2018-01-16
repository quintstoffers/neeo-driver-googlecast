import mdns from 'mdns';
import rawDebug from 'debug'
import { CastDevice } from './CastDevice';

const debug = rawDebug('googlecast:discoverer');

const DEFAULT_DISCOVER_TIME_MILLIS = 2000;

let discoveredDevices = [];
let onDeviceDiscoveredCallbacks = [];

// Fix to get this running on a Raspberry Pi.
const mdnsResolverSequence = [
    mdns.rst.DNSServiceResolve(),
    'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]}),
    mdns.rst.makeAddressesUnique()
];
const browser = mdns.createBrowser(mdns.tcp('googlecast'), {resolverSequence: mdnsResolverSequence});

browser.on('serviceUp', function (service) {
    debug('Service up', service.name);

    const castDevice = new CastDevice(service);
    castDevice.connect();

    discoveredDevices.push(castDevice);

    onDeviceDiscoveredCallbacks.forEach(onDeviceDiscovered => onDeviceDiscovered(castDevice))
});

browser.on('serviceDown', function (service) {
    debug('Service down', service.name);

    const downDeviceId = service.name;
    const existingDeviceIndex = discoveredDevices.findIndex(device => device.getName() === downDeviceId);

    if (existingDeviceIndex !== -1) {
        const existingDevice = discoveredDevices[existingDeviceIndex];
        existingDevice.disconnect();

        discoveredDevices.splice(existingDeviceIndex, 1);
    }
});

function setTimeoutPromise(millis) {
    return new Promise(function (resolve) {
        setTimeout(resolve, millis);
    });
}

function discoverCastDevices(discoveryTimeMillis = DEFAULT_DISCOVER_TIME_MILLIS) {
    return setTimeoutPromise(discoveryTimeMillis).then(() => discoveredDevices);
}

function getDiscoveredCastDevices() {
    return discoveredDevices.slice(0);
}

function getDiscoveredCastDevice(deviceId) {
    return discoveredDevices.find(device => device.getName() === deviceId);
}

function startDiscoveringDevices() {
    debug('Starting discovery');
    browser.start();
}

function stopDiscoveringDevices() {
    browser.stop();
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
