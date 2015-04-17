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
     * @return {Polyline}
     * @constructor
     */
    L.Pather.Polyline = function Polyline(map, latLngs, options) {

        this.options = {
            color:        options.pathColour,
            opacity:      options.pathOpacity,
            weight:       options.pathWidth,
            smoothFactor: options.smoothFactor || 1,
            elbowClass:   options.elbowClass
        };

        this.polyline     = new L.Polyline(latLngs, this.options).addTo(map);
        this.map          = map;
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

                //var newPoint = this.map.mouseEventToContainerPoint(event.originalEvent);
                //this.insertElbow(newPoint);

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
         * @param {L.Point} newPoint
         * @return {void}
         */
        insertElbow: function insertElbow(newPoint) {

            var lowestDistance = Infinity,
                startPoint     = new L.Point(),
                endPoint       = new L.Point(),
                latLngs        = [];

            this.edges.forEach(function forEach(edge, index) {

                var firstPoint  = edge[DATA_ATTRIBUTE].point,
                    secondPoint = this.edges[index + 1] || null;

                if (secondPoint === null) {
                    return;
                }

                secondPoint  = secondPoint[DATA_ATTRIBUTE].point;
                var distance = L.LineUtil.pointToSegmentDistance(newPoint, firstPoint, secondPoint);

                if (distance < lowestDistance) {

                    // We discovered a distance that possibly should contain the new point!
                    lowestDistance = distance;
                    startPoint     = firstPoint;
                    endPoint       = secondPoint;

                }

            }.bind(this));

            this.edges.forEach(function forEach(edge, index) {

                var nextPoint = this.edges[index + 1] || null,
                    point     = edge[DATA_ATTRIBUTE].point;

                if (nextPoint === null) {
                    return;
                }

                nextPoint = nextPoint[DATA_ATTRIBUTE].point;

                if (point === startPoint && nextPoint === endPoint) {

                    latLngs.push(this.map.containerPointToLatLng(point));
                    latLngs.push(this.map.containerPointToLatLng(newPoint));
                    return;

                }

                latLngs.push(this.map.containerPointToLatLng(point));

            }.bind(this));

            this.redraw(this.latLngsToEdges(latLngs));

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