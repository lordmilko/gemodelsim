//database.js

/**
 * Whether an error has been encountered in loading data from or otherwise connecting to the database
 * @type {boolean}
 */
var dbError = false;

/**
 * Retry any failed database connections
 */
function retryConnection() {
	//Reset the dbError global variable to its default state. If an error is encountered, dbError will again become true
	dbError = false;
	checkHideShowError($("#noDB"), $("#noDBTxt"), dbError);
	
	populateMenuLists();
}

/**
 * Driver function for populating the Menu Drop-Down Lists
 */
function populateMenuLists() {

	var routeDataDBRequestURL = "php/populateMenuRoutes.php";
	var modelDataDBRequestURL = "php/populateMenuModels.php";
	
	getDBJSONData(parseRouteJSONData, routeDataDBRequestURL);
	getDBJSONData(parseModelJSONData, modelDataDBRequestURL);
}

/**
 * Retrieve JSON data via an AJAX request to a specified URL.
 * Process the retrieved data in an appropriate manner outlined in a callback function
 * @callback dataParserCallBack A function to parse the retrieved data in an appropriate manner
 * @param {String} url The URL to perform an AJAX request upon
 */
function getDBJSONData(dataParserCallBack, url) {

	$.getJSON(url, function(data) {
		dataParserCallBack(data);
	})
	.fail(function() {
		
		//As multiple AJAX requests can be made in a row, only display an error the first time a request fails
		if(!dbError) {
			dbError = true;
			checkHideShowError($("#noDB"), $("#noDBTxt"), dbError);
		}
	});
}

/**
 * A callback function for parsing JSON formatted Route Data
 * @param {Object} data A JSON object containing all necessary Route Data
 */
var parseRouteJSONData = function(data) {

	var previousRecord;
	var startEndLocation; //A string to hold the start and end locations of a given route/journey
	var currentJourney = 0;

	//For each row of data returned in the JSON object, determine the points at which a given route/journey starts and begins, then create a new item under the appropriate optgroup in one of the Menu's Drop-Down Lists
	$.each(data, function(index, dbRecord) {
	
		startEndLocation = getStartEndLocation(index, dbRecord, previousRecord, currentJourney, startEndLocation, data.length)

		/* If the JourneyID in the next dbRecord is different to the JourneyID in the current dbRecord, this means
		 * the Journey that the current record was a part of has completed. In which case, getStartEndLocation() will
		 * finish off the previous Drop-Down List Option Item being created using the information stored in previousRecord,
		 * then start over for the next Journey using the data from the value of dbRecord on the next iteration */
		previousRecord = dbRecord;

		//If the JourneyID of the current journey does not match that of the JourneyID in the row being processed, update currentJourney to be the value of this row's JourneyID
		currentJourney = checkUpdateCurrentJourney(previousRecord, dbRecord["JourneyID"]);	
	});
}

/**
 * A callback function for parsing JSON formatted Model Data
 * @param {Object} data A JSON object containing all necessary Model Data
 */
var parseModelJSONData = function(data) {

	var menuSection = "model";
	var optGroup;
	var optVal;
	var optText;

	//Each row of data encapsulated in the JSON object contains a single model record from the database. Cycle through each row and add each model to its appropriate optGroup
	$.each(data, function(index, dbRecord) {
	
		optGroup = determineMenuItemOptGroup(dbRecord["Type"], menuSection)
		optVal = dbRecord["URL"];
		optText = dbRecord["Name"];
		
		addToOptGroup(optGroup, optVal, optText);
	});
}

/**
 * Determine whether or not to update the JourneyID stored in currentJourney
 * @param {String} currentJourney The JourneyID of the current Journey, derived from the previous dbRecord row analysed
 * @param {String} nextJourney The JourneyID of the nextJourney, derived from the current dbRecord row being analysed
 * @return {String} The value of currentJourney - now equal to nextJourney if we're on to the next journey, or the initial value
 *                  of current journey that was sent to this function if the journey we're on hasn't changed
 */
function checkUpdateCurrentJourney(currentJourney, nextJourney) {

	//If the JourneyID's don't match, update currentJourney to be that of the new current journey
	if(currentJourney != nextJourney)
		currentJourney = nextJourney
	
	return currentJourney
}

