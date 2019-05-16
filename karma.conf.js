module.exports = function(config) {
  config.set({
    basePath: "./",
    frameworks: ["jasmine"],
    files: ["tests/Pather.test.js"],
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ["Firefox"],
    singleRun: false
  });
};
