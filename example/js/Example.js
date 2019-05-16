import React, { createRef } from "react";
import L from "leaflet";

import { render } from "react-dom";
import Mousetrap from "mousetrap";
import Pather, { MODES } from "../../src/Pather";
import "leaflet/dist/leaflet.css";
import "../css/default.css";

/**
 * @module Pather
 * @link https://github.com/Wildhoney/L.Pather
 * @author Adam Timberlake
 */

export default class PatherComponent extends React.Component {
  constructor() {
    super();
    this.state = {
      mod: false,
      pather: {
        getMode() {
          return 0;
        },
        getPaths() {
          return [];
        }
      }
    };
    this.map = createRef();
  }

  componentDidMount() {
    var pather = this.addMap();

    pather.on("created", this.consoleLog.bind(this, "Created"));
    pather.on("edited", this.consoleLog.bind(this, "Edited"));
    pather.on("deleted", this.consoleLog.bind(this, "Deleted"));

    Mousetrap.bind("mod", () => this.setState({ mod: true }), "keydown");
    Mousetrap.bind("mod", () => this.setState({ mod: false }), "keyup");
  }

  addMap() {
    const element = this.map.current;
    const map = new L.Map(element).setView([51.505, -0.09], 15);
    const pather = new Pather({
      smoothFactor: 5,
      mode: MODES.ALL
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18
    }).addTo(map);

    map.addLayer(pather);
    this.setState({ pather: pather });
    return pather;
  }

  consoleLog(type, event) {
    var latLngs =
      event.latLngs.map(latLng => [latLng.lat, latLng.lng]).join(", ") ||
      "Voila!";

    console.log(
      "%c " + type + ": %c " + latLngs,
      "border-radius: 3px; color: white; background-color: lightseagreen",
      "font-size: 10px; color: black"
    );

    this.forceUpdate();
  }

  getButtons() {
    var buttons = [
      { label: "Create", icon: "fa-pencil-square-o" },
      { label: "Edit", icon: "fa-arrows-alt" },
      { label: "Append", icon: "fa-plus-circle" },
      { label: "Delete", icon: "fa-times" }
    ];

    return buttons.map(button => {
      var mode = MODES[button.label.toUpperCase()];

      return {
        icon: ["fa", button.icon].join(" "),
        active: this.state.pather.getMode() & mode,
        mode: mode
      };
    });
  }

  /**
   * @method toggleMode
   * @param {Number} mode
   * @return {void}
   */
  toggleMode(mode) {
    if (this.state.mod) {
      this.state.pather.setMode(mode);
      return this.forceUpdate();
    }

    var currentMode = this.state.pather.getMode();

    if (currentMode & mode) {
      // Unset the selected mode.
      this.state.pather.setMode(currentMode ^ mode);
      return void this.forceUpdate();
    }

    // Set the selected mode.
    this.state.pather.setMode(currentMode | mode);
    this.forceUpdate();
  }

  /**
   * @method render
   * @return {Object}
   */
  render() {
    return (
      <main>
        <div style={{ position: "relative", zIndex: 1000 }}>
          <ul className="buttons">
            {this.getButtons().map(button => (
              <li
                onClick={this.toggleMode.bind(this, button.mode)}
                className={button.active ? "active" : ""}
              >
                <i className={button.icon} />
              </li>
            ))}
          </ul>
          <label className="mod">Note: mod + click for exclusive mode.</label>
          <label className="count">{this.state.pather.getPaths().length}</label>
        </div>

        <section ref={this.map} className="map" />
      </main>
    );
  }
}

render(<PatherComponent />, document.getElementById("root"));