/**
 * Driver function for determining the start and end location to be used for an unspecified series of points
 * that comprise a Journey.
 *
 * In this application there are two points - the start and the finish. However, in the future you cannot assume this will be
 * the case. There could be any number of intermediate points ("waypoints"). As such, instead of assuming "the first point is the start",
 * "the second point is the end" we programatically ascertain which point is the start point (still the first one) and which one is the end (could be
 * the second, fourth, or twentieth!)
 * @param {number} index The index of the current dbRecord row being analysed
 * @param {Object} currentJourney A JSON object holding the current row of data being parsed in parseModelJSONData()
 * @param {Object} previousJourney A JSON object holding the previous row of data that was parsed in parseModelJSONData()
 * @param {number} journeyIndex The index of the current Journey being parsed in parseModelJSONData()
 * @param {String} startEndLocation The components of the start and end location for the journey that have been
 *				   determined so far. At most only contains the start location for a journey when it enters and leaves
 *  			   getStartEndLocation() (typically gets overwritten with the startLocation of the next Journey after the
 *				   end location has been determined (end location is determined in this function))
 * @param {number} totalNumRecords The total number of database record rows that are contained in the entire JSON AJAX
 *				   response
 * @return {String} The start location for the next journey (or the last one that was processed if there are no more
 *					rows in the AJAX response)
 */
function getStartEndLocation(index, currentJourney, previousJourney, journeyIndex, startEndLocation, totalNumRecords) {

	//When a new journey is encountered, finalize the processing of the previous journey's data and start the processing of the next journey
	if(journeyIndex != currentJourney["JourneyID"]) {
		
		//If this is the first row being analysed, there is no need to finalize the previous journey (as no such journey exists)
		if(index != 0) {
			finalizeRouteMenuOptionData(previousJourney, startEndLocation);			
		}
		
		//Get the start location for the next journey
		
		var startLocation = useNameOrCoordinates(currentJourney);
		startEndLocation = startLocation; //Overwrite the previous Journey's data with that of the current one
	}
	
	//If this is the last row being processed, the journey's data also needs to be finalized (otherwise its Drop-Down List item would not be created)
	if(index == totalNumRecords - 1) {
		finalizeRouteMenuOptionData(currentJourney, startEndLocation);
	}

	return startEndLocation;
}

/**
 * Determine the end location for the journey and all necessary data for creating the Option Item
 * @param {Object} dbRecord A JSON object holding the data of the final row in a journey
 * @param {String} startLocation All text that has been identified as being part of this Option Item's Text component so far
 *				   (just the route start location)
 */
function finalizeRouteMenuOptionData(dbRecord, startLocation) {

	var menuSection = "route";
	var endLocation = useNameOrCoordinates(dbRecord);
	
	var optGroup = determineMenuItemOptGroup(dbRecord["Type"], menuSection);
	
	setRouteOptGroupValAndText(startLocation, endLocation, optGroup);
}

/**
 * Set the value and text components for a new OptGroup Item, then add it to the desired OptGroup
 * @param {String} startLocation The text the Drop-Down List's text and value components will start with
 * @param {String} endLocation The text the Drop Down List's text and value components will end with
 * @param {Object} optgroup A jQuery encapsulated HTML optgroup tag, indicating the optgroup to add a new Option to
 */
function setRouteOptGroupValAndText(startLocation, endLocation, optGroup) {
	var optVal = startLocation + ";" + endLocation;
	var optText = startLocation + " to " + endLocation;
	
	addToOptGroup(optGroup, optVal, optText);
}

/**
 * Determine whether or not to use a JSON object's "Name" attribute or "Coordinates" attribute.
 * @param {Object} journey A JSON Object containing at a minimum a "Name" attribute and a "Coordinates" attribute
 * @return {String} The value of the "Name" or "Coordinates" attribute that will be used to represent a
 *					location
 */
function useNameOrCoordinates(journey) {
	
	var location;
	
	//Always use the "Name" attribute if it is defined; otherwise use the "Coordinates" attribute
	if(journey["Name"] == null)
		location = journey["Coordinates"];
	else
		location = journey["Name"];
		
	return location;
}

/***************************************** Add New Custom Items *****************************************/

/**
 * Driver function for adding a new Custom Route and Model to their respective Drop-Down Lists, as well as to the Database
 * @param {ModelSimulator} simulator The simulator whose Route and Model used is to be added to the Drop-Down Lists and Database
 */
