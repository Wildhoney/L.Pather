(function main() {

    "use strict";

    /**
     * @method throwException
     * @throws {Error}
     * @return {void}
     */
    function throwException(message) {
        throw 'L.Pather: ' + message + '.';
    }

    if (typeof L === 'undefined') {

        // Ensure Leaflet.js has been included before Pather.
        throwException('Leaflet.js is required: http://leafletjs.com/');

    }

    /**
     * @module Pather
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/L.Pather
     */
    L.Pather = L.FeatureGroup.extend({

        /**
         * @method initialize
         * @param {Object} [options={}]
         * @return {void}
         */
        initialize: function initialize(options) {
            this.options = options || {};
        },

        /**
         * @method onAdd
         * @param {L.Map} map
         * @return {void}
         */
        onAdd: function onAdd(map) {
            return void map;
        }

    });

    // Simple factory that Leaflet loves to bundle.
    L.pather = function pather(options) {
        return new L.Pather(options);
    };

})();
(function main() {

    "use strict";

    /**
     * @module Pather
     * @submodule Polyline
     * @param {Object} [options={}]
     * @return {Polyline}
     * @constructor
     */
    L.Pather.Polyline = function Polyline(options) {
        this.options = options || this.defaultOptions();
    };

    /**
     * @property prototype
     * @type {Object}
     */
    L.Pather.Polyline.prototype = {

        /**
         * @method defaultOptions
         * @return {Object}
         */
        defaultOptions: function defaultOptions() {
            return { tolerance: 1 };
        },

        /**
         * @method tolerance
         */
        tolerance: function tolerance(value) {

            if (typeof value !== 'undefined') {
                this.options.tolerance = parseInt(value);
                return;
            }

            return this.options.tolerance;

        }
        
    };

})();