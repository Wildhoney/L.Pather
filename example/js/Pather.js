(function($document) {

    "use strict";

    var ACCESS_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q';

    $document.addEventListener('DOMContentLoaded', function DOMContentLoaded() {

        var element = $document.querySelector('section.map'),
            map     = new L.Map(element).setView([51.505, -0.09], 15);

        L.tileLayer('https://a.tiles.mapbox.com/v4/examples.ra3sdcxr/{z}/{x}/{y}@2x.png?access_token=' + ACCESS_TOKEN, {
            maxZoom: 18
        }).addTo(map);

        var rangeElement = $document.querySelector('input.smooth-factor');

        rangeElement.addEventListener('change', function change() {
            pather.setSmoothFactor(this.value / 10);
        });

        var pather = new L.Pather({
            smoothFactor: rangeElement.value / 10,
            mode: L.Pather.MODE.CREATE | L.Pather.MODE.EDIT
        });

        map.addLayer(pather);

        function consoleLog(type, event) {

            console.log('%c ' + type + ': %c ' + event.latLngs.map(function(latLng) {
                return [latLng.lat, latLng.lng];
            }).join(', '), 'border-radius: 3px; color: white; background-color: lightseagreen', 'font-size: 10px; color: black');

        }

        pather.on('created', consoleLog.bind(null, 'Created'));
        pather.on('edited', consoleLog.bind(null, 'Edited'));

    });

})(window.document);