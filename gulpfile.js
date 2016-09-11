var gulp = require('gulp');
var ejs = require('gulp-ejs');
var sass = require('gulp-sass');
var imagemin = require('gulp-imagemin');
var resizer = require('gulp-image-resize');
var webpack = require('webpack');
var semver = require('semver');
var moment = require('moment');
var config = require('./config.json');
var fs = require('fs');
var zip = require('gulp-zip');
var argv = require('yargs').argv;
var git = require('git-rev-sync');
var ftp = require('vinyl-ftp');

gulp.task('build-js', (cb) => {
  return webpack({
    context: __dirname + '/src',
    entry: './script.js',
    publicPath: '/',
    output: {
      path: __dirname + '/dist',
      filename: 'js/carrot.js'
    },
    plugins: [
      new webpack.DefinePlugin({
        env: config.webpackEnv || {}
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: { warnings: false }
      })
    ]
  }, cb);
});

gulp.task('build-style', () => {
  return gulp
    .src('./src/style/*.scss')
    .pipe(sass({
      includePaths: 'node_modules/bootstrap-sass/assets/stylesheets',
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(gulp.dest('dist/style'));
});

gulp.task('build-html', () => {
  var filesRoot = './dist/files/';
  var fileData = {};
  for (var product in config.modules) {
    fileData[product] = {
      module: product,
      version: null,
      name: config.modules[product].name,
      footnote: config.modules[product].footnote,
      files: {
        x86: null,
        x64: null
      },
      released: null
    };
  }

  try {
    fs.readdirSync(filesRoot).forEach((item) => {
      var parts = item.match(/^([a-z\-]+?)(?:-([0-9\.]+))?-(x86|x64)\.zip$/);
      if (parts) {
        if (!fileData[parts[1]]) {
          return;
        }

        if (parts[2] === undefined) {
          parts[2] = '0.0.0';
        }

        if (fileData[parts[1]].version == null || semver.gt(parts[2], fileData[parts[1]].version)) {
          fileData[parts[1]] = Object.assign(fileData[parts[1]], {
            version: parts[2],
            files: {
              x86: null,
              x64: null
            },
            released: null
          });
        }

        var stats = fs.statSync(filesRoot + parts[0]);

        fileData[parts[1]].released = (fileData[parts[1]].released == null
          ? moment(stats.mtime)
          : moment.min(fileData[parts[1]].released, moment(stats.mtime))
        );

        fileData[parts[1]].files[parts[3]] = {
          fullFilename: parts[0],
          module: parts[1],
          version: parts[2],
          architecture: parts[3],
          platform: 'windows',
          stats: stats
        };
      }
    });
  } catch (e) {
    // Files not available (gulp archive not run?), just don't render the files as available.
  }

  var gitData = {};
  try {
    gitData = {
      isGit: true,
      short: git.short(),
      full: git.long(),
      branch: git.branch(),
      linkBase: config.commitUrlBase
    };
  } catch (e) {
    gitData = {
      isGit: false,
      short: null,
      full: null,
      branch: null
    };
  }

  return gulp
    .src([ "!./src/includes/*.ejs", "./src/**/*.ejs" ])
    .pipe(ejs({
      buildDate: moment(),
      screenshots: config.screenshots,
      files: fileData,
      dateFormat: 'Do MMMM, YYYY',
      timeFormat: 'HH:mm:ss',
      git: gitData
    }, {
      ext: '.html'
    }))
    .pipe(gulp.dest("./dist"));
});

gulp.task('copy-fonts', () => {
  return gulp
    .src([
      './node_modules/bootstrap-sass/assets/fonts/bootstrap/*',
      './node_modules/font-awesome/fonts/*',
      './node_modules/roboto-fontface/fonts/Roboto/Roboto-+(Light|Regular|Medium|Bold).*',
      './node_modules/roboto-fontface/fonts/Roboto/Roboto-+(Light|Regular|Medium|Bold)Italic.*'
    ])
    .pipe(gulp.dest('./dist/fonts'));
});

gulp.task('copy-assets', () => {
  return gulp
    .src([
      './src/img/*'
    ])
    .pipe(gulp.dest('./dist/assets'));
});

gulp.task('optimize-ss', () => {
  return gulp
    .src('./screenshots/*.png')
    .pipe(imagemin())
    .pipe(gulp.dest('dist/assets'))
});

gulp.task('gen-ss-thumbs', () => {
  return gulp
    .src('./screenshots/*.png')
    .pipe(resizer({
      width: 200,
      format: 'jpg',
      filter: 'Catrom',
      quality: 0.8
    }))
    .pipe(gulp.dest('dist/assets'))
});

gulp.task('archive', () => {
  var promises = [];

  let archives = {};
  if (argv.module) {
    if (config.archives[argv.module]) {
      archives[argv.module] = config.archives[argv.module];
    }
  } else {
    archives = config.archives;
  }

  for (let moduleName in archives) {
    let module = archives[moduleName];
    let version = (!module.version ? '' : '-' + module.version);

    module.platforms.forEach((platform) => {
      promises.push(new Promise((resolve, reject) => {
        var outputFilename = `${moduleName}${version}-${platform.architecture}.zip`;

        gulp
          .src(platform.files.concat(module.commonFiles))
          .pipe(zip(outputFilename))
          .pipe(gulp.dest('dist/files'))
          .on('end', resolve)
          .on('error', reject)
      }));
    });
  }

  return Promise.all(promises);
});

gulp.task('deploy', () => {
  var connection = ftp.create(Object.assign({
    parallel: 10
  }, config.deploy.connection));

  return gulp
    .src([ 'dist/**/*' ], {
      base: 'dist',
      buffer: false
    })
    .pipe(connection.dest(config.deploy.directory));
});

gulp.task('build', [ 'build-js', 'build-style', 'build-html', 'copy-fonts', 'copy-assets', 'optimize-ss', 'gen-ss-thumbs' ]);

gulp.task('release', [ 'build', 'deploy' ]);
