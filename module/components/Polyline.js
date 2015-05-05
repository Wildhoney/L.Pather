(function main() {

    "use strict";

    /**
     * @constant DATA_ATTRIBUTE
     * @type {String|Symbol}
     */
    var DATA_ATTRIBUTE = typeof Symbol === 'undefined' ? '_pather' : Symbol.for('pather');

    /**
     * @module Pather
     * @submodule Polyline
     * @param {L.Map} map
     * @param {L.LatLng[]} latLngs
     * @param {Object} [options={}]
     * @param {Object} methods
     * @return {Polyline}
     * @constructor
     */
    L.Pather.Polyline = function Polyline(map, latLngs, options, methods) {

        this.options = {
            color:        options.pathColour,
            opacity:      options.pathOpacity,
            weight:       options.pathWidth,
            smoothFactor: options.smoothFactor || 1,
            elbowClass:   options.elbowClass
        };

        this.polyline     = new L.Polyline(latLngs, this.options).addTo(map);
        this.map          = map;
        this.methods      = methods;
        this.edges        = [];
        this.manipulating = false;

        this.attachPolylineEvents(this.polyline);
        this.select();

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
            this.attachElbows();
        },

        /**
         * @method deselect
         * @return {void}
         */
        deselect: function deselect() {
            this.manipulating = false;
        },

        /**
         * @method attachElbows
         * @return {void}
         */
        attachElbows: function attachElbows() {

            this.detachElbows();

            this.polyline._parts[0].forEach(function forEach(point) {

                var divIcon = new L.DivIcon({ className: this.options.elbowClass }),
                    latLng  = this.map.layerPointToLatLng(point),
                    edge    = new L.Marker(latLng, { icon: divIcon }).addTo(this.map);

                edge[DATA_ATTRIBUTE] = { point: point };
                this.attachElbowEvents(edge);
                this.edges.push(edge);

            }.bind(this));

        },

        /**
         * @method detachElbows
         * @return {void}
         */
        detachElbows: function detachElbows() {

            this.edges.forEach(function forEach(edge) {
                this.map.removeLayer(edge);
            }.bind(this));

            this.edges.length = 0;

        },

        /**
         * @method attachPolylineEvents
         * @param {L.Polyline} polyline
         * @return {void}
         */
        attachPolylineEvents: function attachPathEvent(polyline) {

            polyline.on('click', function click(event) {

                event.originalEvent.stopPropagation();
                event.originalEvent.preventDefault();

                if (this.methods.mode() & L.Pather.MODE.APPEND) {

                    // Appending takes precedence over deletion!
                    var latLng = this.map.mouseEventToLatLng(event.originalEvent);
                    this.insertElbow(latLng);

                } else if (this.methods.mode() & L.Pather.MODE.DELETE) {
                    this.methods.remove(this);
                }

            }.bind(this));

        },

        /**
         * @method attachElbowEvents
         * @param {L.Marker} marker
         * @return {void}
         */
        attachElbowEvents: function attachElbowEvents(marker) {

            marker.on('mousedown', function mousedown(event) {

                event = event.originalEvent || event;

                if (this.methods.mode() & L.Pather.MODE.EDIT) {

                    if (event.stopPropagation) {
                        event.stopPropagation();
                        event.preventDefault();
                    }

                    this.manipulating = marker;

                }

            }.bind(this));

            marker.on('mouseup', function mouseup(event) {

                event = event.originalEvent || event;

                if (event.stopPropagation) {
                    event.stopPropagation();
                    event.preventDefault();
                }

                this.manipulating = false;

            });

            // Attach the mobile events to delegate to the desktop equivalent events.
            marker._icon.addEventListener('touchstart', marker.fire.bind(marker, 'mousedown'));
            marker._icon.addEventListener('touchend', marker.fire.bind(marker, 'mouseup'));

        },

        /**
         * @method insertElbow
         * @param {L.LatLng} latLng
         * @return {void}
         */
        insertElbow: function insertElbow(latLng) {

            var newPoint      = this.map.latLngToLayerPoint(latLng),
                leastDistance = Infinity,
                insertAt      = -1,
                points        = this.polyline._parts[0];

            points.forEach(function forEach(currentPoint, index) {

                var nextPoint = points[index + 1] || points[0],
                    distance  = L.LineUtil.pointToSegmentDistance(newPoint, currentPoint, nextPoint);

                if (distance < leastDistance) {
                    leastDistance = distance;
                    insertAt      = index;
                }

            }.bind(this));

            points.splice(insertAt + 1, 0, newPoint);

            var parts = points.map(function map(point) {
                var latLng = this.map.layerPointToLatLng(point);
                return { _latlng: latLng };
            }.bind(this));

            this.redraw(parts);
            this.attachElbows();

        },

        /**
         * @method moveTo
         * @param {L.Point} point
         * @return {void}
         */
        moveTo: function moveTo(point) {

            var latLng = this.map.layerPointToLatLng(point);
            this.manipulating.setLatLng(latLng);
            this.redraw(this.edges);

        },

        /**
         * @method finished
         * @return {void}
         */
        finished: function finished() {

            this.methods.fire('edited', {
                polyline: this,
                latLngs: this.getLatLngs()
            });

        },

        /**
         * @method redraw
         * @param {Array} edges
         * @return {void}
         */
        redraw: function redraw(edges) {

            var latLngs = [],
                options = {};

            edges.forEach(function forEach(edge) {
                latLngs.push(edge._latlng);
            });

            Object.keys(this.options).forEach(function forEach(key) {
                options[key] = this.options[key];
            }.bind(this));

            options.smoothFactor = 0;

            this.softRemove(false);
            this.polyline = new L.Polyline(latLngs, options).addTo(this.map);
            this.attachPolylineEvents(this.polyline);

        },

        /**
         * @method softRemove
         * @param {Boolean} [edgesToo=true]
         * @return {void}
         */
        softRemove: function softRemove(edgesToo) {

            edgesToo = typeof edgesToo === 'undefined' ? true : edgesToo;

            this.map.removeLayer(this.polyline);

            if (edgesToo) {

                this.edges.forEach(function forEach(edge) {
                    this.map.removeLayer(edge);
                }.bind(this));

            }

        },

        /**
         * @method getLatLngs
         * @return {LatLng[]}
         */
        getLatLngs: function getLatLngs() {

            return this.polyline._parts[0].map(function map(part) {
                return this.map.layerPointToLatLng(part);
            }.bind(this));

        }
        
    };

})();