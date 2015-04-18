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
     * @constant MODES
     * @type {{VIEW: number, CREATE: number, EDIT: number, DELETE: number, APPEND: number, EDIT_APPEND: number, ALL: number}}
     */
    var MODES = {
        VIEW:        1,
        CREATE:      2,
        EDIT:        4,
        DELETE:      8,
        APPEND:      16,
        EDIT_APPEND: 4 | 16,
        ALL:         1 | 2 | 4 | 8 | 16
    };

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
            this.options   = Object.assign(this.defaultOptions(), options || {});
            this.creating  = false;
            this.polylines = [];
        },

        /**
         * @method createPath
         * @param {L.LatLng[]} latLngs
         * @return {L.Pather.Polyline|Boolean}
         */
        createPath: function createPath(latLngs) {

            if (latLngs.length <= 1) {
                return false;
            }

            this.clearAll();

            var polyline = new L.Pather.Polyline(this.map, latLngs, this.options, this.fire.bind(this));
            this.polylines.push(polyline);
            return polyline;

        },

        /**
         * @method removePath
         * @param {L.Pather.Polyline} model
         * @return {Boolean}
         */
        removePath: function removePath(model) {

            if (model instanceof L.Pather.Polyline) {

                var indexOf = this.polylines.indexOf(model);
                this.polylines.splice(indexOf, 1);
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
            this.map       = map;
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

            /**
             * @method manipulatingEdges
             * @return {Object}
             */
            var manipulatingEdges = function manipulatingEdges() {

                return this.polylines.filter(function filter(polyline) {
                    return polyline.manipulating;
                });

            }.bind(this);

            /**
             * @method hasCreatePermission
             * @return {Boolean}
             */
            var hasCreatePermission = function hasCreatePermission() {
                return !!(this.options.mode & MODES.CREATE);
            }.bind(this);

            map.on('mousedown', function mousedown(event) {

                if (hasCreatePermission() && manipulatingEdges().length === 0) {

                    this.creating  = true;
                    this.fromPoint = map.latLngToContainerPoint(event.latlng);
                    this.latLngs   = [];

                }

            }.bind(this));

            map.on('mouseup', function mouseup() {

                if (manipulatingEdges().length === 0) {

                    this.creating = false;
                    this.createPath(this.convertPointsToLatLngs(this.latLngs));
                    this.latLngs  = [];
                    return;

                }

                manipulatingEdges()[0].attachElbows();
                manipulatingEdges()[0].finished();
                manipulatingEdges()[0].manipulating = false;

            }.bind(this));

            map.on('mousemove', function mousemove(event) {

                if (manipulatingEdges().length > 0) {
                    manipulatingEdges()[0].moveTo(event.layerPoint);
                    return;
                }

                var lineFunction = d3.svg.line()
                                     .x(function x(d) { return d.x; })
                                     .y(function y(d) { return d.y; })
                                     .interpolate('linear');

                if (this.creating) {

                    var point    = map.mouseEventToContainerPoint(event.originalEvent),
                        lineData = [this.fromPoint, new L.Point(point.x, point.y, false)];

                    this.latLngs.push(point);

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
         * @method convertPointsToLatLngs
         * @param {Point[]} points
         * @return {LatLng[]}
         */
        convertPointsToLatLngs: function convertPointsToLatLngs(points) {

            return points.map(function map(point) {
                return this.map.containerPointToLatLng(point);
            }.bind(this));

        },

        /**
         * @method clearAll
         * @return {void}
         */
        clearAll: function clearAll() {
            this.svg.text('');
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
                lineClass: 'drawing-line',
                elbowClass: 'elbow',
                strokeColour: 'rgba(0,0,0,.5)',
                strokeWidth: 2,
                width: '100%',
                height: '100%',
                smoothFactor: 10,
                pathColour: 'black',
                pathOpacity: 0.55,
                pathWidth: 3,
                mode: MODES.ALL
            };

        },

        /**
         * @method setSmoothFactor
         * @param {Number} smoothFactor
         * @return {void}
         */
        setSmoothFactor: function setSmoothFactor(smoothFactor) {

            this.options.smoothFactor = parseInt(smoothFactor);

            this.polylines.forEach(function forEach(polyline) {
                polyline.setSmoothFactor(smoothFactor);
            });

        },

        /**
         * @method setMode
         * @param {Number} mode
         * @return {void}
         */
        setMode: function setMode(mode) {

            this.options.mode = mode;

            if (this.options.mode & MODES.CREATE) {
                return void this.map.dragging.disable();
            }

            this.map.dragging.enable();

        },

        /**
         * @method getMode
         * @return {Number}
         */
        getMode: function getMode() {
            return this.options.mode;
        }

    });

    /**
     * @constant L.Pather.MODE
     * @type {Object}
     */
    L.Pather.MODE = MODES;

    // Simple factory that Leaflet loves to bundle.
    L.pather = function pather(options) {
        return new L.Pather(options);
    };

})();
(function main() {

    "use strict";

    /* jshint ignore:start */

    if (!Object.assign) {
        Object.defineProperty(Object, 'assign', {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function(target, firstSource) {
                'use strict';
                if (target === undefined || target === null) {
                    throw new TypeError('Cannot convert first argument to object');
                }

                var to = Object(target);
                for (var i = 1; i < arguments.length; i++) {
                    var nextSource = arguments[i];
                    if (nextSource === undefined || nextSource === null) {
                        continue;
                    }
                    nextSource = Object(nextSource);

                    var keysArray = Object.keys(Object(nextSource));
                    for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                        var nextKey = keysArray[nextIndex];
                        var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                        if (desc !== undefined && desc.enumerable) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
                return to;
            }
        });
    }

    /* jshint ignore:end */

})();
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