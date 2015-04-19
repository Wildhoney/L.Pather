describe('Pather', function() {

    var map, pather, element = document.createElement('div');

    beforeEach(function() {
        map = new L.Map(element).setView([1, 1], 15);
    });

    afterEach(function() {
        map.remove();
        map = null;
    });

    function addPather(options) {
        pather = new L.Pather(options || {});
        map.addLayer(pather);
    }

    it('Should be able to initialise the module;', function() {

        addPather({ moduleClass: 'd3_pather' });
        expect(pather instanceof L.Pather).toBeTruthy();
        expect(element.querySelectorAll('svg.d3_pather').length).toEqual(1);

    });

    it('Should be able to add a polyline;', function() {

        addPather();
        expect(pather instanceof L.Pather).toBeTruthy();
        expect(element.querySelectorAll('svg.pather').length).toEqual(1);
        expect(element.querySelectorAll('path').length).toEqual(0);

        var path = pather.createPath([
            new L.LatLng(0, 0), new L.LatLng(1, 1), new L.LatLng(2, 2)
        ]);

        expect(element.querySelectorAll('path').length).toEqual(1);
        path.remove();
        expect(element.querySelectorAll('path').length).toEqual(0);

    });

    it('Should be able to default to original options if unspecified;', function() {

        addPather({ width: '50%', height: '50%' });

        expect(pather.getOption('height')).toEqual('50%');
        expect(pather.getOption('width')).toEqual('50%');
        expect(pather.getOption('strokeWidth')).toEqual(2);
        expect(pather.getOption('pathColour')).toEqual('black');

    });

    it('Should be able to remove polylines from the collection;', function() {

        addPather();

        var path = pather.createPath([
            new L.LatLng(0, 0), new L.LatLng(1, 1), new L.LatLng(2, 2)
        ]);

        expect(element.querySelectorAll('path').length).toEqual(1);
        expect(pather.polylines.length).toEqual(1);
        pather.removePath(path);
        expect(element.querySelectorAll('path').length).toEqual(0);
        expect(pather.polylines.length).toEqual(0);

    });

    it('Should be able to clear the D3 paths;', function() {

        addPather({ moduleClass: 'clear-this' });
        spyOn(pather.svg, 'text');
        pather.clearAll();
        expect(pather.svg.text).toHaveBeenCalledWith('');

    });

    it('Should be able to attach/detect the elbows when selecting/deselecting;', function() {

        addPather({ smoothFactor: 200 });

        var path = pather.createPath([
            new L.LatLng(0, 0), new L.LatLng(1, 1), new L.LatLng(2, 2), new L.LatLng(3, 5), new L.LatLng(2, 1)
        ]);

        spyOn(path, 'attachElbows');
        path.select();
        path.manipulating = {};
        expect(path.attachElbows).toHaveBeenCalled();
        path.deselect();

    });

    it('Should be able to empty the edges when detaching elbows;', function() {

        addPather();

        var path = pather.createPath([
            new L.LatLng(0, 0), new L.LatLng(1, 1), new L.LatLng(2, 2)
        ]);

        path.edges = [1, 2, 3];
        expect(path.edges.length).toEqual(3);
        path.detachElbows();
        expect(path.edges.length).toEqual(0);

    });

});