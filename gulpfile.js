var gulp = require('gulp');
var ejs = require('gulp-ejs');
var sass = require('gulp-sass');
var webpack = require('webpack');
var semver = require('semver');
var moment = require('moment');
var config = require('./config.json');
var fs = require('fs');

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
  var modules = {
    'carrot': { 'name': 'Project Carrot', 'footnote': 'Compatible with ' +
      '<span aria-label="P C A E">PCAE</span> 0.9.4&ndash;0.9.6 and ' +
      '<span aria-label="P C L C">PCLC</span> 0.5.9' },
    'pcae': { 'name': 'PC Anim Extractor', 'footnote': '' },
    'pclc': { 'name': 'PC Level Converter', 'footnote': '' },
    'pctc': { 'name': 'PC Tileset Converter', 'footnote': '' },
    'pc-crtlib': { 'name': 'Common runtime libraries', 'footnote': '' }
  };

  var fileData = {};
  for (var product in modules) {
    fileData[product] = {
      module: product,
      version: null,
      name: modules[product].name,
      footnote: modules[product].footnote,
      files: {
        x86: null,
        x64: null
      },
      released: null
    };
  }

  fs.readdirSync('./files').forEach((item) => {
    var parts = item.match(/^([a-z\-]+?)(?:-([0-9\.]+))?-(x86|x64)\.zip$/);
    if (parts) {
      if (!fileData[parts[1]]) {
        return;
      }
      
      if (parts[2] === undefined) {
        parts[2] = '0.0.0';
      }

      if (fileData[parts[1]].version == null || semver.gt(parts[2], fileData[parts[1]].version)) {
        fileData[parts[1]] = Object.assign(fileData[parts[1]], {
          version: parts[2],
          files: {
            x86: null,
            x64: null
          },
          released: null
        });
      }

      var stats = fs.statSync('./files/' + parts[0]);

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

  return gulp
    .src("./src/**/*.ejs")
    .pipe(ejs({
      buildDate: moment(),
      screenshots: [
        { name: 'screen1', title: 'Dungeon Dilemma' },
        { name: 'screen2', title: 'Tossed Salad' },
        { name: 'screen3', title: 'Hare Scare' },
        { name: 'screen4', title: 'Easter Bunny' },
        { name: 'screen5', title: 'Jungle Jump' },
        { name: 'screen6', title: 'Main Menu' }
      ],
      files: fileData,
      dateFormat: 'Do MMMM, YYYY',
      timeFormat: 'HH:mm:ss'
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

gulp.task('build', [ 'build-js', 'build-style', 'build-html', 'copy-fonts', 'copy-assets' ]);
