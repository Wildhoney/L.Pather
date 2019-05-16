import { FeatureGroup } from "leaflet";
/**
 * @constant MODES
 * @type {{VIEW: number, CREATE: number, EDIT: number, DELETE: number, APPEND: number, EDIT_APPEND: number, ALL: number}}
 */
export const MODES = {
  VIEW: 1,
  CREATE: 2,
  EDIT: 4,
  DELETE: 8,
  APPEND: 16,
  EDIT_APPEND: 4 | 16,
  ALL: 1 | 2 | 4 | 8 | 16
};

const defaultOptions = {
  moduleClass: "pather",
  lineClass: "drawing-line",
  detectTouch: true,
  elbowClass: "elbow",
  removePolylines: true,
  strokeColour: "rgba(0,0,0,.5)",
  strokeWidth: 2,
  width: "100%",
  height: "100%",
  smoothFactor: 10,
  pathColour: "black",
  pathOpacity: 0.55,
  pathWidth: 3,
  mode: MODES.ALL
};
/**
 * @module Pather
 * @author Adam Timberlake
 * @link https://github.com/Wildhoney/L.Pather
 */
export default class Pather extends FeatureGroup {
  constructor(options = defaultOptions) {
    super();
    this.options = { ...defaultOptions, ...options };
    this.creating = false;
    this.polylines = [];
    this.eventHandlers = [];
  }

  events = {
    mouseDown(event) {
      event = event.originalEvent || this.getEvent(event);

      const point = this.map.mouseEventToContainerPoint(event),
        latLng = this.map.containerPointToLatLng(point);

      if (this.isPolylineCreatable() && !this.edgeBeingChanged()) {
        this.creating = true;
        this.fromPoint = this.map.latLngToContainerPoint(latLng);
        this.latLngs = [];
      }
    },

    mouseMove(event) {
      event = event.originalEvent || this.getEvent(event);
      const point = this.map.mouseEventToContainerPoint(event);

      if (this.edgeBeingChanged()) {
        this.edgeBeingChanged().moveTo(
          this.map.containerPointToLayerPoint(point)
        );
        return;
      }

      const lineFunction = d3.svg
        .line()
        .x(function x(d) {
          return d.x;
        })
        .y(function y(d) {
          return d.y;
        })
        .interpolate("linear");

      if (this.creating) {
        const lineData = [this.fromPoint, new L.Point(point.x, point.y, false)];
        this.latLngs.push(point);

        this.svg
          .append("path")
          .classed(this.getOption("lineClass"), true)
          .attr("d", lineFunction(lineData))
          .attr("stroke", this.getOption("strokeColour"))
          .attr("stroke-width", this.getOption("strokeWidth"))
          .attr("fill", "none");

        this.fromPoint = { x: point.x, y: point.y };
      }
    },

    mouseLeave() {
      this.clearAll();
      this.creating = false;
    },

    mouseUp() {
      if (this.creating) {
        this.creating = false;
        this.createPath(this.convertPointsToLatLngs(this.latLngs));
        this.latLngs = [];
        return;
      }

      if (this.edgeBeingChanged()) {
        this.edgeBeingChanged().attachElbows();
        this.edgeBeingChanged().finished();
        this.edgeBeingChanged().manipulating = false;
      }
    }
  };

  createPath(latLngs) {
    if (latLngs.length <= 1) {
      return false;
    }

    this.clearAll();

    const polyline = new L.Pather.Polyline(this.map, latLngs, this.options, {
      fire: this.fire.bind(this),
      mode: this.getMode.bind(this),
      remove: this.removePath.bind(this)
    });

    this.polylines.push(polyline);

    this.fire("created", {
      polyline: polyline,
      latLngs: polyline.getLatLngs()
    });

    return polyline;
  }

  removePath(model) {
    if (model instanceof L.Pather.Polyline) {
      const indexOf = this.polylines.indexOf(model);
      this.polylines.splice(indexOf, 1);

      model.softRemove();

      this.fire("deleted", {
        polyline: model,
        latLngs: []
      });

      return true;
    }

    return false;
  }

  getPaths() {
    return this.polylines;
  }

  onAdd(map) {
    const element = (this.element = this.options.element || map.getContainer());
    this.draggingState = map.dragging._enabled;
    this.map = map;
    this.fromPoint = { x: 0, y: 0 };
    this.svg = d3
      .select(element)
      .append("svg")
      .attr("pointer-events", "none")
      .attr("class", this.getOption("moduleClass"))
      .attr("width", this.getOption("width"))
      .attr("height", this.getOption("height"));

    map.dragging.disable();

    // Attach the mouse events for drawing the polyline.
    this.attachEvents(map);
    this.setMode(this.options.mode);
  }

