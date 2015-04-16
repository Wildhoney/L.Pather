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
            this.options  = options || this.defaultOptions();
            this.creating = false;
        },

        /**
         * @method createPath
         * @param {L.LatLng[]} latLngs
         * @return {L.Pather.Polyline}
         */
        createPath: function createPath(latLngs) {

            return new L.Pather.Polyline({
                latLngs: latLngs,
                tolerance: this.options.tolerance
            });

        },

        /**
         * @method removePath
         * @param {L.Pather.Polyline} model
         * @return {Boolean}
         */
        removePath: function removePath(model) {

            if (model instanceof L.Pather.Polyline) {
                return model.remove();
            }

            return false;

        },

        /**
         * @method onAdd
         * @param {L.Map} map
         * @return {void}
         */
        onAdd: function onAdd(map) {

            map.dragging.disable();

            var element    = this.options.element || map._container;
            this.fromPoint = { x: 0, y: 0 };
            this.svg       = d3.select(element)
                               .append('svg')
                                   .attr('pointer-events', 'none')
                                   .attr('class', this.getOption('moduleClass'))
                                   .attr('width', this.getOption('width'))
                                   .attr('height', this.getOption('height'));

            // Attach the mouse events for drawing the polyline.
            this.attachEvents(map);

        },

        /**
         * @method attachEvents
         * @param {L.Map} map
         * @return {void}
         */
        attachEvents: function attachEvents(map) {

            map.on('mousedown', function mousedown(event) {
                this.creating  = true;
                this.fromPoint = map.latLngToContainerPoint(event.latlng);
            }.bind(this));

            map.on('mouseup', function mouseup() {
                this.creating = false;
            }.bind(this));

            map.on('mousemove', function mousemove(event) {

                var lineFunction = d3.svg.line()
                                     .x(function x(d) { return d.x; })
                                     .y(function y(d) { return d.y; })
                                     .interpolate('linear');

                if (this.creating) {

                    var point    = map.mouseEventToContainerPoint(event.originalEvent),
                        lineData = [this.fromPoint, new L.Point(point.x, point.y, false)];

                    this.svg.append('path')
                            .classed(this.getOption('lineClass'), true)
                                .attr('d', lineFunction(lineData))
                                .attr('stroke', this.getOption('strokeColour'))
                                .attr('stroke-width', this.getOption('strokeWidth'))
                                .attr('fill', 'none');

                    this.fromPoint = { x: point.x, y: point.y };

                }

            }.bind(this));

        },

        /**
         * @method clearAll
         * @return {void}
         */
        clearAll: function clearAll() {
            d3.select('svg').text('');
        },

        /**
         * @method getOption
         * @param {String} property
         * @return {String|Number}
         */
        getOption: function getOption(property) {
            return this.options[property] || this.defaultOptions()[property];
        },

        /**
         * @method defaultOptions
         * @return {Object}
         */
        defaultOptions: function defaultOptions() {

            return {
                moduleClass: 'pather',
                strokeColour: '#D7217E',
                strokeWidth: 2,
                lineClass: 'drawing-line',
                width: '100%',
                height: '100%'
            };

        }

    });

    /**
     * @constant L.Pather.MODE
     * @type {Object}
     */
    L.Pather.MODE = {
        VIEW:        1,
        CREATE:      2,
        EDIT:        4,
        DELETE:      8,
        APPEND:      16,
        EDIT_APPEND: 4 | 16,
        ALL:         1 | 2 | 4 | 8 | 16
    };

    // Simple factory that Leaflet loves to bundle.
    L.pather = function pather(options) {
        return new L.Pather(options);
    };

})();