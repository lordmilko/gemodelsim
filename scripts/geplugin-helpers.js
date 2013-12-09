// DEPRECATED:
//   see http://code.google.com/p/earth-api-utility-library

// geplugin-helpers.js
// requires math3d.js

/*
Copyright 2008 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * @fileoverview This file provides a very basic Google Earth plugin helpers
 * library called GEHelpers
 * @author Roman Nurik
 * @supported Tested in IE6+ and FF2+
 */

/**
 * Preliminary/very basic Google Earth plugin helpers library
 * @param {GEPlugin} ge Google Earth instance
 * @constructor
 */
function GEHelpers(ge) {
  this.ge = ge;
}

/**
 * Creates a point placemark at the given location
 * @param {google.maps.LatLng} loc Location of the point placemark
 * @param {Object?} opt_opts Options object, with the following fields:
 *   {string} id The placemark ID in the Earth object model
 *   {string} name The placemark name
 *   {string} description The placemark description
 *   {string} standardIcon The name of a standard KML icon (i.e. 'red-circle')
 *   {string} icon The URL of the placemark's icon
 * @return {KmlPlacemark} The created placemark
 */
GEHelpers.prototype.createPointPlacemark = function(loc, opt_opts) {
  var placemark = this.ge.createPlacemark(opt_opts.id ? opt_opts.id : '');
  
  if (opt_opts.name)
    placemark.setName(opt_opts.name);
  
  if (opt_opts.description)
    placemark.setDescription(opt_opts.description);
  
  // Create style map for placemark
  if (opt_opts.standardIcon && !opt_opts.icon)
    opt_opts.icon = 'http://maps.google.com/mapfiles/kml/paddle/' +
                    opt_opts.standardIcon + '.png';
  
  if (opt_opts.icon) {
    var icon = this.ge.createIcon('');
    icon.setHref(opt_opts.icon);
    
    var iconStyle = this.ge.createStyle('');
    iconStyle.getIconStyle().setIcon(icon);
    
    var styleMap = this.ge.createStyleMap('');
    styleMap.setNormalStyle(iconStyle);
    styleMap.setHighlightStyle(iconStyle);
    placemark.setStyleSelector(styleMap);
  }
  
  var point = this.ge.createPoint('');
  point.setLatitude(loc.lat());
  point.setLongitude(loc.lng());
  placemark.setGeometry(point);
  
  this.ge.getFeatures().appendChild(placemark);
  return placemark;
}

/**
 * Clears all features in the plugin object model
 */
GEHelpers.prototype.clearFeatures = function() {
  var features = this.ge.getFeatures();
  var c;
  while (c = features.getLastChild())
    features.removeChild(c);
}

/**
 * Removes the feature with the given ID from the plugin object model
 * @param {string} id The ID of the feature to remove
 */
GEHelpers.prototype.removeFeature = function(id) {
  var features = this.ge.getFeatures();
  var c = features.getFirstChild();
  while (c) {
    if (c.getId() == id) {
      features.removeChild(c);
      break;
    }
    
    c = c.getNextSibling();
  }
}

/**
 * Creates a KmlStyle containing a line style with the given options
 * @param {Object?} opt_opts LineStyle parameters described by the fields:
 *   {number} width The line width
 *   {color} color The line color in KML's 'aabbggrr' format
 * @return {KmlStyle} The created KmlStyle with the given line style parameters
 */
GEHelpers.prototype.createLineStyle = function(opt_opts) {
  var style = this.ge.createStyle('');
  var lineStyle = style.getLineStyle();
  if (opt_opts.width)
    lineStyle.setWidth(opt_opts.width);
  if (opt_opts.color)
    lineStyle.getColor().set(opt_opts.color);
  return style;
}

/**
 * Calculates the heading/bearing between two locations. Taken from the formula
 * provided at http://mathforum.org/library/drmath/view/55417.html
 * @param {google.maps.LatLng} loc1 The start location
 * @param {google.maps.LatLng} loc2 The destination location
 * @return {number} The heading from loc1 to loc2, in degrees
 */
GEHelpers.prototype.getHeading = function(loc1, loc2) {
  lat1 = this.deg2rad(loc1.lat());
  lon1 = this.deg2rad(loc1.lng());
  
  lat2 = this.deg2rad(loc2.lat());
  lon2 = this.deg2rad(loc2.lng());
  
  var heading = this.fixAngle(this.rad2deg(Math.atan2(
    Math.sin(lon2 - lon1) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) *
      Math.cos(lon2 - lon1))));
  
  return heading;
}

/**
 * Converts radians to degrees
 * @param {number} r Radians
 * @return {number} Degrees
 */
GEHelpers.prototype.rad2deg = function(r) {
  return r * 180.0 / Math.PI;
}

/**
 * Converts degrees to radians
 * @param {number} d Degrees
 * @return {number} Radians
 */
GEHelpers.prototype.deg2rad = function(d) {
  return d * Math.PI / 180.0;
}

// Keep an angle in [-180,180]
/**
 * Keep an angle in the [-180, 180] range
 * @param {number} a Angle in degrees
 * @return {number} The angle in the [-180, 180] degree range
 */
GEHelpers.prototype.fixAngle = function(a) {
  while (a < -180)
    a += 360;
  
  while (a > 180)
    a -= 360;
  
  return a;
}

/**
 * Calculates an intermediate lat/lon, (100 * f)% between loc1 and loc2
 * @param {google.maps.LatLng} loc1 The start location
 * @param {google.maps.LatLng} loc2 The end location
 * @return {google.maps.LatLng} An intermediate location between loc1 and loc2
 */
GEHelpers.prototype.interpolateLoc = function(loc1, loc2, f) {
  //return new GLatLng( //Google Maps v2
	return new google.maps.LatLng(
    loc1.lat() + f * (loc2.lat() - loc1.lat()),
    loc1.lng() + f * (loc2.lng() - loc1.lng()));
}

/**
 * Gets the earth distance between two locations, factoring in ground altitudes
 * provided by the associated Google Earth plugin instance
 * @param {google.maps.LatLng} loc1 The first location
 * @param {google.maps.LatLng} loc2 The second location
 * @return {number} The distance from loc1 to loc2, in meters
 */
GEHelpers.prototype.distance = function(loc1, loc2) {
  p1 = V3.latLonAltToCartesian([loc1.lat(), loc1.lng(),
    this.ge.getGlobe().getGroundAltitude(loc1.lat(), loc1.lng())]);
  p2 = V3.latLonAltToCartesian([loc2.lat(), loc2.lng(),
    this.ge.getGlobe().getGroundAltitude(loc2.lat(), loc2.lng())]);
  return V3.earthDistance(p1, p2);
}
