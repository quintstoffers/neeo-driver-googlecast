import rawDebug from 'debug';
import {discoverCastDevices, getDiscoveredCastDevice, registerOnCastDeviceDiscovered} from './discoverer';

const debug = rawDebug('googlecast:controller');

// Map NEEO buttons to methods on CastDevice.
const BUTTON_FUNCTION_MAP = {
    PAUSE: 'pause',
    PLAY: 'play',
    STOP: 'stop',
    PREVIOUS: 'previous',
    NEXT: 'next',
    'POWER OFF': 'stop',
    'SKIP SECONDS FORWARD': 'skipForward',
    'SKIP SECONDS BACKWARD': 'skipBackward',
    'CURSOR ENTER': 'togglePlayPause'
};

// TODO: remove eslint ignore once callbacks are registered on devices.
// eslint-disable-next-line no-unused-vars
let neeoCallbacks;

function castDeviceToNeeoDevice(castDevice) {
    return {
        id: castDevice.getId(),
        name: castDevice.getName(),
        reachable: true,
    };
}

// TODO: remove eslint ignore once callbacks are registered on devices.
// eslint-disable-next-line no-unused-vars
function setCallbacksOnCastDevice(castDevice) {
    // TODO: register NEEO callbacks on this device for status updates.
}

registerOnCastDeviceDiscovered(setCallbacksOnCastDevice);

export function discoverDevices() {
    return discoverCastDevices().then(function (castDevices) {
        return castDevices.map(castDeviceToNeeoDevice);
    });
}

export function handleButtonPress(buttonId, deviceId) {
    debug('pressed button', buttonId, 'for device', deviceId);

    const device = getDiscoveredCastDevice(deviceId);

    if (!device) {
        debug(` - device ${deviceId} has not (yet?) been discovered`);
        return;
    }

    const buttonFunctionName = BUTTON_FUNCTION_MAP[buttonId];

    if (device[buttonFunctionName]) {
        device[buttonFunctionName]();
    } else {
        debug(` - button ${buttonId} is not yet implemented`);
    }
}

export function registerSubscriptionFunction(genericCallback, {
    powerOnNotificationFunction: powerOnCallback,
    powerOffNotificationFunction: powerOffCallback
}) {
    neeoCallbacks = {
        genericCallback,
        powerOnCallback,
        powerOffCallback
    };

    // TODO: register NEEO callbacks on all discovered devices for status updates.
}

export function getPowerState(deviceId) {
    const device = getDiscoveredCastDevice(deviceId);
    return device.getState;
}

export function getMediaImageUrl(deviceId) {
    const device = getDiscoveredCastDevice(deviceId);
    return device.getMediaImageUrl();
}

export function getMediaTitle(deviceId) {
    const device = getDiscoveredCastDevice(deviceId);
    return device.getMediaTitle();
}

export function getMediaArtist(deviceId) {
    const device = getDiscoveredCastDevice(deviceId);
    return device.getMediaArtist();
}

export function getMediaAlbumTitle(deviceId) {
    const device = getDiscoveredCastDevice(deviceId);
    return device.getMediaAlbumTitle();
}

export function getMediaAlbumArtist(deviceId) {
    const device = getDiscoveredCastDevice(deviceId);
    return device.getMediaAlbumArtist();
}
