(function main($window) {

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

            this.options       = Object.assign(this.defaultOptions(), options || {});
            this.creating      = false;
            this.polylines     = [];
            this.eventHandlers = [];

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

            var polyline = new L.Pather.Polyline(this.map, latLngs, this.options, {
                fire: this.fire.bind(this),
                mode: this.getMode.bind(this),
                remove: this.removePath.bind(this)
            });

            this.polylines.push(polyline);

            this.fire('created', {
                polyline: polyline,
                latLngs: polyline.getLatLngs()
            });

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

                model.softRemove();

                this.fire('deleted', {
                    polyline: model,
                    latLngs: []
                });

                return true;

            }

            return false;

        },

        /**
         * @method getPaths
         * @return {Array}
         */
        getPaths: function getPolylines() {
            return this.polylines;
        },

        /**
         * @method onAdd
         * @param {L.Map} map
         * @return {void}
         */
        onAdd: function onAdd(map) {

            var element        = this.element = this.options.element || map.getContainer();
            this.draggingState = map.dragging._enabled;
            this.map           = map;
            this.fromPoint     = { x: 0, y: 0 };
            this.svg           = d3.select(element)
                                   .append('svg')
                                       .attr('pointer-events', 'none')
                                       .attr('class', this.getOption('moduleClass'))
                                       .attr('width', this.getOption('width'))
                                       .attr('height', this.getOption('height'));

            map.dragging.disable();

            // Attach the mouse events for drawing the polyline.
            this.attachEvents(map);
            this.setMode(this.options.mode);

        },

        /**
         * @method onRemove
         * @return {void}
         */
        onRemove: function onRemove() {

            this.svg.remove();

            if (this.options.removePolylines) {

                var length = this.polylines.length;

                while (length--) {
                    this.removePath(this.polylines[length]);
                }

            }

            this.map.off('mousedown', this.eventHandlers.mouseDown);
            this.map.off('mousemove', this.eventHandlers.mouseMove);
            this.map.off('mouseup',   this.eventHandlers.mouseUp);
            this.map.getContainer().removeEventListener('mouseleave', this.eventHandlers.mouseLeave);

            this.element.classList.remove('mode-create');
            this.element.classList.remove('mode-delete');
            this.element.classList.remove('mode-edit');
            this.element.classList.remove('mode-append');

            var tileLayer     = this.map.getContainer().querySelector('.leaflet-tile-pane'),
                originalState = this.draggingState ? 'enable' : 'disable';
            tileLayer.style.pointerEvents = 'all';
            this.map.dragging[originalState]();

        },

        /**
         * @method getEvent
         * @param {Object} event
         * @return {Object}
         */
        getEvent: function getEvent(event) {

            if (event.touches) {
                return event.touches[0];
            }

            return event;

        },

        /**
         * @method edgeBeingChanged
         * @return {Array}
         */
        edgeBeingChanged: function edgeBeingChanged() {

            var edges = this.polylines.filter(function filter(polyline) {
                return polyline.manipulating;
            });

            return edges.length === 0 ? null : edges[0];

        },

        /**
         * @method isPolylineCreatable
         * @return {Boolean}
         */
        isPolylineCreatable: function isPolylineCreatable() {
            return !!(this.options.mode & MODES.CREATE);
        },

        /**
         * @property events
         * @type {Object}
         */
        events: {

            /**
             * @method mouseDown
             * @param {Object} event
             */
            mouseDown: function mouseDown(event) {

                event = event.originalEvent || this.getEvent(event);

                var point  = this.map.mouseEventToContainerPoint(event),
                    latLng = this.map.containerPointToLatLng(point);

                if (this.isPolylineCreatable() && !this.edgeBeingChanged()) {

                    this.creating  = true;
                    this.fromPoint = this.map.latLngToContainerPoint(latLng);
                    this.latLngs   = [];

                }

            },

            /**
             * @method mouseMove
             * @param {Object} event
             * @return {void}
             */
            mouseMove: function mouseMove(event) {

                event     = event.originalEvent || this.getEvent(event);
                var point = this.map.mouseEventToContainerPoint(event);

                if (this.edgeBeingChanged()) {
                    this.edgeBeingChanged().moveTo(this.map.containerPointToLayerPoint(point));
                    return;
                }

                var lineFunction = d3.svg.line()
                    .x(function x(d) { return d.x; })
                    .y(function y(d) { return d.y; })
                    .interpolate('linear');

                if (this.creating) {

                    var lineData = [this.fromPoint, new L.Point(point.x, point.y, false)];
                    this.latLngs.push(point);

                    this.svg.append('path')
                        .classed(this.getOption('lineClass'), true)
                        .attr('d', lineFunction(lineData))
                        .attr('stroke', this.getOption('strokeColour'))
                        .attr('stroke-width', this.getOption('strokeWidth'))
                        .attr('fill', 'none');

                    this.fromPoint = { x: point.x, y: point.y };

                }

            },

            /**
             * @method mouseLeave
             * @return {void}
             */
            mouseLeave: function mouseLeave() {
                this.clearAll();
                this.creating = false;
            },

            /**
             * @method mouseUp
             * @return {void}
             */
            mouseUp: function mouseup() {

                if (this.creating) {

                    this.creating = false;
                    this.createPath(this.convertPointsToLatLngs(this.latLngs));
                    this.latLngs  = [];
                    return;

                }

                if (this.edgeBeingChanged()) {

                    this.edgeBeingChanged().attachElbows();
                    this.edgeBeingChanged().finished();
                    this.edgeBeingChanged().manipulating = false;

                }

            }

        },

        /**
         * @method attachEvents
         * @param {L.Map} map
         * @return {void}
         */
        attachEvents: function attachEvents(map) {

            this.eventHandlers = {
                mouseDown:  this.events.mouseDown.bind(this),
                mouseMove:  this.events.mouseMove.bind(this),
                mouseUp:    this.events.mouseUp.bind(this),
                mouseLeave: this.events.mouseLeave.bind(this)
            };

            this.map.on('mousedown', this.eventHandlers.mouseDown);
            this.map.on('mousemove', this.eventHandlers.mouseMove);
            this.map.on('mouseup', this.eventHandlers.mouseUp);
            this.map.getContainer().addEventListener('mouseleave', this.eventHandlers.mouseLeave);

            // Attach the mobile events that delegate to the desktop events.
            this.map.getContainer().addEventListener('touchstart', this.fire.bind(map, 'mousedown'));
            this.map.getContainer().addEventListener('touchmove', this.fire.bind(map, 'mousemove'));
            this.map.getContainer().addEventListener('touchend', this.fire.bind(map, 'mouseup'));

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
                detectTouch: true,
                elbowClass: 'elbow',
                removePolylines: true,
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
        },

        /**
         * @method setMode
         * @param {Number} mode
         * @return {void}
         */
        setMode: function setMode(mode) {

            this.setClassName(mode);
            this.options.mode = mode;

            var tileLayer = this.map.getContainer().querySelector('.leaflet-tile-pane');

            /**
             * @method shouldDisableDrag
             * @return {Boolean}
             * @see http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
             */
            var shouldDisableDrag = function shouldDisableDrag() {

                if (this.detectTouch && ('ontouchstart' in $window || 'onmsgesturechange' in $window)) {
                    return (this.options.mode & MODES.CREATE || this.options.mode & MODES.EDIT);
                }

                return (this.options.mode & MODES.CREATE);

            }.bind(this);

            if (shouldDisableDrag()) {

                var originalState = this.draggingState ? 'disable' : 'enable';
                tileLayer.style.pointerEvents = 'none';
                return void this.map.dragging[originalState]();

            }

            tileLayer.style.pointerEvents = 'all';
            this.map.dragging.enable();

        },

        /**
         * @method setClassName
         * @param {Number} mode
         * @return {void}
         */
        setClassName: function setClassName(mode) {

            /**
             * @method conditionallyAppendClassName
             * @param {String} modeName
             * @return {void}
             */
            var conditionallyAppendClassName = function conditionallyAppendClassName(modeName) {

                var className = ['mode', modeName].join('-');

                if (MODES[modeName.toUpperCase()] & mode) {
                    return void this.element.classList.add(className);
                }

                this.element.classList.remove(className);

            }.bind(this);

            conditionallyAppendClassName('create');
            conditionallyAppendClassName('delete');
            conditionallyAppendClassName('edit');
            conditionallyAppendClassName('append');
        },

        /**
         * @method getMode
         * @return {Number}
         */
        getMode: function getMode() {
            return this.options.mode;
        },

        /**
         * @method setOptions
         * @param {Object} options
         * @return {void}
         */
        setOptions: function setOptions(options) {
            this.options = Object.assign(this.options, options || {});
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

})(window);
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