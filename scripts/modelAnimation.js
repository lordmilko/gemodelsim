//modelAnimation.js

/**
 * A variable to store a Model Simulation, containing all attributes and methods for moving a model
 * along a route
 * @type {ModelSimulator}
 */
var modelSimulation;

/**
 * A helper object with various methods that help determine various values when
 * calculating a route and moving a model
 * @type {GEHelpers}
 */
ModelSimulator.geHelper;

/**
 * The number of milliseconds to simulate each Google Earth Frame Update. At 30 frames per second,
 * for a real time simulation there are 33 milliseconds per frame
 * @type {number}
 */
ModelSimulator.milliSecondsPerFrame = 33;

/**
 * The number of milliseconds there are in a second
 * @type {number}
 */
ModelSimulator.milliSecondsPerSecond = 1000;

/**
 * The number of frames to show a camera for before switching to the next one
 * @type {number}
 */
ModelSimulator.framesPerCamera = 400;

/**
 * The initial FlyToSpeed used by Google Earth, before the simulation began (and the FlyToSpeed
 * became SPEED_TELEPORT)
 * @type {number}
 */
var initialFlyToSpeed;

/**
 * Begin the simulation, adjust the Drop-Down Lists and add or update any necessary database entries
 * @param {ModelSimulator} simulator The simulation to start running
 * @param {KmlModel} model The model to move through the simulation
 */
function simulationStartingTasks(simulator, model) {

	simulator.modelMovementDriver(model);

	$("#progressOverlay").hide();

	adjustMenuItems();	
	addNewCustomRouteAndModel(simulator);
}

/**
 * Model Simulator Constructor
 * @param {GEPlugin} ge The Google Earth Instance to run the simulator in
 */
 function ModelSimulator(ge) {

	//General Setup
	this.ge = ge;
	this.doAnimation = false;
	this.speed = 1; //Multiplier controlling the speed the simulation runs at
	
	this.pathDetails = []; //Route details, populated in routeCreation.js
	this.kmzModelPlacemark = null; //Model to simulate, assigned in modelCreation.js
	
	//Store the current state of the simulation as it progresses
	this.elapsedStepTime = 0;
	this.geStepIndex = 0;
	this.currentSpeed = 0;

    //Camera Variables
	this.frameCount = 0;
	this.cameraIndex = 0;
	this.cameras = [];
	
	this.requiredTravelTime = 0;
	
	/* Note: while totalTime is incremented as a simulation runs, it is not otherwise utilized in the Google Earth Model Simulator v1.0.
	 * It is simply included for future use */
	this.totalTime = 0;

	//Prepare the Simulation to begin
	
	this.populateInitialCameras();
 }

/**
 * Driver function for moving a model in Google Earth
 * @param {KmlModel} A model that can be displayed on Google Earth
 */
ModelSimulator.prototype.modelMovementDriver = function(model) {

	var initialCoordinate = this.pathDetails[0].loc;
	
	var initialHeading = this.getInitialModelHeading();

	var maxDelay = 150;
	var frameCount = 0;

	this.setMovementSpeed();
	
	/* "this" in waitForInitialView will refer to waitForInitialView, not the current simulation.
	 * Inserting the outer "this" into a variable allows us to access the simulation object inside waitForInitialView */
	var simulator = this;

	//Smoothly move the camera to the start of the route before instantiating the animation event listener
	waitForInitialView = function() {
	
		frameCount++;
	
		//Wait for the camera to zoom in to the start of the route before initializing the Model Animation Event Listener (which has instant camera teleport speed)
		if(simulator.checkAtStartPos(initialCoordinate) || frameCount > maxDelay) {

			google.earth.removeEventListener(simulator.ge, "frameend", waitForInitialView);

			simulator.updatePosition(initialCoordinate, initialHeading, model); //Set the initial position of the model, move the camera in closer to the model

			/* Each time the model moves, the camera must instantly fly to the new location without any panning delay.
			 * If this were set without waiting for a moment, the camera would simply jump to the start of the route, without a smooth camera motion */
			simulator.ge.getOptions().setFlyToSpeed(simulator.ge.SPEED_TELEPORT);
			simulator.doAnimation = true;

			simulator.createAnimationListener(model, ModelSimulator.geHelper); //Create the Event Listener for performing animation
		}
	};
						
	google.earth.addEventListener(this.ge, "frameend", waitForInitialView); //Create a temporary event listener for smoothly moving the camera to the start of the route
}

