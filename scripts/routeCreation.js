//routeCreation.js

/**
 * Driver function for calculating directions with Google Maps.
 * Retrieves all required values from the Menu Form and then packages them up to
 * get directions using the Google Maps DirectionsService
 * @callback modelCreationCB Callback function to start parsing the entered model
 * @param {ModelSimulator} simulator The simulator to create a route for
 */
function routeCreationDriver(modelCreationCB, simulator) {

	var wasCustomRouteEntered = customItemEntered($("#route"));

	var errorDiv;
	var errorDivTxt;
	
	if(wasCustomRouteEntered) {
		errorDiv = $("#customRouteError");
		errorDivTxt = $("#customRouteError_zeroResults");
	}
	else {
		errorDiv = $("#noRouteSelected");
		errorDivTxt = $("#selectedRoute_zeroResults");
	}

	var routePoints = getEnteredRouteValues(new Object(), wasCustomRouteEntered);
	var transitType = determineTransitType();
	
	var directionsRequest = createDirectionsRequest(routePoints, transitType);
	
	getDirections(directionsRequest, errorDiv, errorDivTxt, modelCreationCB, simulator);
}

/**
 * Extract the From and To Destination Values from the Menu Form
 * @param {Object} routePoints An object to store the From and To values in
 * @param {boolean} wasCustomRouteEntered Whether or not a new custom route was entered by the user
 * @return {Object} The object storing the From and To values
 */
function getEnteredRouteValues(routePoints, wasCustomRouteEntered) {

	//If the user has selected to enter custom information, simply retrieve the entered values
	if(wasCustomRouteEntered) {
		routePoints.from = $("#customRouteFrom").val();
		routePoints.to = $("#customRouteTo").val();
	}
	/* If a route listed from the database is selected however the selected items value attribute
	 * must be tokenized into the From and To values */
	else
		routePoints = tokenizeRouteValue(routePoints, $("#route").val());
	
	return routePoints;	
}

/**
 * Tokenize a route into two separate values - a "From" Destination and a "To" Destination
 * @param {Object} routePoints An object to store the From and To values in
 * @param {String} route The string of route points to tokenize
 * @return {Object} The object storing the separated From and To values
 */
function tokenizeRouteValue(routePoints, route) {
	var routeTokens = route.split(";");
	
	/* Untokenized route values are not allowed to have semicolons in them unless put there by
	 * finalizeRouteMenuOptionData(). finalizeRouteMenuOptionData() sets the value attribute of
	 * a route HTML OptGroup Option Item to be two values separated by a semicolon.
	 *
	 * For custom routes, users are not allowed to enter semicolons as part of the Destination Name.
	 *
	 * As such, we can always assume there will be only one semicolon in the second argument passed to
	 * this function, and thus exactly two tokens will be returned from executing route.split() */
	
	routePoints.from = routeTokens[0];
	routePoints.to = routeTokens[1];
	
	return routePoints;
}

/**
 * Translate the Travel Method specified in the Menu form into its corresponding
 * entry in the google.maps.TravelMode object
 * @return {String} The Transit Type value retrieved from google.maps.TravelMode
 */
function determineTransitType() {

	var transitType;

	/* While we could simply specify the transit type string without having to access
	 * google.maps.TravelMode, in theory it is safer to let Google Maps define the transit type
	 * to prevent any theoretical anomalies that may arise now or in the future from hard coding the
	 * transit type ourselves. Such anomalies are however, as stated, purely theoretical. */
	
	if($("#method").val() == "driving")
		transitType = google.maps.TravelMode.DRIVING;
	else if($("#method").val() == "transit")
		transitType = google.maps.TravelMode.TRANSIT;
		
	return transitType;
}

/**
 * Create a Google Maps DirectionsRequest Object
 * @param {Object} routePoints An object containing at a minimum two attributes:
 * 	  {String} from The Destination a route will be calculated from
 *	  {String} to The Destination a route will be calculated to
 * @param {String} transitType The travel mode that will be used in calculation directions
 *				   between the origin and destination points
 * @return {DirectionsRequest} A Google Maps DirectionsRequest object containing the necessary
 *							   information needed to request directions for a route
 */
function createDirectionsRequest(routePoints, transitType) {

	var request = {
		origin: routePoints.from,
		destination: routePoints.to,
		travelMode: transitType
	}
	
	return request;
}

