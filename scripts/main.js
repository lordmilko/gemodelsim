//main.js

/**
 * The Google Earth Plugin Instance Object
 * All functionality is provided by interacting with the GE Instance
 * @type {GEPlugin}
 */
var ge;

/**
 * Load the required API Libraries from the Google API Loader
 * @param {string} The library to load
 * @param {string} The library version number
 * @param {Object?} Optional parameters
 */
google.load("earth", "1");
google.load("maps", "3", {other_params: "sensor=false"}); //Google Maps v3 requires you explicitly state whether or not you will be using a location sensor enabled device

/* Wait until the entire page/APIs have been loaded, and the DOM has been completely built up before initializing the Google Earth Plugin Instance */
google.setOnLoadCallback(init);

/**
 * Initialize an instance of the Google Earth Plugin
 */
function init() {
	/**
	 * @param {string} googleEarthPlugin a HTML div element with a unique ID
	 * @callback initCB the callback function to run if instance creation is successful
	 * @callback failureCB the callback function to run if instance creation is unsuccessful
	 */
	google.earth.createInstance("googleEarthPlugin", initCB, failureCB);
}

/**
 * The callback function run if GEPlugin Instance creation is successful
 * @param {GEPlugin} instance The Google Earth Instance Object, returned when
 * 		  			 google.earth.createInstance() calls the initCB
 *					 callback function
 */
function initCB(instance) {
	ge = instance; //Assign the GEPlugin object to our global variable
	
	preGEInitializationTasks();
	
	ge.getWindow().setVisibility(true); //Make the Google Earth Plugin visible inside its div
	
	/* Draw the various Layers relevant to the Simulation application */
	ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, true); //Country/Area Borders, City/State/Country/Ocean/etc Labels
	ge.getLayerRoot().enableLayerById(ge.LAYER_ROADS, true); //Roads and Road Names
	ge.getLayerRoot().enableLayerById(ge.LAYER_BUILDINGS, true); //3D Buildings (where available)
	ge.getLayerRoot().enableLayerById(ge.LAYER_TERRAIN, true); //3D Terrain (where available)
	ge.getLayerRoot().enableLayerById(ge.LAYER_TREES, true); //3D Tree Models (where available)
	
	postGEInitializationTasks();
}

/**
 * The callback function run if GEPlugin Instance creation was unsuccessful
 */
function failureCB() { }

/**
 * Tasks that must be performed before the Google Earth Plugin is initialized
 */
function preGEInitializationTasks() {
    /* Create an event handler for the window resizing, and set the initial GEPlugin div size */
    resizeTracker();
    setGEDivSize();

    //Set the initial position of the Progress Overlay
    setProgressOverlayPosition();

    //Add an event handler for changing the Menu Icon on mouse over/off
    changeMenuIcon();

    //Create Menu jQuery UI Sliders
    createSliders();
}

/**
 * Tasks that are performed after the Google Earth Plugin is initialized
 */
function postGEInitializationTasks() {
    //An object with helpful methods for calculating various values and modifying properties of placemarks
    ModelSimulator.geHelper = new GEHelpers(ge);

    //Save the initial Fly To Speed so it can be restored (if desired) after a simulation has completed
    initialFlyToSpeed = ge.getOptions().getFlyToSpeed();

    populateMenuLists();
    enableMenu();
}

/**
 * Create an event handler to be bound to the JavaScript resize event.
 * Whenever the window is resized, the GEPlugin div will be resized too
 */
function resizeTracker() {
	$(window).resize(function() {
	    setGEDivSize();
	    setProgressOverlayPosition();
	});
}

/**
 * Set the height and width of the GEPlugin div to be the current size
 * of the window's viewpoort (the area in which HTML content can be placed)
 */
function setGEDivSize() {
	$("#googleEarthPlugin").height(verge.viewportH());
	$("#googleEarthPlugin").width(verge.viewportW());
}

/**
 * Center the "Processing in Progress" Overlay on the page
 */
function setProgressOverlayPosition() {

    var overlayWidth = $("#progressWrapper").width();
    var overlayHeight = $("#progressWrapper").height();

    var windowWidth = verge.viewportW();
    var windowHeight = verge.viewportH();
    
    var sideDistance = (windowWidth - overlayWidth) / 2;
    var topDistance = (windowHeight - overlayHeight) / 2;

    $("#progressOverlay").css("left", sideDistance + "px");
    $("#progressOverlay").css("top", topDistance + "px");
}

/**
 * Bind functions to the the on mouse over ("mouseenter") and on mouse off ("mouseleave") jQuery event handlers
 */
function changeMenuIcon() {
    //.hover() quickly and easily binds the handlers for both mouseenter and mouseleave
    $("#menuURL").hover(function () {
        $("#menuIcon").css("background-image", "url('img/menuhover.png')");
    },
    function () {
        $("#menuIcon").css("background-image", "url('img/menu.png')");
    });
}

/**
 * Create a new KmlLookAt - a position for the camera to be facing in Google Earth
 * @param {number} latitude The latitude for the LookAt to be pointing at
 * @param {number} longitude The longitude for the LookAt to be pointing at
 * @param {number} altitude The distance from the earth's surface, in meters
 * @param {KmlAltitudeModeEnum} altitudeMode How the altitude is to be interpreted; e.g. relative to the ground, relative to the sea floor, etc
 * @param {number} heading The direction for the LookAt to be facing - i.e. North South East or West. Value is in degrees (0 - 360)
 * @param {number} tilt The angle the LookAt is facing up or down; 0 - 90 degrees
 * @param {number} range The distance in meters (from the point specified by the latitude, longitude and altitude) for the LookAt to be situated at
 */
function createAndSetNewLookAt(latitude, longitude, altitude, altitudeMode, heading, tilt, range) {
	
	var lookAt = ge.createLookAt('');
	
	lookAt.set(latitude, longitude, altitude, altitudeMode, heading, tilt, range);
	
	ge.getView().setAbstractView(lookAt);
}

/**
 * Add a function to the String Object to capitalize the first letter of every word in a string
 * Originally written by disfated, September 29, 2011
 * Retrieved on 5/10/13 from http://stackoverflow.com/questions/2332811/capitalize-words-in-string
 */
String.prototype.capitalize = function() {
	return this.replace(/(?:^|\s)\S/g,
		function(a) {
			return a.toUpperCase();
		}
	);
}