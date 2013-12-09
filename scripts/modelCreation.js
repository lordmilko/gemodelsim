//modelCreation.js

/**
 * Driver function for creating a model
 * @param {ModelSimulator} simulator The simulator to create a model for
 */
function createModel(simulator) {
	simulator.modelURL = getModelURL($("#model"));

	if(checkStringEndText(simulator.modelURL, ".kmz") || checkStringEndText(simulator.modelURL, ".zip"))
		fetchKMZModel(createModelKmlObjectParser, simulator);
	
	if(checkStringEndText(simulator.modelURL, ".dae"))
		fetchColladaModel(simulator);
}

/**
 * Obtain the URL of the Model selected in the Model Drop-Down List, or was manually entered if a Custom Model is to be used
 * @param modelDDL A jQuery encapsulated HTML Drop-Down List tag used to select a Model to display
 * @return {String} The URL to the model that will be displayed
 */
function getModelURL(modelDDL) {

	var modelURL;

	if(customItemEntered(modelDDL))
		modelURL = $("#kmzURL").val();
	else
		modelURL = modelDDL.val();
		
	return modelURL;
}

/**
 * Fetch a KMZ Model and parse it into a KmlObject for use in Google Earth
 * @callback resultParserCallback A callback function that parses the returned KmlObject in order to display it in Google Earth
 * @param {ModelSimulator} simulator The simulator to create a model for
 */
function fetchKMZModel(resultParserCallback, simulator) {
	
	google.earth.fetchKml(
		simulator.ge,
		simulator.modelURL,
		function(kmlObject){
			resultParserCallback(kmlObject, simulator);
		}
	);
}

/**
 * Driver function for attempting to display a model inside of a KmlObject in Google Earth
 * @param {KmlObject} kmlObject The result of parsing a KMZ file, presumed to contain a model that can be displayed
 * @param {ModelSimulator} simulator The simulator to create a model for
 */
function createModelKmlObjectParser(kmlObject, simulator) {

	var error = false;
	
	if(validKmlObject(kmlObject))
		createModelOnEarth(kmlObject, simulator);
	else 
		error = true;
		
	showHideInvalidModelError(error);
}

/**
 * Determine whether or not a valid KMZ Model has been provided
 * @param {KmlObject} kmlObject An object presumably containing a model that can be displayed
 * @return {boolean} Whether or not kmlObject was determined to be a valid object for displaying a model with
 */
function validKmlObject(kmlObject) {

	var validKmlObject = true;

	if(doesKmlObjectHaveValues(kmlObject) == false) {
	
		validKmlObject = false;
	}
	else {	
		if(isKmlObjectAModel(kmlObject) == false)
			validKmlObject = false;	
	}
		
	return validKmlObject;
}

/**
 * Determine whether or not a KmlObject derived from a KMZ file contains anything in it
 * @param {KmlObject} kmlObject An object presumably containing a model that can be displayed
 * @return {boolean} Whether or not kmlObject has anything in it
 */
function doesKmlObjectHaveValues(kmlObject) {
	
	var hasValues = true;
	
	if(!kmlObject || !kmlObject.getFeatures().getChildNodes().getLength())
		hasValues = false;
		
	return hasValues;
}

/**
 * Determine whether a KmlObject contains a model as one of the features that comprise it
 * @param {KmlObject} kmlObject An object presumably containing a model that can be displayed
 * @return {boolean} Whether or not kmlObject contains a model as one of its features
 */
function isKmlObjectAModel(kmlObject) {

	var isModel = false;
	var tempKmlPlacemark;
	
	//Locate the index of the first KmlModel in the KmlObject. If no such index exists -1 will be returned
	if(getKmlModelChild(kmlObject) != -1)
		isModel = true;
	
	return isModel;
}

/**
 * Find the first KmlModel in a KmlObject
 * @param {KmlObject} The KmlObject to search through
 * @return The child index at which a KmlModel is located
 */
function getKmlModelChild(kmlObject) {

	var modelPosition = -1; //Will indicate no KmlModel was found if value remains -1
	var isModel = false;
	
	var kmlObjectChildren = kmlObject.getFeatures().getChildNodes();

	for(var i = 0; i < kmlObjectChildren.getLength() && !isModel; i++) {

		tempKmlPlacemark = kmlObjectChildren.item(i);

		//Check if the child has a getGeometry method, and if so whether the KmlGeometry returned is of type KmlModel
		if(!("getGeometry" in tempKmlPlacemark) || tempKmlPlacemark.getGeometry().getType() != "KmlModel")
			isModel = false;
			
		else {
			isModel = true;
			modelPosition = i;
		}	
	}
	return modelPosition;
}

