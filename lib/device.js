const neeoapi = require('neeo-sdk');
const {
    initialise,
    handleButtonPress,
    discoverDevices,
    getMediaTitle,
    getMediaArtist,
    getMediaAlbumTitle,
    getMediaAlbumArtist,
    getMediaImageUrl,
    getPowerState,
    registerSubscriptionFunction
} = require('./controller');

const discoveryInstructions = {
    headerText: 'Discover Google Cast devices',
    description: 'Make sure your devices are powered on.'
};

const googlecastDevice = neeoapi
    .buildDevice('Google Cast (media controls)')
    .setManufacturer('Google')
    .setType('MEDIAPLAYER')
    .enableDiscovery(discoveryInstructions, discoverDevices)
    .registerInitialiseFunction(initialise)
    .registerSubscriptionFunction(registerSubscriptionFunction)
    .addButtonGroup('Power')
    .addButtonGroup('Transport')
    .addButtonGroup('Transport Scan')
    .addButtonGroup('Transport Skip')
    .addButton({ name: 'CURSOR ENTER', label: 'Pause/Play' })
    .addButtonHandler(handleButtonPress)

    .addPowerStateSensor({ getter: getPowerState })

    .addTextLabel({ name: 'mediaTitle', label: 'Title', isLabelVisible: false }, getMediaTitle)
    .addTextLabel({ name: 'mediaArtist', label: 'Artist', isLabelVisible: false }, getMediaArtist)
    .addTextLabel({ name: 'mediaAlbumTitle', label: 'Album title', isLabelVisible: false }, getMediaAlbumTitle)
    .addTextLabel({ name: 'mediaAlbumArtist', label: 'Album artist', isLabelVisible: false }, getMediaAlbumArtist)
    .addImageUrl({ name: 'mediaImage', label: 'Image', size: 'large' }, getMediaImageUrl);

module.exports = {
    googlecastDevice
};
