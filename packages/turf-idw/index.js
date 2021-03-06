var filter = require('turf-filter');
var distance = require('turf-distance');
var squareGrid = require('turf-square-grid');
var centroid = require('turf-centroid');
var extent = require('turf-extent');

/**
 *
 * Takes a FeatureCollection of points with known value, a power parameter, a cell depth, a unit of measurement
 * and returns a FeatureCollection of polygons in a square-grid with an interpolated value property "IDW" for each grid cell.
 * It finds application when in need of creating a continuous surface (i.e. rainfall, temperature, chemical dispersion surface...)
 * from a set of spatially scattered points.
 *
 * @param  {FeatureCollection<Point>} controlPoints Sampled points with known value
 * @param  {String} valueField    GeoJSON field containing the known value to interpolate on
 * @param  {Number} b             Exponent regulating the distance-decay weighting
 * @param  {Number} cellWidth     The distance across each cell
 * @param  {String} units         Units to use for cellWidth ('miles' or 'kilometers')
 * @return {FeatureCollection<Polygon>} grid A grid of polygons with a property field "IDW"
 */
module.exports = function (controlPoints, valueField, b, cellWidth, units) {
    // check if field containing data exists..
    var filtered = filter(controlPoints, valueField);
    //alternative method
    // console.log(controlPoints.features.map(function (feat) { return valueField in feat.properties}));
    if (filtered.features.length === 0) {
      // create a sample square grid
      // compared to a point grid helps visualizing the output (like a raster..)
        var samplingGrid = squareGrid(extent(controlPoints), cellWidth, units);
        var N = samplingGrid.features.length;
        // for every sampling point..
        var myFun = function (point, i, zw, sw) {
            var d = distance(centroid(samplingGrid.features[i]), point, units);
            if (d === 0) {
                zw = point.properties[valueField];
                return zw;
            }
            var w = 1.0 / Math.pow(d, b);
            sw += w;
            zw += w * point.properties[valueField];
        };
        for (var i = 0; i < N; i++) {
            var zw = 0;
            var sw = 0;
            // calculate the distance from each control point to cell's centroid
            controlPoints.features.map(myFun);
            // write IDW value for each grid cell
            samplingGrid.features[i].properties.z = zw / sw;
        }
        return samplingGrid;

    } else {
        console.log('Specified Data Field is Missing');
    }

};
