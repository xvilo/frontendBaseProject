var gulp = require('gulp');
var sass = require('gulp-sass');
var connect = require('gulp-connect');
var notify = require("gulp-notify");
var path = require('path');
var autoprefixer = require('autoprefixer');
var bulkSass = require('gulp-sass-bulk-import');
var calc = require('postcss-calc');
var importOnce = require('node-sass-import-once');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var postcss = require('gulp-postcss');
var mqDedupe = require('postcss-mq-dedupe');
var webpack = require('webpack-stream');
var closureCompiler = require('google-closure-compiler').gulp();
var liveReload = require('gulp-livereload');

var slice = [].slice;

var paths = {};
paths.root = (path.resolve(__dirname)) + "/";
paths.docroot = paths.root + "public/";
paths.src = paths.root + "src/";
paths.sass = paths.src + "sass/";
paths.modules = paths.src + "js/";
paths.vendor = paths.src + "vendor/";
paths.css = paths.docroot + "media/css/";
paths.js = paths.docroot + "media/js/";
paths.dist = paths.docroot + "dist/";

// Sass stuff
var precision = 10;
gulp.task('sass', function() {
  return gulp.src([paths.sass + "**/*.scss", paths.vendor + "**/*.scss"]).pipe(sourcemaps.init()).pipe(bulkSass()).pipe(sass({
    file: true,
    includePaths: [paths.spritesSrc, paths.vendor],
    precision: precision,
    importer: importOnce,
    importOnce: {
      css: true
    }
  })).on('error', logger.error).pipe(postcss([
    calc({
      precision: precision
    }), mqDedupe(), autoprefixer({
      browsers: ['last 2 versions', 'Firefox ESR', 'Opera 12.1', 'Explorer >= 9', 'Firefox >= 28']
    })
  ])).pipe(sourcemaps.write()).pipe(gulp.dest(paths.css)).pipe(notify({
    title: '✅  SASS',
    message: function(file) {
      console.log(sourcemaps.write().pipe);
      return "OK: " + (logger.format(file.path));
    }
  }));
});

var closurePath = './node_modules/google-closure-library/closure/goog/';
console.log('hi', closurePath + '*.js')
gulp.task('javascripts', function() {
  return gulp.src([
            'node_modules/google-closure-library/closure/goog/*.js',
            //paths.modules + 'app.js',
            '!node_modules/google-closure-library/closure/goog/*test.js'], {base: './'})
      // your other steps here
      .pipe(closureCompiler({
          compilation_level: 'SIMPLE',
          warning_level: 'VERBOSE',
          language_in: 'ECMASCRIPT6_STRICT',
          language_out: 'ECMASCRIPT5_STRICT',
          //output_wrapper: '(function(){\n%output%\n}).call(this)',
          js_output_file: 'app.min.js'
        }).on('error', logger.error))
      .pipe(gulp.dest(paths.js));
});

gulp.task('livereload', function (){
  gulp.src('./public/**/*')
  .pipe(liveReload());
});

gulp.task('watch', function () {
  liveReload.listen();
  gulp.watch('./src/sass/**/*.scss', ['sass']);
  gulp.watch('./src/javascripts/**/*.js' ['javascripts']);
  gulp.watch('./public/media/**/*', ['livereload']);
  liveReload()
});

gulp.task('default', ['watch', 'sass', 'javascripts']);

var logger = {
  log: function() {
    var parts;
    parts = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return gutil.log.call(null, logger.format.apply(null, parts));
  },
  format: function() {
    var parts;
    parts = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return parts.join(' ').trim().replace(paths.root, '', 'g');
  },
  error: function(error) {
    return notify.onError({
      title: "❌  " + error.plugin,
      message: logger.format(error.message)
    }).call(this, error);
  }
};
