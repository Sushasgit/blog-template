const { src, dest, watch, series, parallel } = require('gulp');
const gulp = require("gulp");
const browsersync = require('browser-sync').create();
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const sasslint = require('gulp-sass-lint');
const cache = require('gulp-cached');
const notify = require('gulp-notify');
const beeper = require('beeper');
const eslint = require("gulp-eslint");

function buildStyles() {
  return src('scss/styles.scss')
    .pipe(plumbError())
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7']))
    .pipe(sourcemaps.write())
    .pipe(dest('css/'))
    .pipe(browsersync.reload({ stream: true }));
}

function watchFiles() {
  watch(
    ['scss/*.scss', 'scss/**/*.scss'],
    { events: 'all', ignoreInitial: false },
    series(sassLint, buildStyles)
  );
  watch("./js/**/*", gulp.series(scriptsLint, scripts));
  watch("./images/**/*", images);
}

function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

function sassLint() {
  return src(['scss/*.scss', 'scss/**/*.scss'])
    .pipe(cache('sasslint'))
    .pipe(sasslint({
      configFile: '.sass-lint.yml'
    }))
    .pipe(sasslint.format())
    .pipe(sasslint.failOnError());
}

function scripts() {
  return (
    gulp
      .src(["js/**/*"])
      .pipe(plumber())
      .pipe(browsersync.stream())
  );
}

function scriptsLint() {
  return gulp
    .src(["js/**/*", "./gulpfile.js"])
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

function images() {
  return gulp
    .src("./assets/img/**/*")
    .pipe(newer("./_site/assets/img"))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest("./_site/assets/img"));
}

function plumbError() {
  return plumber({
    errorHandler: function(err) {
      notify.onError({
        templateOptions: {
          date: new Date()
        },
        title: "Gulp error in " + err.plugin,
        message:  err.formatted
      })(err);
      beeper();
      this.emit('end');
    }
  })
}

exports.default = parallel(browserSync, watchFiles);
exports.sass = buildStyles; 
exports.watch = watchFiles;
exports.build = series(buildStyles);
