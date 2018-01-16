import rawDebug from 'debug';
import neeoapi from 'neeo-sdk';
import { googlecastDevice } from './device';
import { startDiscoveringDevices } from './discoverer';

const debug = rawDebug('googlecast:index');

const {
    PORT = 6336
} = process.env;

startDiscoveringDevices();

debug('Discovering a brain');
neeoapi.discoverOneBrain()
    .then((brain) => {
        debug('Brain discovered: ', brain.name);

        return neeoapi.startServer({
            brain,
            port: PORT,
            name: 'googlecast',
            devices: [googlecastDevice]
        });
    })
    .then(() => {
        debug('Server running on port', PORT, ' use the NEEO app to search for', googlecastDevice.devicename);
    })
    .catch((err) => {
        console.error(err); // eslint-disable-line no-console
        process.exit(1);
    });