/**
 * Determine the initial heading the model should be facing
 * @return The heading the model will initially face
 */
ModelSimulator.prototype.getInitialModelHeading = function() {
	var initialHeading = 0;
	
	if(this.pathDetails.length > 1)
		initialHeading = ModelSimulator.geHelper.getHeading(this.pathDetails[0].loc, this.pathDetails[1].loc);
		
	return initialHeading;
}

/**
 * Set the movement speed the simulation will run at from the users entered value
 */
ModelSimulator.prototype.setMovementSpeed = function () {

    var enteredTime = $("#etaSlider").slider("value");

    if (enteredTime == 0)
        this.speed = 1;
    else {
        /* Divide the required time by the entered time - converted to seconds -
         * to get a speed ratio the simulation should run at.
         * E.g. for a route that takes 60 mins, if 120 mins was entered, the speed will be 0.5 */
        this.speed = this.requiredTravelTime / (enteredTime * 60);
    }
}

/**
 * Check whether or not the simulations camera has moved to the start position
 * @return Whether or not the camera has moved to the start of the simulation
 */
ModelSimulator.prototype.checkAtStartPos = function(initialCoordinate) {

	var atStartPos = false;
	
	var currentLookAt = this.ge.getView().copyAsLookAt(this.ge.ALTITUDE_RELATIVE_TO_GROUND);
	var expectedRange = this.cameras[this.cameraIndex].range;
	
	var currentLat = currentLookAt.getLatitude();
	var currentLng = currentLookAt.getLongitude();
	
	if(this.checkCoordinateMatches(initialCoordinate.lat(), initialCoordinate.lng(), currentLat, currentLng))
		atStartPos = true;
	
	return atStartPos;
}

/**
 * Determine whether two coordinates match (two four decimal places)
 * @param {number} desiredLat First latitude to compare with
 * @param {number} desiredLng First longitude to compare with
 * @param {number} actualLat Second latitude to compare with
 * @param {number} actualLng Second longitude to compare with
 @return Whether or not the latitudes and longitudes of two coordinates match each other (to four decimal places)
 */
ModelSimulator.prototype.checkCoordinateMatches = function(desiredLat, desiredLng, actualLat, actualLng) {
	
	var isMatch = false;
	
	if(desiredLat.toFixed(4) == actualLat.toFixed(4) && desiredLng.toFixed(4) == actualLng.toFixed(4))
		isMatch = true;
	
	return isMatch;
}

/**
 * Update the current position of the model and the camera
 * @param {google.maps.LatLng} coordinate The coordinate to move the model and camera to
 * @param {number} heading The heading the model should turn to to be facing forwards as it moves along its path
 * @param {KmlModel} model The model to change the position of
 */
ModelSimulator.prototype.updatePosition = function(coordinate, heading, model) {

	this.moveModel(coordinate, heading, model);
	this.trackModel(coordinate);
}

/**
 * Update the position of a model
 * @param {google.maps.LatLng} coordinate The coordinate the model should be moved to
 * @param {number} heading The heading the model should turn to to be facing forwards as it moves along its path
 * @param {KmlModel} model The model to move
 */
ModelSimulator.prototype.moveModel = function(coordinate, heading, model) {

	var altitude = 0;
		
	model.getLocation().setLatLngAlt(coordinate.lat(), coordinate.lng(), altitude);
	
	model.getOrientation().setHeading(heading);
}

/**
 * Move the camera to track a model
 * @param {google.maps.LatLng} coordinate The coordinate the camera should be focused on
 */
ModelSimulator.prototype.trackModel = function(coordinate) {
	
	/* Dynamically determine the field of view. Can be uncommented and used instead of static ranges (which have been specified in simulator cameras) */
	//var currentLookAt = this.ge.getView().copyAsLookAt(this.ge.ALTITUDE_RELATIVE_TO_GROUND);
	//var requiredRange = calculateRequiredRange(currentLookAt);
	//requiredRange = Math.round(requiredRange / 20) * 20;
	
	var requiredRange = this.cameras[this.cameraIndex].range;
	
	var heading = this.cameras[this.cameraIndex].heading;
	var tilt = this.cameras[this.cameraIndex].tilt;
	
	var altitude = 0;
	var altitudeMode = this.ge.ALTITUDE_RELATIVE_TO_GROUND;

	createAndSetNewLookAt(coordinate.lat(), coordinate.lng(), altitude, altitudeMode, heading, tilt, requiredRange);
}

