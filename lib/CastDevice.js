import rawDebug from 'debug';
import { clearInterval, setInterval } from 'timers';
import { Client } from 'castv2';
import { CastChannel } from './CastChannel';

const HEARTBEAT_INTERVAL = 5000;

export class CastDevice {
    constructor({
        id,
        host,
        name = 'Unknown device',
    }) {
        this.id = id;
        this.name = name;
        this.host = host;

        this.debug = rawDebug(`googlecast:device:${this.getName().toLowerCase().replace(' ', '')}`);

        this.client = new Client();
        this.connectionChannel = null;
        this.heartbeatChannel = null;
        this.receiverChannel = null;
        this.mediaChannel = null;
        this.mediaConnectionChannel = null;

        this.mediaStatus = null;
        this.mediaStatusDate = null;
        this.mediaDetails = null;
        this.mediaDetailsDate = null;
    }

    createChannel(namespace, {
        transportId = 'receiver-0',
        senderId = 'sender-0'
    } = {}) {
        return new CastChannel(this.client, senderId, transportId, namespace);
    }

    setupBasicChannels() {
        this.closeBasicChannels();

        this.connectionChannel = this.createChannel('urn:x-cast:com.google.cast.tp.connection');
        this.heartbeatChannel = this.createChannel('urn:x-cast:com.google.cast.tp.heartbeat');
        this.receiverChannel = this.createChannel('urn:x-cast:com.google.cast.receiver');

        this.connectionChannel.send({
            type: 'CONNECT'
        });

        this.connectionChannel
            .getChannel()
            .on('message', (message) => {
                this.debug.log('Connection channel:', message);

                if (message.type === 'CLOSE') {
                    this.disconnect();
                }
            });
    }

    closeBasicChannels() {
        if (this.connectionChannel) {
            this.connectionChannel.close();
            this.connectionChannel = null;
        }

        if (this.heartbeatChannel) {
            this.heartbeatChannel.close();
            this.heartbeatChannel = null;
        }

        if (this.receiverChannel) {
            this.receiverChannel.close();
            this.receiverChannel = null;
            this.currentTransportId = null;
        }
    }

    setupMediaChannels(transportId) {
        if (this.mediaConnectionChannel) {
            this.mediaConnectionChannel.close();
        }

        if (this.mediaChannel) {
            this.mediaChannel.close();
        }

        const channelOptions = {
            transportId
        };
        this.mediaConnectionChannel = this.createChannel('urn:x-cast:com.google.cast.tp.connection', channelOptions);
        this.mediaChannel = this.createChannel('urn:x-cast:com.google.cast.media', channelOptions);

        this.mediaConnectionChannel.send({
            type: 'CONNECT'
        });

        this.mediaConnectionChannel
            .getChannel()
            .on('message', (message) => {
                this.debug('Media connection channel:', message);

                if (message.type === 'CLOSE') {
                    this.closeMediaChannels();
                }
            });
    }

    closeMediaChannels() {
        this.mediaStatus = null;
        this.mediaDetails = null;

        if (this.mediaConnectionChannel) {
            this.mediaConnectionChannel.close();
            this.mediaConnectionChannel = null;
        }

        if (this.mediaChannel) {
            this.mediaChannel.close();
            this.mediaChannel = null;
        }
    }

    startHeartbeat() {
        this.heartbeatIntervalId = setInterval(() => this.heartbeat(), HEARTBEAT_INTERVAL);
    }

    stopHeartbeat() {
        clearInterval(this.heartbeatIntervalId);
    }

    startWatchReceiverStatus() {
        this.receiverChannel
            .getChannel()
            .on('message', (message) => {
                this.debug("Receiver channel:", message);

                this.processReceiverStatus(message.status);
            });

        this.receiverChannel
            .send({
                type: 'GET_STATUS',
            });
    }

    processReceiverStatus(status) {
        if (!status || !status.applications || !status.applications.length) {
            return;
        }

        const currentRunningApplication = status.applications[0];

        if (this.currentTransportId === currentRunningApplication.transportId) {
            return;
        }

        this.currentTransportId = currentRunningApplication.transportId;

        this.setupMediaChannels(currentRunningApplication.transportId);
        this.startWatchMediaStatus();
    }

    startWatchMediaStatus() {
        this.mediaChannel
            .getChannel()
            .on('message', (message) => {
                this.debug("Media channel:", message);

                if (message.type !== 'MEDIA_STATUS') {
                    return;
                }

                this.processMediaStatus(message.status[0]);
            });

        this.mediaChannel
            .send({
                type: 'GET_STATUS',
            });
    }

