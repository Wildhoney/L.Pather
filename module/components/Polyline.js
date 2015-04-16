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
         * @method select
         * @return {void}
         */
        select: function select() {

        },

        /**
         * @method deselect
         * @return {void}
         */
        deselect: function deselect() {

        },

        /**
         * @method attachElbows
         * @return {void}
         */
        attachElbows: function attachElbows() {

        },

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