/**
 * Calculate the field of view (range) that should be displayed based on the current speed
 * @param {KmlLookAt} currentLookAt The current camera's view
 * @return {number} The range the camera should be set to
 */
function calculateRequiredRange(currentLookAt) {

	var minimumDesiredRange = 20;

	var currentRange = currentLookAt.getRange();
	var desiredRange = Math.max(minimumDesiredRange, this.currentSpeed * 10);
	var requiredRange = currentRange + (desiredRange - currentRange) * 0.1;
	return requiredRange;
}

/**
 * Create the event listener for moving the model and the camera
 * @param {KmlModel} model The model that will be moved each time the event listener fires
 */
ModelSimulator.prototype.createAnimationListener = function(model) {
	
	var simulator = this;
	
	animationCB = function() {
		if(simulator.doAnimation && simulator.moreCoordinatesToMoveAlong()) {
			simulator.updateCamera();
			simulator.calcNextAnimationFrame(model);
		}
		else
		{
			simulator.checkPerformSimulationCompletedTasks();
			google.earth.removeEventListener(simulator.ge, "frameend", animationCB);
		}
	};

	google.earth.addEventListener(this.ge, "frameend", animationCB);
}

/**
 * Calculate where the camera and model will move to next
 * @param {KmlModel} model The model that will be moved each time the event listener fires
 */
ModelSimulator.prototype.calcNextAnimationFrame = function(model) {
	
	//Keep a tally of the total time travelled.
	//Note: The Google Earth Model Simulator v1.0 does not use this variable; it is simply included as future projects could need it
	this.totalTime += ModelSimulator.milliSecondsPerFrame * this.speed / ModelSimulator.milliSecondsPerSecond;
	
	/* In real time at 30fps, a new frame is displayed every 33ms; elapsedStepTime stores this in seconds.
	 * Therefore, for real time elapsedStepTime would increase by exactly 0.033 per function call */
	this.elapsedStepTime += ModelSimulator.milliSecondsPerFrame * this.speed / ModelSimulator.milliSecondsPerSecond;
	
	//Assume during the milliseconds since the last frame update we're still in the same step
	var stepDistance = this.pathDetails[this.geStepIndex].distance;
	var stepDuration = this.pathDetails[this.geStepIndex].duration;	
	
	//Modify the value of stepDuration if it turns out the next step has been entered
	stepDuration = this.adjustTimingIfNextStepEntered(stepDuration);

	this.updateCurrentSpeed(stepDistance, stepDuration);
	
	var intermediateCoordinate = this.getIntermediateCoordinate(stepDuration);
	var heading = ModelSimulator.geHelper.getHeading(this.pathDetails[this.geStepIndex].loc, this.pathDetails[this.geStepIndex + 1].loc);
	
	this.updatePosition(intermediateCoordinate, heading, model);
}

/**
 * Correct for the next step being entered during the last frame update
 * @param {number} stepDuration Duration of the current step, in seconds
 * @return The duration that has been travelled so far for the current step
 */
ModelSimulator.prototype.adjustTimingIfNextStepEntered = function(stepDuration) {

	//Readjust the elapsed step duration and current step index until the simulation is back on course
	while(this.moreCoordinatesToMoveAlong() && this.wentOverStepDuration(stepDuration)) {
	
		/**
		 * Consider a step of 5 seconds duration. On the previous frame, the step might have
		 * been 4.999 seconds of the way through. At 33ms per frame, after the frame update
		 * the total duration that will have been travelled in the step is 5.032 seconds.
		 * To correct for this, we subtract the 5 seconds the step was supposed to take from
		 * the total duration travelled, and then use the remaining elapsedStepTime with the
		 * next step. If the next step lasts for 3 seconds, it can be safely said that 0.032
		 * of those 3 seconds have already been traversed. */
	
		this.elapsedStepTime -= stepDuration;
		
		this.geStepIndex++;
		
		stepDuration = this.pathDetails[this.geStepIndex].duration;
	}
	
	return stepDuration;
}

/**
 * Determine whether there are more coordinates yet to be traversed
 * @return {boolean} Whether or not any coordinates are yet to be travelled along
 */
ModelSimulator.prototype.moreCoordinatesToMoveAlong = function() {

	var moreCoordinatesRemaining = false;

	if(this.geStepIndex < this.pathDetails.length -1)
		moreCoordinatesRemaining = true;
		
	return moreCoordinatesRemaining;
}

