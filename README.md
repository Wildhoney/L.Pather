# L.Pather

![Travis](http://img.shields.io/travis/Wildhoney/L.Pather.svg?style=flat)
&nbsp;
![npm](http://img.shields.io/npm/v/leaflet-pather.svg?style=flat)
&nbsp;
![MIT License](http://img.shields.io/badge/license-MIT-lightgrey.svg?style=flat)
&nbsp;
![IE9+](http://img.shields.io/badge/support-IE9-blue.svg?style=flat)

* **Heroku**: [http://pather.herokuapp.com/](http://pather.herokuapp.com/)
* **Bower:** `bower install leaflet-pather`;

Branching from [`Leaflet.FreeDraw`](https://github.com/Wildhoney/Leaflet.FreeDraw), L.Pather is a freehand polyline creator that simplifies the polyline for mutability. The reason for creating a branch from `FreeDraw` is that a polyline feature would bloat `FreeDraw` unnecessarily, whilst diverging from `FreeDraw`'s original purpose for allowing geospatial queries.

![L.Pather Screenshot](http://i.imgur.com/J9ndW0y.jpg)

---

# Getting Started

`L.Pather` behaves as a typical Leaflet module, and can therefore be added with the `addLayer` method:

```javascript
var pather = new L.Pather();
map.addLayer(pather);
```

You'll likely want to add the above in two lines as shown, because with the `pather` instance you can do some wonderful things &ndash; such as when a user creates or edits a polyline:

```javascript
pather.on('created', this.created);
pather.on('edited', this.edited);
pather.on('deleted', this.deleted);
```

Polylines are created using the mouse, but you may also add polylines manually by supplying an array of `L.LatLng` objects:

```javascript
var polyline = pather.createPath([new L.LatLng(51.23, -0.15), new L.LatLng(51.45, -0.17)]);
```

Using the `polyline` instance, which would resolve to `L.Pather.Polyline` you can invoke many more methods. Although perhaps the most common would be to use it in the deletion process of your polyline:

```javascript
pather.removePath(polyline);
```