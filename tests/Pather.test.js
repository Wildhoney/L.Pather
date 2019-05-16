import L from "leaflet";
import Pather, { MODES } from "../src/Pather";

describe("Pather", function() {
  var map,
    pather,
    element = document.createElement("div");

  beforeEach(function() {
    map = new L.Map(element).setView([1, 1], 15);
  });

  afterEach(function() {
    map.remove();
    map = null;
  });

  function addPather(options) {
    pather = new Pather(options || {});
    map.addLayer(pather);
  }

  it("Should be able to initialise the module;", function() {
    addPather({ moduleClass: "d3_pather" });
    expect(pather instanceof Pather).toBeTruthy();
    expect(element.querySelectorAll("svg.d3_pather").length).toEqual(1);
  });

  it("Should be able to add a polyline;", function() {
    addPather();
    expect(pather instanceof Pather).toBeTruthy();
    expect(element.querySelectorAll("svg.pather").length).toEqual(1);
    expect(element.querySelectorAll("path").length).toEqual(0);

    var path = pather.createPath([
      new L.LatLng(0, 0),
      new L.LatLng(1, 1),
      new L.LatLng(2, 2)
    ]);

    expect(element.querySelectorAll("path").length).toEqual(1);
    path.softRemove();
    expect(element.querySelectorAll("path").length).toEqual(0);
  });

  it("Should be able to default to original options if unspecified;", function() {
    addPather({ width: "50%", height: "50%" });

    expect(pather.getOption("height")).toEqual("50%");
    expect(pather.getOption("width")).toEqual("50%");
    expect(pather.getOption("strokeWidth")).toEqual(2);
    expect(pather.getOption("pathColour")).toEqual("black");
  });

  it("Should be able to remove polylines from the collection;", function() {
    addPather();

    var path = pather.createPath([
      new L.LatLng(0, 0),
      new L.LatLng(1, 1),
      new L.LatLng(2, 2)
    ]);

    expect(element.querySelectorAll("path").length).toEqual(1);
    expect(pather.polylines.length).toEqual(1);
    pather.removePath(path);
    expect(element.querySelectorAll("path").length).toEqual(0);
    expect(pather.polylines.length).toEqual(0);
  });

  it("Should be able to clear the D3 paths;", function() {
    addPather({ moduleClass: "clear-this" });
    spyOn(pather.svg, "text");
    pather.clearAll();
    expect(pather.svg.text).toHaveBeenCalledWith("");
  });

  it("Should be able to attach/detect the elbows when selecting/deselecting;", function() {
    addPather({ smoothFactor: 200 });

    var path = pather.createPath([
      new L.LatLng(0, 0),
      new L.LatLng(1, 1),
      new L.LatLng(2, 2),
      new L.LatLng(3, 5),
      new L.LatLng(2, 1)
    ]);

    spyOn(path, "attachElbows");
    path.select();
    path.manipulating = {};
    expect(path.attachElbows).toHaveBeenCalled();
    path.deselect();
  });

  it("Should be able to empty the edges when detaching elbows;", function() {
    addPather();

    var path = pather.createPath([
      new L.LatLng(0, 0),
      new L.LatLng(1, 1),
      new L.LatLng(2, 2)
    ]);

    path.edges = [1, 2, 3];
    expect(path.edges.length).toEqual(3);
    path.detachElbows();
    expect(path.edges.length).toEqual(0);
  });

  it("Should be able to set the mode correctly;", function() {
    addPather();

    expect(pather.getMode()).toEqual(MODES.ALL);
    pather.setMode(pather.getMode() ^ MODES.EDIT);
    expect(pather.getMode() & MODES.EDIT).toEqual(0);
    pather.setMode(MODES.CREATE | MODES.EDIT);
    expect(pather.getMode() & MODES.CREATE).toBeTruthy();
    expect(pather.getMode() & MODES.EDIT).toBeTruthy();
    expect(pather.getMode() & MODES.APPEND).toBeFalsy();
    expect(pather.getMode() & MODES.DELETE).toBeFalsy();
  });

  it("Should be able to set the class name to reflect the current mode;", function() {
    addPather({
      mode: MODES.CREATE | MODES.APPEND
    });

    expect(element.classList.contains("mode-create")).toBeTruthy();
    expect(element.classList.contains("mode-append")).toBeTruthy();
    expect(element.classList.contains("mode-edit")).toBeFalsy();
    expect(element.classList.contains("mode-delete")).toBeFalsy();

    pather.setMode(MODES.ALL ^ MODES.CREATE);
    expect(element.classList.contains("mode-create")).toBeFalsy();
    expect(element.classList.contains("mode-append")).toBeTruthy();
    expect(element.classList.contains("mode-edit")).toBeTruthy();
    expect(element.classList.contains("mode-delete")).toBeTruthy();
  });

  it("Should emit events for create, edit, and delete;", function() {
    addPather();

    spyOn(pather, "fire").and.callThrough();

    var polyline = pather.createPath([new L.LatLng(0, 0), new L.LatLng(1, 1)]);
    expect(polyline instanceof Pather.Polyline).toBeTruthy();
    expect(pather.fire).toHaveBeenCalled();
    expect(pather.fire.calls.count()).toEqual(1);
    expect(pather.getPaths().length).toEqual(1);

    pather.removePath(polyline);
    expect(pather.fire.calls.count()).toEqual(2);
    expect(pather.getPaths().length).toEqual(0);
  });

  it("Should be able to use the Symbol constructor for the internal Pather property;", function() {
    addPather();

    var polyline = pather.createPath([new L.LatLng(0, 0), new L.LatLng(1, 1)]),
      edge = polyline.edges[0];

    if (typeof Symbol !== "undefined") {
      var symbols = Object.getOwnPropertySymbols(edge);

      expect(symbols.length).toEqual(1);
      expect(edge._pather).toBeUndefined();
      expect(typeof edge[symbols[0]]).toBe("object");
    } else {
      expect(edge._pather).toBeDefined();
      expect(typeof edge._pather).toBe("object");
    }
  });

  it("Should be able to modify options after instantiation;", function() {
    addPather({ smoothFactor: 2.5, strokeWidth: 10 });

    expect(pather.options.smoothFactor).toEqual(2.5);
    expect(pather.options.strokeWidth).toEqual(10);
    expect(pather.options.pathColour).toEqual("black");

    pather.setOptions({ smoothFactor: 12.5 });
    expect(pather.options.smoothFactor).toEqual(12.5);
    expect(pather.options.strokeWidth).toEqual(10);
    expect(pather.options.pathColour).toEqual("black");
  });
});
