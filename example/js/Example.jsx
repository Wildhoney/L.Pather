(function main($document, $navigator, $react) {

    /**
     * @module Pather
     * @link https://github.com/Wildhoney/L.Pather
     * @author Adam Timberlake
     */
    var Pather = $react.createClass({

        /**
         * @method componentDidMount
         * @return {void}
         */
        componentDidMount: function componentDidMount() {

            var pather = this.addMap();

            pather.on('created', this.consoleLog.bind(null, 'Created'));
            pather.on('edited',  this.consoleLog.bind(null, 'Edited'));
            pather.on('deleted', this.consoleLog.bind(null, 'Deleted'));

            Mousetrap.bind('mod', function modDown() {
                this.setState({ mod: true });
            }.bind(this), 'keydown');

            Mousetrap.bind('mod', function modUp() {
                this.setState({ mod: false });
            }.bind(this), 'keyup');

        },

        /**
         * @method getInitialState
         * @return {Object}
         */
        getInitialState: function getInitialState() {

            return {
                mod: false,
                pather: {
                    getMode: function getModeNoop() {
                        return 0;
                    },
                    getPaths: function getPathsNoop() {
                        return [];
                    }
                }
            };

        },

        /**
         * @method addMap
         * @return {L.Map}
         */
        addMap: function addMap() {

            var element = this.getDOMNode().querySelector('section.map'),
                map     = new L.Map(element).setView([51.505, -0.09], 15),
                pather  = new L.Pather({
                    smoothFactor: 5,
                    mode: L.Pather.MODE.ALL
            });

            L.tileLayer('https://a.tiles.mapbox.com/v4/examples.ra3sdcxr/{z}/{x}/{y}@2x.png?access_token=' + this.props.accessToken, {
                maxZoom: 18
            }).addTo(map);

            map.addLayer(pather);
            this.setState({ pather: pather });
            return pather;

        },

        /**
         * @method consoleLog
         * @param {String} type
         * @param {Object} event
         * @return {void}
         */
        consoleLog: function consoleLog(type, event) {

            var latLngs = event.latLngs.map(function(latLng) {
                return [latLng.lat, latLng.lng];
            }).join(', ') || 'Voila!';

            console.log('%c ' + type + ': %c ' + latLngs, 'border-radius: 3px; color: white; background-color: lightseagreen', 'font-size: 10px; color: black');

            this.forceUpdate();

        },

        /**
         * @method getButtons
         * @return {Array}
         */
        getButtons: function getButtons() {

            var buttons = [
                { label: 'Create', icon: 'fa-pencil' },
                { label: 'Edit',   icon: 'fa-arrows-alt' },
                { label: 'Append', icon: 'fa-plus-circle' },
                { label: 'Delete', icon: 'fa-times' }
            ];

            return buttons.map(function map(button) {

                var mode = L.Pather.MODE[button.label.toUpperCase()];

                return {
                    icon: ['fa', button.icon].join(' '),
                    active: this.state.pather.getMode() & mode,
                    mode: mode
                };

            }.bind(this));

        },

        /**
         * @method toggleMode
         * @param {Number} mode
         * @return {void}
         */
        toggleMode: function toggleMode(mode) {

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
            
        },

        /**
         * @method render
         * @return {Object}
         */
        render: function render() {

            return (

                <main>
                    <ul className="buttons">

                        {this.getButtons().map(function map(button) {
                            return (
                                <li onClick={this.toggleMode.bind(null, button.mode)}
                                    className={button.active ? 'active' : ''}>
                                    <i className={button.icon}></i>
                                </li>
                            );
                        }.bind(this))}

                    </ul>
                    <label className="mod">Note: mod + click for exclusive mode.</label>
                    <label className="count">{this.state.pather.getPaths().length}</label>
                    <section className="map"></section>
                </main>

            );

        }

    });

    $react.render(
        <Pather accessToken="pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q" />,
        $document.querySelector('pather-example')
    );

})(document, navigator, window.React);