var gulp = require('gulp');
var ejs = require('gulp-ejs');
var sass = require('gulp-sass');
var webpack = require('webpack');
var config = require('./config.json');

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
  return gulp
    .src("./src/**/*.ejs")
    .pipe(ejs({
      buildDate: new Date().toISOString(),
      screenshots: [
        { name: 'screen1', title: 'Dungeon Dilemma' },
        { name: 'screen2', title: 'Tossed Salad' },
        { name: 'screen3', title: 'Hare Scare' },
        { name: 'screen4', title: 'Easter Bunny' },
        { name: 'screen5', title: 'Jungle Jump' },
        { name: 'screen6', title: 'Main Menu' }
      ]
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