/**
 * Calculate Directions based on the data entered in the Menu Form
 * @param {DirectionsRequest} directionsRequest An object to be passed to the Google Maps
 *							  DirectionsService, containing all necessary information on
 *							  the route that is to be calculated
 * @param {Object} errorDiv A jQuery encapsulated HTML div tag, containing a set of potential error messages
 * @param {Object} errorDivTxt A jQuery encapsulated HTML div tag, containing the specific error message
 *				   to display
 * @callback modelCreationCB Callback function to start parsing the entered model
 * @param {ModelSimulator} simulator The simulator to create a route for
 */
function getDirections(directionsRequest, errorDiv, errorDivTxt, modelCreationCB, simulator) {

	var error = false;
	var directionsService = new google.maps.DirectionsService();
	
	directionsService.route(directionsRequest, function(result, status) {
		
		if(status == google.maps.DirectionsStatus.OK) {
			/* If checkHideShowError() were called once outside the if statement, any visible
			 * errors would not disappear until the route were completely parsed. So we instead
			 * call it twice - in "if" and "else" */
			checkHideShowError(errorDiv, errorDivTxt, error);
			
			drawRouteLine(result, simulator);
			
			simulator.trackModel(simulator.pathDetails[0].loc); //Set the initial camera position
			modelCreationCB(simulator);
		}
		else {
			error = true;
			checkHideShowError(errorDiv, errorDivTxt, error);
		}
	});
}

/**
 * Draw a Line on Google Earth using the data retrieved from the Google Maps DirectionsService
 * @param {DirectionsResult} directionsResult The result returned from the Google Maps DirectionsService,
 *							 containing all mapping information needed to perform further processing and
 *							 calculations for the route that has been requested to be drawn
 * @param {ModelSimulator} simulator The simulator to create a route for
 */
function drawRouteLine(directionsResult, simulator) {

	var directionsRoute = directionsResult.routes[0]; //There is only one DirectionsRoute unless the provideRouteAlternatives attribute of a DirectionsRequest is true - in this application this is never the case
	
	var kmlLineString = "<LineString><coordinates>\n";  //The opening tags for the KML Line String
	
	//For every DirectionsLeg (there will be 1 DirectionsLeg unless waypoints have been specified)
	for(var i = 0; i < directionsRoute.legs.length; i++) {

	    simulator.requiredTravelTime += directionsRoute.legs[i].duration.value; //Count the total duration of the route

		//And every DirectionsStep in every DirectionsLeg
		for(var j = 0; j < directionsRoute.legs[i].steps.length; j++) {
		
			//And every LatLng in every DirectionsStep in every DirectionsLeg
			for(var k = 0; k < directionsRoute.legs[i].steps[j].path.length; k++) {	
				
				//Get the current latitude and longitude
				
				var currentLongitude = directionsRoute.legs[i].steps[j].path[k].lng();
				var currentLatitude = directionsRoute.legs[i].steps[j].path[k].lat();
				
				//And add them to the kmlLineString using the appropriate syntax
				kmlLineString += appendToKmlLineString(currentLongitude, currentLatitude);
				
				determineAdditionalPathDetails(directionsRoute.legs[i].steps[j], j, k, simulator);
			}
		}
	}
	
	kmlLineString += "</coordinates></LineString>"; //The closing tags for the KML Line String
	
	appendKmlLineStringToEarth(kmlLineString, simulator);
}

/**
 * Add a new coordinate to a KML Line String
 * @param {String} longitude The longitude for the coordinate to add
 * @param {String} latitude The latitude for the coordinate to add
 * @return {String} The text to be added to a KML Line String
 */
function appendToKmlLineString(longitude, latitude) {

	var nextKmlLineStringEntry = longitude + "," + latitude + ",10\n";
	
	return nextKmlLineStringEntry;
}

/**
 * Append a KML Line String to the Google Earth Instance
 * @param {String} kmlLineString A KML Line String comprised of all the necessary information needed to create
 *				   a KmlObject
 * @param {ModelSimulator} simulator The simulator to create a route for
 */