function addNewCustomRouteAndModel(simulator) {
	
	/* If a New Custom Model has been entered, the server will return the ID of the Model if it already exists, or the ID of the Model if it must be inserted.
	 * If a New Custom Model hasn't been given, the ID of the Model will be undefined. It will need to be determined by the server when
	 * we attempt to insert the New Custom Route. The modelURL (along with the Type - here "Custom") functionally determines a given Model and therefore its Model ID */
	var modelURL = simulator.modelURL;
	
	var travelMethod = getTravelMethodID($("#method").val());
	
	/* The insertion of the Route data is dependent on the results of the insertion of the Model data.
	 * AJAX calls are made asynchronously however, meaning that it cannot be guaranteed the Model
	 * insertion query will be finished before the Route insertion query begins.
	 * Therefore the insertion of the Route data is wrapped in a callback function to be executed upon the
	 * successful completion of the Model insertion query. */
	var addRoute = function(modelID) {
		addNewCustomRoute(modelURL, travelMethod, modelID);
	}
	
	addNewCustomModel(modelURL, travelMethod, addRoute);
}

/**
 * Driver function for adding a Custom Route to the Drop-Down Lists and Database
 * @param {String} modelURL The URL of the Custom Model used
 * @param {number} travelMethod The ID of the Travel Method that was used to travel along the Route
 * @param {number} modelID The ID of the Model in the Database that was used to travel along the Route
 */
function addNewCustomRoute(modelURL, travelMethod, modelID) {
	
	var routeType = "Custom";
	var maxCustomItems = 5;
	var menuSection = "route";
	
	//Check the user has selected to enter a New Cusrom Route
	if(customItemEntered($("#route"))) {
		
		var startLocation = $("#customRouteFrom").val().capitalize();
		var endLocation = $("#customRouteTo").val().capitalize();
		var optGroup = determineMenuItemOptGroup(routeType, menuSection);

		setRouteOptGroupValAndText(startLocation, endLocation, optGroup);
		addNewCustomRouteToDatabase(startLocation, endLocation, routeType, travelMethod, modelID, modelURL);
		
		var removeOldRoutesCB = function(ddlVal) {
			routePoints = tokenizeRouteValue(new Object(), ddlVal)
			removeOldCustomRoutesFromDB(routePoints.from, routePoints.to);
		};
		
		removeOldCustomOptEntries(optGroup, maxCustomItems, removeOldRoutesCB);
	}
}

/**
 * Prepare the information to be sent in an AJAX request, attempting to inserting the New Custom Route details to the Database
 * @param {String} startLocation The location the Route starts at
 * @param {String} endLocation The location the Route ends at
 * @param {String} routeType The type of route that will be inserted, i.e. "Builtin" or "Custom"
 * @param {number} travelMethod The ID of the Travel Method that was used to travel along the Route
 * @param {number} modelID The ID of the Model in the Database that was used to travel along the Route. Value undefined if New Custom Model was not used
 * @param {String} modelURL The URL of the Custom Model that was used
 */
function addNewCustomRouteToDatabase(startLocation, endLocation, routeType, travelMethod, modelID, modelURL) {
	
	var newCustomRoute = new Object();
	
	newCustomRoute.startLocation = startLocation;
	newCustomRoute.endLocation = endLocation;
	newCustomRoute.type = routeType;
	
	newCustomRoute.modelID = modelID;
	newCustomRoute.methodID = travelMethod;
	newCustomRoute.modelURL = modelURL;
	
	var ajaxURL = "php/insertNewCustomRoute.php";
	var ajaxData = { "newCustomRoute" : newCustomRoute };
	
	executeAJAXRequest(ajaxURL, ajaxData, function(returnMsg){});
}

/**
 * Driver function for adding a Custom Model to the Drop-Down Lists and Database
 * @param {String} modelURL The URL of the Custom Model used
 * @param {number} travelMethod The ID of the Travel Method that was used to travel along the Route
 * @callback addRouteCB The driver function for adding the Route data to the Drop-Down Lists and database
 */
