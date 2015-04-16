(function($document) {

    "use strict";

    var ACCESS_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q';

    $document.addEventListener('DOMContentLoaded', function DOMContentLoaded() {

        var element = $document.querySelector('section.map'),
            map     = new L.Map(element).setView([51.505, -0.09], 13);

        L.tileLayer('https://a.tiles.mapbox.com/v4/examples.ra3sdcxr/{z}/{x}/{y}@2x.png?access_token=' + ACCESS_TOKEN, {
            maxZoom: 18
        }).addTo(map);

        map.addLayer(new L.Pather({
            mode: L.Pather.MODE.CREATE | L.Pather.MODE.EDIT
        }));

    });

})(window.document);