function appendKmlLineStringToEarth(kmlLineString, simulator) {

	var parsedKmlLineString = ge.parseKml(kmlLineString); //Built a KmlObject from the kmlLineString
	
	simulator.lineStringPlacemark = ge.createPlacemark(''); //Create a KmlPlacemark to be placed on Google Earth
	simulator.lineStringPlacemark.setGeometry(parsedKmlLineString); //Associate the KmlObject with the KmlPlacemark
	
	simulator.lineStringPlacemark.setStyleSelector(
		ModelSimulator.geHelper.createLineStyle(
			{
				width: 10,
				color: '88F07814'
			}
		)
	);
	
	ge.getFeatures().appendChild(simulator.lineStringPlacemark); //Add the KmlPlacemark to Google Earth
}

/**
 * Driver function for calculating additional information (including the distance and time duration) 
 * between each coordinate in the entire DirectionsRoute
 * @param {DirectionsStep} currentStep The current step of a DirectionsLeg
 * @param {number} currentStepIndex The index of the step in the current DirectionsLeg
 * @param {number} currentCoordIndex The index of the current coordinate being processed in the currentStep
 * @param {ModelSimulator} simulator The simulator to create a route for
 */
function determineAdditionalPathDetails(currentStep, currentStepIndex, currentCoordIndex, simulator) {
	
	var stepDistance = currentStep.distance.value;
	var coord = currentStep.path[currentCoordIndex];
	
	var nextCoordDistance = calculatePathDetailsDistance(currentStep, coord, currentCoordIndex);
	var timeToNextCoord = calculatePathDetailsDuration(currentStep, nextCoordDistance, stepDistance);
	
	addToPathDetails(coord, currentStepIndex, nextCoordDistance, timeToNextCoord, simulator);
}

/**
 * Determine the distance from one coordinate to the next in a DirectionsStep
 * @param {DirectionsStep} currentStep The current step of a DirectionsLeg
 * @param {LatLng} coord A coordinate in the currentStep
 * @param {number} coordIndex The index of coord in the currentStep
 */
function calculatePathDetailsDistance(currentStep, coord, coordIndex) {
	
	var numCoordsInStep = currentStep.path.length;
	var distance;
	
	/* If there are no more coordinates in the currentStep, the distance to the next one is zero.
	 * However, as all steps but the last one share their last coordinate with the first coordinate of the next step
	 * (the last step only shares its _first_ coordinate with the _last_ coordinate of the _previous step_), the
	 * distance from the current coordinate to the next unique coordinate will be determined when the next step is
	 * processed (assuming a next step exists).
	 *
	 * Since the last coordinate of a step usually matches the first coordinate of
	 * the next step, the distance between these coordinates is 0 */
	if(coordIndex == numCoordsInStep - 1)
		distance = 0;
	else
		distance = ModelSimulator.geHelper.distance(coord, currentStep.path[coordIndex + 1]); //Get the distance between the current coordinate and the next one
	
	return distance;
}

/**
 * Calculate the time duration that would be taken to travel from the current coordinate to the next
 * @param {DirectionsStep} currentStep The current step of a DirectionsLeg
 * @param {number} nextCoordDistance The distance (in meters) from the current coordinate in
 *				   currentStep to the next
 * @param {number} stepDistance The distance (in meters) of currentStep
 * @return {number} The time taken (in seconds) to travel from the current coordinate in currentStep
 *					to the next
 */
function calculatePathDetailsDuration(currentStep, nextCoordDistance, stepDistance) {
	
	var duration = currentStep.duration.value * nextCoordDistance / stepDistance;
	
	return duration;
}

/**
 * Create an array entry listing the time and distance between one coordinate and the next
 * @param {LatLng} coord A coordinate with a latitude and a longitude
 * @param {number} currentStepIndex The index of the step in the current DirectionsLeg
 * @param {number} nextCoordDistance The distance (in meters) from the current coordinate (coord) in
 *				   a DirectionsStep to the next
 * @return {number} The time taken (in seconds) to travel from the current coordinate (coord) in
 *					a DirectionsStep to the next
 * @param {ModelSimulator} simulator The simulator to create a route for
 */
function addToPathDetails(coord, currentStepIndex, nextCoordDistance, timeToNextCoord, simulator) {
	
	simulator.pathDetails.push({
		loc: coord,
		step: currentStepIndex,
		distance: nextCoordDistance,
		duration: timeToNextCoord
	});
}