  onRemove() {
    this.svg.remove();

    if (this.options.removePolylines) {
      const length = this.polylines.length;

      while (length--) {
        this.removePath(this.polylines[length]);
      }
    }

    this.map.off("mousedown", this.eventHandlers.mouseDown);
    this.map.off("mousemove", this.eventHandlers.mouseMove);
    this.map.off("mouseup", this.eventHandlers.mouseUp);
    this.map
      .getContainer()
      .removeEventListener("mouseleave", this.eventHandlers.mouseLeave);

    this.element.classList.remove("mode-create");
    this.element.classList.remove("mode-delete");
    this.element.classList.remove("mode-edit");
    this.element.classList.remove("mode-append");

    const tileLayer = this.map
        .getContainer()
        .querySelector(".leaflet-tile-pane"),
      originalState = this.draggingState ? "enable" : "disable";
    tileLayer.style.pointerEvents = "all";
    this.map.dragging[originalState]();
  }

  getEvent(event) {
    if (event.touches) {
      return event.touches[0];
    }

    return event;
  }

  edgeBeingChanged() {
    const edges = this.polylines.filter(function filter(polyline) {
      return polyline.manipulating;
    });

    return edges.length === 0 ? null : edges[0];
  }

  isPolylineCreatable() {
    return !!(this.options.mode & MODES.CREATE);
  }

  attachEvents(map) {
    this.eventHandlers = {
      mouseDown: this.events.mouseDown.bind(this),
      mouseMove: this.events.mouseMove.bind(this),
      mouseUp: this.events.mouseUp.bind(this),
      mouseLeave: this.events.mouseLeave.bind(this)
    };

    this.map.on("mousedown", this.eventHandlers.mouseDown);
    this.map.on("mousemove", this.eventHandlers.mouseMove);
    this.map.on("mouseup", this.eventHandlers.mouseUp);
    this.map
      .getContainer()
      .addEventListener("mouseleave", this.eventHandlers.mouseLeave);

    // Attach the mobile events that delegate to the desktop events.
    this.map
      .getContainer()
      .addEventListener("touchstart", this.fire.bind(map, "mousedown"));
    this.map
      .getContainer()
      .addEventListener("touchmove", this.fire.bind(map, "mousemove"));
    this.map
      .getContainer()
      .addEventListener("touchend", this.fire.bind(map, "mouseup"));
  }

  convertPointsToLatLngs(points) {
    return points.map(point => this.map.containerPointToLatLng(point));
  }

  clearAll() {
    this.svg.text("");
  }

  getOption(property) {
    return this.options[property] || this.defaultOptions()[property];
  }

  setSmoothFactor(smoothFactor) {
    this.options.smoothFactor = parseInt(smoothFactor);
  }

  setMode(mode) {
    this.setClassName(mode);
    this.options.mode = mode;

    const tileLayer = this.map
      .getContainer()
      .querySelector(".leaflet-tile-pane");

    const shouldDisableDrag = () => {
      // FIXME
      //   if (
      //     this.detectTouch &&
      //     ("ontouchstart" in $window || "onmsgesturechange" in $window)
      //   ) {
      //     return (
      //       this.options.mode & MODES.CREATE || this.options.mode & MODES.EDIT
      //     );
      //   }

      //   return this.options.mode & MODES.CREATE;
      this.options.mode & MODES.CREATE || this.options.mode & MODES.EDIT;
    };

    if (shouldDisableDrag()) {
      const originalState = this.draggingState ? "disable" : "enable";
      tileLayer.style.pointerEvents = "none";
      return void this.map.dragging[originalState]();
    }

    tileLayer.style.pointerEvents = "all";
    this.map.dragging.enable();
  }

  setClassName(mode) {
    const conditionallyAppendClassName = modeName => {
      const className = ["mode", modeName].join("-");

      if (MODES[modeName.toUpperCase()] & mode) {
        return void this.element.classList.add(className);
      }

      this.element.classList.remove(className);
    };

    conditionallyAppendClassName("create");
    conditionallyAppendClassName("delete");
    conditionallyAppendClassName("edit");
    conditionallyAppendClassName("append");
  }

  getMode() {
    return this.options.mode;
  }

  setOptions(options) {
    this.options = Object.assign(this.options, options || {});
  }
}
