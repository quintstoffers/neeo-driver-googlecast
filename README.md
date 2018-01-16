NEEO driver for Google Cast media controls
=====================

[![Greenkeeper badge](https://badges.greenkeeper.io/quintstoffers/neeo-driver-googlecast.svg)](https://greenkeeper.io/)

This is a driver to enable NEEO to control media playing on Google Cast devices. It does not intend to initiate casting media to cast devices such as Chromecast and Chromecast Audio.

## Running this driver

This package does not yet expose a CLI of some sort, so for now it is recommended to simply run the "start" script.
```
npm start
```

When running multiple drivers you'll likely want to specify the server port by specifying the `PORT` environment variable.
```
PORT=6336 npm start
```

Logging can be enabled through the `DEBUG` environment variable.
```$xslt
DEBUG=googlecast:* npm start
```

## Known issues

None as of now. Please create issues for any bugs you encounter.
