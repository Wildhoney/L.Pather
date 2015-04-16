(function main() {

    var gulp    = require('gulp'),
        concat  = require('gulp-concat'),
        rename  = require('gulp-rename'),
        flatten = require('gulp-flatten'),
        jshint  = require('gulp-jshint'),
        uglify  = require('gulp-uglify');

    var files   = ['module/Pather.js', 'module/components/*.js'];

    gulp.task('compile', function compile() {
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

    gulp.task('test', ['lint']);
    gulp.task('build', ['compile']);
    gulp.task('default', ['test', 'build']);
    gulp.task('watch', function watch() {
        gulp.watch(files, ['build']);
    });

})();