/**
 * Driver function for fetching a Collada Model
 * There is no inbuilt way of checking whether URLs to straight collada .dae files are valid.
 * Have a PHP function test whether the entered URL is resolvable; if so, attempt
 * to create a model. If the model file didn't actually contain a model, an invisible model will display
 * @param {ModelSimulator} simulator The simulator to create a model for
 */
function fetchColladaModel(simulator) {

	var error = false;

	var colladaModel = new Object();
	
	colladaModel.url = simulator.modelURL;
	
	var ajaxURL = "php/checkColladaExists.php";
	var ajaxData = { "colladaModel" : colladaModel };
	
	var checkIfColladaExistsCB = function(fileExists) {

		fileExists = (fileExists == "true") ? true : false;
			
		if(fileExists)
			createColladaKmlModel(simulator)
		else
			error = true;
		
		showHideInvalidModelError(error);
	};
	
	executeAJAXRequest(ajaxURL, ajaxData, checkIfColladaExistsCB);
}

/**
 * Display a KMZ Model on Google Earth
 * @param {KmlObject} An object containing a model that can be displayed on Google Earth
 * @param {ModelSimulator} simulator The simulator to create a model for
 */
function createModelOnEarth(kmlObject, simulator) {

	//Get the index of the KmlGeometry object of type KmlModel in the KmlObject
	var childIndex = getKmlModelChild(kmlObject);
	
	//Store the KmlGeometry of the KmlModel in a variable for placement on Google Earth
	simulator.kmzModelPlacemark = kmlObject.getFeatures().getChildNodes().item(childIndex);

	/* Get the KmlModel from the KmlPlacemark
	 * Objects are passed by reference in JavaScript, so the model can be modified without needing to
	 * re-associate it with its KmlPlacemark */
	var model = simulator.kmzModelPlacemark.getGeometry();

	//Set the models altitude mode
	model.setAltitudeMode(simulator.ge.ALTITUDE_RELATIVE_TO_GROUND);
	
	//Append the KmlPlacemark to Google Earth
	simulator.ge.getFeatures().appendChild(simulator.kmzModelPlacemark);
	
	//Set the scale of the model
	setModelScale(model);

	//Begin the simulation animation
	simulationStartingTasks(simulator, model);
}

/**
 * Display a Collada Model on Google Earth
 * @param {ModelSimulator} simulator The simulator to create a model for
 */
function createColladaKmlModel(simulator) {

	//Create a new KmlPlacemark
	simulator.kmzModelPlacemark = simulator.ge.createPlacemark('');
	
	//Create a new KmlModel to store the model in
	var model = simulator.ge.createModel('');

	//Create a new KmlLink to associate the model URL with the KmlModel
	var link = simulator.ge.createLink('');
	
	//Associate the URL for the model with the KmlLink
	link.setHref(simulator.modelURL);
	
	//Bind the KmlLink to the KmlModel
	model.setLink(link);

	//Associate the KmlModel with the KmlPlacemark, allowing the model to be placed on Google Earth
	simulator.kmzModelPlacemark.setGeometry(model);
	
	//Append the KmlPlacemark to Google Earth
	simulator.ge.getFeatures().appendChild(simulator.kmzModelPlacemark);
	
	//Set the scale of the model
	setModelScale(model);
	
	//Begin the simulation animation
	simulationStartingTasks(simulator, model);
}

/**
 * Set the scale of a KmlModel to the value the user selected
 * @param {KmlModel} model The model to modify the scale of
 */
function setModelScale(model) {
	
	var scale = $("#modelScaleSlider").slider("value");

	var modelScale = model.getScale();
	
	modelScale.set(scale, scale, scale);
	
	model.setScale(modelScale);
}

/**
 * Show or hide the error for having an invalid model
 * @param {boolean} error Whether or not an error was encountered
 */
function showHideInvalidModelError(error) {
	errorDiv = $("#customModelError");
	errorDivTxt = $("#customModelError_invalidModel");
	
	checkHideShowError(errorDiv, errorDivTxt, error);
}