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
var closureCompiler = require('gulp-closure-compiler');
var liveReload = require('gulp-livereload');
var concat = require('gulp-concat');
var chokidar = require('chokidar');
var runSequence = require('run-sequence');

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
paths.closure = "node_modules/google-closure-library/closure/goog";

// Sass stuff
var precision = 10;
gulp.task('sass', function() {
  return gulp.src([paths.sass + "**/*.scss"]).pipe(sourcemaps.init()).pipe(bulkSass()).pipe(sass({
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
      return "OK: " + (logger.format(file.path));
    }
  }));
});

gulp.task('javascripts', function() {
  return gulp.src([
            paths.modules + 'app.js',
            paths.closure + '/**/*.js',
            '!' + paths.closure + '/**/*_test.js',
            '!' + paths.closure + '/**/*_perf.js',
            '!' + paths.closure + '/**/*tester.js',
            '!' + paths.closure + '/**/*_perf.js',
            '!' + paths.closure + '/testing/**/*.js',
            '!' + paths.closure + '/**/promise/testsuiteadapter.js',
            '!' + paths.closure + '/**/relativecommontests.js',
            '!' + paths.closure + '/**/osapi/osapi.js',
            '!' + paths.closure + '/**/svgpan/svgpan.js',
            '!' + paths.closure + '/**/alltests.js',
            '!' + paths.closure + '/**/node_modules**.js',
            '!' + paths.closure + '/**/protractor_spec.js',
            '!' + paths.closure + '/**/protractor.conf.js',
            '!' + paths.closure + '/**/browser_capabilities.js',
            '!' + paths.closure + '/**/generate_closure_unit_tests.js',
            '!' + paths.closure + '/**/doc/*.js',
            ], {base: './'})
      // your other steps here
      .pipe(closureCompiler({
          compilation_level: 'ADVANCED',
          warning_level: 'VERBOSE',
          language_in: 'ECMASCRIPT6_STRICT',
          language_out: 'ECMASCRIPT5_STRICT',
          //output_wrapper: '(function(){\n%output%\n}).call(this)',
          js_output_file: 'app.min.js'
        }).on('error', logger.error))
      .pipe(gulp.dest(paths.js));
});

gulp.task('watch', function () {
  var watch;
  global.isWatching = true;
  watch = function(pattern, callback) {
    return chokidar.watch(pattern, {
      ignoreInitial: true
    }).on('all', function(event, path) {
      logger.log(event, gutil.colors.magenta(path));
      return callback(event, path);
    });
  };
  liveReload.listen({
    basePath: paths.docroot,
    quiet: true
  });
  watch(paths.docroot, function(event, path) {
    return liveReload.changed(path);
  });
  watch("./src/sass/**/*.scss", function() {
    return runSequence('sass');
  });
  watch('./src/js/**/*.js', function() {
    return runSequence('javascripts');
  });
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

gulp.task('build', function () {
    // Specify where your Closure Library is stored --------------------------vvvv
    gulp.src(['node_modules/closure-library/closure/goog/**/*.js', './src/js/app.js'])
        .pipe(concat('app.js'))
        // Everything else is the same as in the docs
        .pipe(closureCompiler({
            compilerPath: '/Users/xvilo/projects/gulpWebPackTest/node_modules/google-closure-compiler/compiler.jar',
            fileName: paths.js + 'build.js',
            compilerFlags: {
                closure_entry_point: 'goog.base',
                compilation_level: 'ADVANCED_OPTIMIZATIONS',
                define: [
                    "goog.DEBUG=false"
                ],
                only_closure_dependencies: true,
                warning_level: 'VERBOSE',
                create_source_map: 'app.comp.js.map'
            }
        }));
});