    processMediaStatus(status) {
        if (!status) {
            this.mediaStatus = null;
            this.mediaDetails = null;
            return;
        }

        if (status.media) {
            this.mediaDetails = status.media;
            this.mediaDetailsDate = new Date();
        }

        this.mediaStatus = status;
        this.mediaStatusDate = new Date();
    }

    connect() {
        this.debug('Connecting to', this.host);

        this.client.connect(this.host, () => {
            this.debug('Connected');
            this.setupBasicChannels();
            this.startHeartbeat();
            this.startWatchReceiverStatus();
        });
    }

    disconnect() {
        this.debug('Disconnecting...');

        this.stopHeartbeat();
        this.closeMediaChannels();
        this.closeBasicChannels();
        this.client.close();

        this.debug('Disconnected');
    }

    /**
     * Get this device's name (e.g. Chromecast-aaabbbccc111222333).
     */
    getId() {
        return this.id;
    }

    /**
     * Get the device's name, such as "Living room".
     */
    getName() {
        return this.name;
    }

    getLastKnownMediaCurrentTime() {
        let lastKnownCurrentTime = null;

        if (this.mediaStatus) {
            lastKnownCurrentTime = this.mediaStatus.currentTime;
        }

        return lastKnownCurrentTime;
    }

    getEstimatedMediaCurrentTime() {
        const lastKnownCurrentTime = this.getLastKnownMediaCurrentTime();

        if (lastKnownCurrentTime === null) {
            return null;
        }

        const nowMillis = Date.now();
        const lastStatusUpdateMillis = this.mediaStatusDate.getTime();
        const secondsSinceUpdate = (nowMillis - lastStatusUpdateMillis) / 1000;

        return lastKnownCurrentTime + secondsSinceUpdate;
    }

    getMediaPlayerState() {
        if (!this.mediaStatus) {
            return 'UNKNOWN';
        }

        return this.mediaStatus.playerState;
    }

    getMediaMetadata() {
        if (!this.mediaDetails || !this.mediaDetails.metadata) {
            return null;
        }

        return this.mediaDetails.metadata;
    }

    getMediaMetadataProperty(prop, { fallback } = {}) {
        const metadata = this.getMediaMetadata();

        if (!metadata) {
            return fallback;
        }

        return metadata[prop] || fallback;
    }

    getMediaTitle({
        fallback = "Unknown title"
    } = {}) {
        return this.getMediaMetadataProperty('title', { fallback });
    }

    getMediaArtist({
        fallback = "Unknown artist"
    } = {}) {
        return this.getMediaMetadataProperty('artist', { fallback });
    }

    getMediaAlbumTitle({
        fallback = "Unknown album"
    } = {}) {
        return this.getMediaMetadataProperty('albumName', { fallback });
    }

    getMediaAlbumArtist({
        fallback = "Unknown album artist"
    } = {}) {
        return this.getMediaMetadataProperty('albumArtist', { fallback });
    }

    getMediaImageUrl({ fallback } = {}) {
        const metadata = this.getMediaMetadata();

        if (!metadata || !metadata.images || !metadata.images.length) {
            return fallback;
        }

        const image = this.mediaDetails.metadata.images[0];

        return image.url || fallback;
    }

    heartbeat() {
        this.heartbeatChannel.send({
            type: 'PING'
        });
    }

    stop() {
        this.receiverChannel.send({
            type: 'STOP'
        });
    }

    play() {
        this.mediaChannel.send({
            type: 'PLAY',
            mediaSessionId: this.mediaStatus.mediaSessionId
        });
    }

    pause() {
        this.mediaChannel.send({
            type: 'PAUSE',
            mediaSessionId: this.mediaStatus.mediaSessionId
        });
    }

    togglePlayPause() {
        const playerState = this.getMediaPlayerState();

        switch (playerState) {
            case 'PLAYING':
                this.pause();
                break;
            case 'PAUSED':
                this.play();
                break;
        }
    }

    seek(position) {
        this.mediaChannel.send({
            type: 'SEEK',
            currentTime: position,
            resumeState: "PLAYBACK_START",
            mediaSessionId: this.mediaStatus.mediaSessionId
        });
    }

    skipForward(skipSeconds = 30) {
        const currentTime = this.getEstimatedMediaCurrentTime();
        const targetTime = currentTime + skipSeconds;

        this.seek(targetTime);
    }

    skipBackward(skipSeconds = 30) {
        const currentTime = this.getEstimatedMediaCurrentTime();
        const targetTime = currentTime - skipSeconds;

        this.seek(targetTime);
    }

    previous() {
        this.seek(0);
    }

    next() {
        this.seek(Number.MAX_SAFE_INTEGER);
    }
}
