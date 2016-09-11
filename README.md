Project Carrot website
======================

This is the source code for the website for [Project Carrot](https://github.com/soulweaver91/project-carrot),
available at [https://carrot.soulweaver.fi/](https://carrot.soulweaver.fi/).

Building
--------

A modern version of [Node.js](https://nodejs.org/) and an installation of
[GraphicsMagick](http://www.graphicsmagick.org/) available on `PATH` is required.

```shell
npm install -g gulp-cli
npm install
cp config.example.json config.json
# Edit the config
# Copy the downloadables to a folder called files
# and screenshots to a folder called screenshots
gulp build
```

The output will be in the `dist` folder. Deployment command will be implemented later.

License
-------

[MIT License](https://opensource.org/licenses/MIT), though I dunno why you would want to host this site elsewhere.
