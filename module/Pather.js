(function main($window) {

    "use strict";

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

        }

    });

    /**
     * @method throwException
     * @throws {Error}
     * @return {void}
     */
    function throwException(message) {
        throw 'L.Pather: ' + message + '.';
    }

    // Simple factory that Leaflet loves to bundle.
    L.pather = function pather(options) {
        return new L.Pather(options);
    };

})(window);