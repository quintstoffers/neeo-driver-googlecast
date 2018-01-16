export class CastChannel {
    constructor(castv2Client, senderId, transportId, namespace) {
        this.requestId = 0;
        this.channel = castv2Client.createChannel(senderId, transportId, namespace, 'JSON');
    }

    send(payload) {
        const payloadWithRequestId = Object.assign({}, payload, {
            requestId: this.requestId++
        });

        this.channel.send(payloadWithRequestId);
    }

    close() {
        this.channel.close();
    }

    getChannel() {
        return this.channel;
    }
}
