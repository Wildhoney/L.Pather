(function main() {

    "use strict";

    /**
     * @constant DATA_ATTRIBUTE
     * @type {String}
     */
    var DATA_ATTRIBUTE = '_pather';

    /**
     * @module Pather
     * @submodule Polyline
     * @param {L.Map} map
     * @param {L.LatLng[]} latLngs
     * @param {Object} [options={}]
     * @param {Function} [fire=function() {}]
     * @return {Polyline}
     * @constructor
     */
    L.Pather.Polyline = function Polyline(map, latLngs, options, fire) {

        this.options = {
            color:        options.pathColour,
            opacity:      options.pathOpacity,
            weight:       options.pathWidth,
            smoothFactor: options.smoothFactor || 1,
            elbowClass:   options.elbowClass
        };

        this.polyline     = new L.Polyline(latLngs, this.options).addTo(map);
        this.map          = map;
        this.fire         = fire || function noop() {};
        this.edges        = [];
        this.manipulating = false;

        this.attachPolylineEvents(this.polyline);
        this.select();

        this.fire('created', {
            polyline: this,
            latLngs: this.getLatLngs()
        });

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

                //var latLng = this.map.mouseEventToLatLng(event.originalEvent);
                //this.insertElbow(latLng);

            }.bind(this));

        },

        /**
         * @method attachElbowEvents
         * @param {L.Marker} marker
         * @return {void}
         */
        attachElbowEvents: function attachElbowEvents(marker) {

            marker.on('mousedown', function mousedown(event) {

                event.originalEvent.stopPropagation();
                event.originalEvent.preventDefault();
                this.manipulating = marker;

            }.bind(this));

            marker.on('mouseup', function mouseup(event) {

                event.originalEvent.stopPropagation();
                event.originalEvent.preventDefault();
                this.manipulating = false;

            });

        },

        /**
         * @method insertElbow
         * @param {L.LatLng} latLng
         * @return {void}
         */
        insertElbow: function insertElbow(latLng) {

            var newPoint      = this.map.latLngToContainerPoint(latLng),
                leastDistance = Infinity,
                insertAt      = -1;

            this.polyline._latlngs.forEach(function forEach(currentLatLng, index) {

                if (!this.polyline._latlngs[index]) {
                    return;
                }

                var firstPoint  = this.map.latLngToContainerPoint(currentLatLng),
                    secondPoint = this.map.latLngToContainerPoint(this.polyline._latlngs[index]),
                    distance    = L.LineUtil.pointToSegmentDistance(newPoint, firstPoint, secondPoint);

                if (distance < leastDistance) {
                    leastDistance = distance;
                    insertAt      = index;
                }

            }.bind(this));

            var latLngs = this.polyline.getLatLngs();
            latLngs.splice(insertAt, 0, latLng);
            this.polyline.setLatLngs(latLngs);

            this.redraw(this.latLngsToEdges(latLngs));
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

            this.fire('edited', {
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

            var latLngs = [];

            edges.forEach(function forEach(edge) {
                latLngs.push(edge._latlng);
            });

            this.remove(false);

            this.polyline = new L.Polyline(latLngs, this.options).addTo(this.map);
            this.attachPolylineEvents(this.polyline);

        },

        /**
         * @method remove
         * @param {Boolean} [edgesToo=true]
         * @return {void}
         */
        remove: function remove(edgesToo) {

            edgesToo = typeof edgesToo === 'undefined' ? true : edgesToo;

            this.map.removeLayer(this.polyline);

            if (edgesToo ) {

                this.edges.forEach(function forEach(edge) {
                    this.map.removeLayer(edge);
                }.bind(this));

            }

        },

        /**
         * @method latLngsToEdges
         * @param {LatLng[]} latLngs
         * @return {Array}
         */
        latLngsToEdges: function latLngsToEdges(latLngs) {

            return latLngs.map(function forEach(latLng) {
                return { _latlng: latLng };
            });

        },

        /**
         * @method getLatLngs
         * @return {LatLng[]}
         */
        getLatLngs: function getLatLngs() {
            return this.polyline._latlngs;
        },

        /**
         * @method setSmoothFactor
         * @param {Number} smoothFactor
         * @return {void}
         */
        setSmoothFactor: function setSmoothFactor(smoothFactor) {

            this.options.smoothFactor = parseInt(smoothFactor);

            this.remove();
            this.redraw(this.latLngsToEdges(this.polyline._latlngs));
            this.attachElbows();

        }
        
    };

})();