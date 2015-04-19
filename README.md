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

![L.Pather Screenshot](http://i.imgur.com/Hvhh8KL.png)

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
var polyline = pather.createPath(LatLng[]);
```

Using the `polyline` instance, which would resolve to `L.Pather.Polyline` you can invoke many more methods. Although perhaps the most common would be to use it in the deletion process of your polyline:

```javascript
pather.removePath(polyline);
```

# Mode

For `L.Pather` you can set the mode using the `pather.setMode` method. There are a handful of modes:

* `L.Pather.MODE.CREATE` &ndash; Map is not draggable when creating a path;
* `L.Pather.MODE.EDIT` &ndash; Edit the polyline by dragging the handles;
* `L.Pather.MODE.APPEND` &ndash; Click on the polyline to add new elbows to the path;
* `L.Pather.MODE.DELETE` &ndash; Click on the polyline to delete the path;

Since both `L.Pather.MODE.APPEND` and `L.Pather.MODE.DELETE` involve the same `click` event, `L.Pather.MODE.APPEND` takes precedence. Therefore to delete a path when it is clicked on, you **must** have the `L.Pather.MODE.APPEND` mode disabled:

```javascript
pather.setMode(pather.getMode() ^ L.Pather.MODE.APPEND);
```

# Classes

Class names on the Leaflet container will contain the class names that resolve to the current mode. For example, if modes `L.Pather.MODE.APPEND` and `L.Pather.MODE.CREATE` are currently active, then the map container will have the following two class names:

```html
<map class="... mode-create mode-append"></map>
```

By having the class names reflect the current mode, it allows you to respond via your CSS documents. In the case of [the example on Heroku.com](https://pather.herokuapp.com) we colour the path handles when you have selected the `L.Pather.MODE.EDIT` mode &ndash; note the `mode-edit` class reference:

```css
section.map.mode-edit div.elbow {
    cursor: move;
    pointer-events: all;
    background-color: rebeccapurple;
}
```

# Options

For a list of up-to-date options it is better to refer to the `defaultOptions` method of the [`Pather.js` file](https://github.com/Wildhoney/L.Pather/blob/master/module/Pather.js). All of the options can be overridden during instantiation of the `L.Pather` object, including the `smoothFactor` which determines how much to simplify the rendered path:

```javascript
var pather = new L.Pather({
    strokeWidth: 1,
    smoothFactor: 5,
    moduleClass: 'leaflet-pather',
    mode: L.Pather.MODE.CREATE | L.Pather.MODE.EDIT,
    pathColour: 'rebeccapurple'
});
```

You may also modify the options after instantiation by invoking the `setOptions` method with your object of defined options:

```javascript
pather.setOptions({ pathColour: 'orange' });
```

**Note:** In defining the options, `L.Pather` uses ES6's [`Object.assign`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) which is polyfilled using the [MDN's polyfill](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill) if your browser doesn't currently support it.