function addNewCustomModel(modelURL, travelMethod, addRouteCB) {

	var modelType = "Custom";
	var maxCustomItems = 5;
	var modelName;
	var menuSection = "model";
			
	//Check the user has selected to enter a New Custom Model
	if(customItemEntered($("#model"))) {
	
		modelName = getModelName(modelURL);
		
		var optGroup = determineMenuItemOptGroup(modelType, menuSection);

		addToOptGroup(optGroup, modelURL, modelName);

		addNewCustomModelToDatabase(modelName, modelURL, modelType, travelMethod, addRouteCB);
		
		removeOldCustomOptEntries(optGroup, maxCustomItems, removeOldCustomModelsFromDB);
	}
	//If not, the modelID cannot be immediately ascertained, and so the callback function should be executed immediately
	else {
	
		var modelID = "null";
	
		addRouteCB(modelID);
	}
}

/**
 * Execute an AJAX request to attempt inserting the New Custom Route details to the Database
 * @param {String} modelName The name that will be used for the Custom Model
 * @param {String} modelURL The URL of the Custom Model used
 * @param {String} modelType The type of model that will be inserted, i.e. "Builtin" or "Custom"
 * @param {number} travelMethod The ID of the Travel Method that was used to travel along the Route
 * @callback addRouteCB The driver function for adding the Route data to the Drop-Down Lists and database
 */
function addNewCustomModelToDatabase(modelName, modelURL, modelType, travelMethod, addRouteCB) {
	
	var newCustomModel = new Object();

	newCustomModel.name = modelName;
	newCustomModel.url = modelURL;
	newCustomModel.type = modelType;
	newCustomModel.methodID = travelMethod;
	
	var ajaxURL = "php/insertNewCustomModel.php";
	var ajaxData = { "newCustomModel" : newCustomModel };
	
	executeAJAXRequest(ajaxURL, ajaxData, addRouteCB);
}

/**
 * Calculate the name to use for the model from its URL
 * @param {String} modelURL The URL of the Custom Model used
 * @return {String} The model name that will be used
 */
function getModelName(modelURL) {

	var kmzExtension = ".kmz";
	var colladaExtension = ".dae";

	var lastForwardSlash = modelURL.lastIndexOf("/");
	var lastKmzPos = modelURL.lastIndexOf(kmzExtension);
	var lastDaePos = modelURL.lastIndexOf(colladaExtension);
	
	var fileExtension = Math.max(lastKmzPos, lastDaePos); //Determine whether the URL ends in .kmz or .dae
	
	var modelName = modelURL.substring(lastForwardSlash + 1, modelURL.length);
	
	return modelName;
}

/**
 * Associate the selected travel method with its Travel Method ID
 * @param {String} travelMethod The travel method that was selected to be used in the Menu
 * @return {number} The associated travel method ID of the selected Travel Method
 */
function getTravelMethodID(travelMethod) {
	
	var methodID = null;
	
	switch(travelMethod) {
		case "driving" : methodID = 1; break;
		case "transit" : methodID = 2; break;
	}
	
	return methodID;
}

/**
 * Execute an AJAX request against a given URL
 * @param {String} url URL to a server side file to perform an AJAX request against. e.g. a PHP file
 * @param {Object} data A JSON encoded object, containing an object with properties to manipulate in the server side file
 * @callback successCB Callback function to run after AJAX request completes
 */
function executeAJAXRequest(url, data, successCB) {
	$.ajax({
		type: "POST",
		url: url,
		data: data,
		success: function(returnMsg) {
			successCB(returnMsg);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			successCB("null");
		}
	});
}

/**
 * Remove a custom route from the database
 * @param {String} startLocation The start location of the route to delete
 * @param {String} endLocation The end location of the route to delete
 */
function removeOldCustomRoutesFromDB(startLocation, endLocation) {

	var routeData = new Object();
	
	routeData.startLocation = startLocation;
	routeData.endLocation = endLocation;
	
	var ajaxURL = "php/deleteOldCustomRoute.php";
	var ajaxData = { "routeData" : routeData };
	
	executeAJAXRequest(ajaxURL, ajaxData, function(returnMsg){});
}

/**
 * Remove a custom model from the database
 * @param {String} modelURL The URL of the model in the database to remove
 */
function removeOldCustomModelsFromDB(modelURL) {
	
	var modelData = new Object();
	
	modelData.url = modelURL;
	
	var ajaxURL = "php/deleteOldCustomModel.php";
	var ajaxData = { "modelData" : modelData };
	
	executeAJAXRequest(ajaxURL, ajaxData, function(returnMsg){});
}