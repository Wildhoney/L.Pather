(function main() {

    var gulp    = require('gulp'),
        concat  = require('gulp-concat'),
        rename  = require('gulp-rename'),
        flatten = require('gulp-flatten'),
        jshint  = require('gulp-jshint'),
        karma   = require('gulp-karma'),
        uglify  = require('gulp-uglify');

    var files   = ['module/Pather.js', 'module/components/*.js'];

    gulp.task('compile', function() {
        return gulp.src(files)
            .pipe(concat('all.js'))
            .pipe(flatten())
            .pipe(rename('pather-src.js'))
            .pipe(gulp.dest('dist'))
            .pipe(rename('pather.js'))
            .pipe(gulp.dest('example/vendor/pather'))
            .pipe(uglify())
            .pipe(rename('pather.js'))
            .pipe(gulp.dest('dist'));
    });

    gulp.task('lint', function() {
        return gulp.src(files)
            .pipe(jshint())
            .pipe(jshint.reporter('jshint-stylish'));
    });

    gulp.task('karma', function() {

        var vendorFiles = [
            'example/vendor/d3/d3.js',
            'example/vendor/leaflet/dist/leaflet-src.js'
        ];

        return gulp.src([].concat('tests/Pather.test.js', [].concat(vendorFiles, files)))
            .pipe(karma({
                configFile: 'karma.conf.js',
                action: 'run'
            }))
            .on('error', function error(err) {
                throw err;
            });

    });

    gulp.task('test', ['lint', 'karma']);
    gulp.task('build', ['compile']);
    gulp.task('default', ['test', 'build']);
    gulp.task('watch', function watch() {
        gulp.watch(files, ['build']);
    });

})();