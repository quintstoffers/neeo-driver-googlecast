import neeoapi from 'neeo-sdk';
import {
    handleButtonPress,
    discoverDevices,
    getMediaTitle,
    getMediaArtist,
    getMediaAlbumTitle,
    getMediaAlbumArtist,
    getMediaImageUrl,
    getPowerState,
    registerSubscriptionFunction
} from './controller';

const discoveryInstructions = {
    headerText: 'Discover Google Cast devices',
    description: 'Make sure your devices are powered on.'
};

const googlecastDevice = neeoapi
    .buildDevice('Google Cast (media controls)')
    .setManufacturer('Google')
    .setType('MEDIAPLAYER')
    .enableDiscovery(discoveryInstructions, discoverDevices)
    .registerSubscriptionFunction(registerSubscriptionFunction)
    .addButtonGroup('Power')
    .addButtonGroup('Transport')
    .addButtonGroup('Transport Scan')
    .addButtonGroup('Transport Skip')
    .addButton({ name: 'CURSOR ENTER', label: 'Pause/Play' })
    .addButtonHandler(handleButtonPress)

    .addPowerStateSensor({ getter: getPowerState })

    .addTextLabel({ name: 'mediaTitle', label: 'Title' }, getMediaTitle)
    .addTextLabel({ name: 'mediaArtist', label: 'Artist' }, getMediaArtist)
    .addTextLabel({ name: 'mediaAlbumTitle', label: 'Album title' }, getMediaAlbumTitle)
    .addTextLabel({ name: 'mediaAlbumArtist', label: 'Album artist' }, getMediaAlbumArtist)
    .addImageUrl({ name: 'mediaImage', label: 'Image', size: 'large' }, getMediaImageUrl);

export {
    googlecastDevice
};