/**
 * Determine whether the amount of time spent travelling along a step exceeded the actual length of the step
 * @param {number} stepDuration the duration of the current step, in seconds
 * @return {boolean} Whether or not the elapsed step time went over the step duration
 */
ModelSimulator.prototype.wentOverStepDuration = function(stepDuration) {
	
	var wentOverDuration = false;
	
	if(this.elapsedStepTime >= stepDuration)
		wentOverDuration = true;
		
	return wentOverDuration;
}

/**
 * Update the current speed the model is moving at
 * @param {number} stepDistance The distance of the current step, in metres
 * @param {number} stepDuration The duration of the current step, in seconds
 */
ModelSimulator.prototype.updateCurrentSpeed = function(stepDistance, stepDuration) {
	if(stepDuration > 0) {
		this.currentSpeed = stepDistance / stepDuration;
	}
	else {
		this.currentSpeed = 0;
	}
}

/**
 * Determine an intermediate coordinate between two coordinates originally listed in a DirectionsStep
 * @param {number} stepDuration the duration of the current step, in seconds
 * @return {google.maps.LatLng} An intermediate coordinate between two coordinates originally from a DirectionStep
 */
ModelSimulator.prototype.getIntermediateCoordinate = function(stepDuration) {

	var currentCoordinate = this.pathDetails[this.geStepIndex].loc;
	var nextCoordinate = this.pathDetails[this.geStepIndex + 1].loc;
	var fractionOffsetFromCurrentCoord = this.elapsedStepTime / stepDuration; //The fraction of the way along the current step we are
	
	var intermediateCoordinate = ModelSimulator.geHelper.interpolateLoc(currentCoordinate, nextCoordinate, fractionOffsetFromCurrentCoord); //Determine an intermediate coordinate between the current and next major coordinate along the route
	
	return intermediateCoordinate;
}

/**
 * Tasks to perform upon the simulation ending
 */
ModelSimulator.prototype.checkPerformSimulationCompletedTasks = function() {

	//Don't perform any tasks if the simulation ended due to user interruption
	if(!this.moreCoordinatesToMoveAlong()) {
		checkShowMenuAfterDelay();
	}
}

/**
 * Camera Constructor
 * Constructs a new Camera object
 * @param {number} heading Heading direction to use for the camera (values 0 to 360)
 * @param {number} tilt Tilt value to use for the camera (values 0 to 90)
 * @param {number} range Range value to use for the camera (distance in meters to position the camera
 *						 from what it will be centred on)
 */
function Camera(heading, tilt, range) {
    this.heading = heading;
    this.tilt = tilt;
	this.range = range;
}

/**
 * Add a new camera to the array of simulation cameras
 * @param {number} heading Heading direction to use for the camera (0 to 360 degrees)
 * @param {number} tilt Tilt value to use for the camera (0 to 90 degrees)
 * @param {number} range Range value to use for the camera (distance in meters to position the camera
 *						 from what it will be centred on)
 */
ModelSimulator.prototype.addNewCamera = function (heading, tilt, range) {
    var numCameras = this.cameras.length;

    /* Last camera index was (cameras.length -1).
     * Next available position is therefore (cameras.length - 1) + 1 == cameras.length */
    this.cameras[numCameras] = new Camera(heading, tilt, range);
}

/**
 * Create some initial cameras for the simulation to use
 */
ModelSimulator.prototype.populateInitialCameras = function() {
	
	//Heading, Range, Tilt
    
	this.addNewCamera(200, 60, 300);
	
	this.addNewCamera(-47.3872, 80.5524, 102);
	
	this.addNewCamera(44.50891, 80, 664);
	
	this.addNewCamera(20, 0, 200);
}

/**
 * Update the time (frames) that have elapsed for the current camera and decide
 * when to move on to the next one
 */
ModelSimulator.prototype.updateCamera = function() {
    this.frameCount++;
	
	//The camera will change every (ModelSimulator.framesPerCamera) frames
    if (this.frameCount > ModelSimulator.framesPerCamera) {
        this.setCameraIndex();

        this.frameCount = 0;
    }
}

/**
 * Cycle to the next camera index
 */
ModelSimulator.prototype.setCameraIndex = function () {
    if (this.cameraIndex < this.cameras.length - 1)
        this.cameraIndex++;
	//Go back to the first index after the last index has been reached
    else
        this.cameraIndex = 0;
}