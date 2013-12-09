<?php
	
	require 'require/db.php';
	require 'require/_getIDIfModelExists.php';
	require 'require/_getJourneyFromMapLocations.php';

	$routeDetails = $_POST["newCustomRoute"];
	
	$routeExists = false;
	
	//Obtain the Model ID of the Model used. Model ID will have been passed in POST as null if a Builtin or Recent Custom Model was selected
	if($routeDetails["modelID"] == "null")
	{
		$optWhereArgs = ""; //Optional WHERE clause for an SQL statement in getIDIfModelExists()
		$modelID = getIDIfModelExists($dbConn, $routeDetails["modelURL"], $optWhereArgs);
	}
	else
		$modelID = $routeDetails["modelID"];
	
	//Join all Custom Journeys with their MapLocations
	$sql = "SELECT * FROM journey, journeymaplocations, maplocation WHERE journey.journeyID = journeymaplocations.journeyID AND journeymaplocations.maplocationid = maplocation.maplocationid AND journey.type = 'Custom'";
		
	//we want to determine if a route already exists. we can do that by every custom journey's map locations
	//if the map locations match, the route exists
	
	$result = mysqli_query($dbConn, $sql);
	
	$index = 0;
	$journeyIndex = 0;
	$startEndLocation = null;
	$previousRow = null;
	
	//In order to determine if a route (Journey) already exists, we must match the points of the route with those that were sent to the server during POST. Where only the start and end locations of the route were sent during POST, we must match against the start and end locations of the route
	while($row = mysqli_fetch_array($result))
	{
		$startEndLocation = getStartEndLocation($index, $row, $previousRow, $journeyIndex, $startEndLocation, mysqli_num_rows($result), $routeDetails["startLocation"], $routeDetails["endLocation"], "setRouteAsExisting"); //Returns the startLocation of the current Journey each time it is called; allows the start location that has been identified to be maintained across multiple calls to the function
		
		$previousRow = $row;
		
		$journeyIndex = checkUpdateCurrentJourney($previousRow, $row["JourneyID"]); //Update the current stored JourneyID if the current row's JourneyID is different from the last
		
		$index++;
	}
	
	//If no match was found against the records in the database, create new rows in the relevant tables to create a complete Journey record
	if($routeExists == false)
		createNewRouteRows($routeDetails, $modelID, $dbConn);
	
	//Set a flag indicating the route sent via POST exists already
	function setRouteAsExisting($row)
	{
		global $routeExists;

		$routeExists = true;
	}
	
	//Driver function for creating all the rows in every table necessary to have a new route
	function createNewRouteRows($routeDetails, $modelID, $dbConn)
	{	
		$startLocationID = insertMapLocation($routeDetails["startLocation"], $dbConn);
		$endLocationID = insertMapLocation($routeDetails["endLocation"], $dbConn);
		$journeyID = insertJourney($routeDetails["methodID"], $modelID, $dbConn);
		insertJourneyMapLocations($journeyID, $startLocationID, $dbConn);
		insertJourneyMapLocations($journeyID, $endLocationID, $dbConn);
	}
	
	//Determine whether the "name" or "coordinates" attribute should use a proper value or null
	function nameOrCoordinatesIsNull($location, $column)
	{
		$textToUse = $location;
		
		//Coordinates can contain commas, spaces, numbers and dashes. If a letter is present, the location must be the name of a place
		if(checkContainsLetters($location) && $column === "coordinates")
			$textToUse = '';
			
		else if(!checkContainsLetters($location) && $column == "name")
			$textToUse = '';

		return $textToUse;
	}
	
	//Check whether a string contains any letters
	function checkContainsLetters($str)
	{
		$containsLetters = false;
	
		if(preg_match("/[a-zA-Z]/", $str))
			$containsLetters = true;
			
		return $containsLetters;
	}
	
	//Insert a new MapLocation table record
	function insertMapLocation($location, $dbConn)
	{
		$coordinates = nameOrCoordinatesIsNull($location, "coordinates");
		$name = nameOrCoordinatesIsNull($location, "name");
		
		$sql = "INSERT INTO maplocation (Coordinates, Name) VALUES (";
		$sql .=	($coordinates == '') ? "null" : "'$coordinates'";
		$sql .= ", ";
		$sql .= ($name == '') ? "null" : "'$name'";
		$sql .= ")";
		
		mysqli_query($dbConn, $sql);
		
		return mysqli_insert_id($dbConn);
	}
	
	//Insert a new Journey table record
	function insertJourney($methodID, $modelID, $dbConn)
	{
		$sql = "INSERT INTO journey (Type, ModelID, DesiredMethodID) VALUES ('Custom', '$modelID', '$methodID')";
		
		mysqli_query($dbConn, $sql);

		return mysqli_insert_id($dbConn);
	}
	
	//Insert a new JourneyMapLocations table record
	function insertJourneyMapLocations($journeyID, $locationID, $dbConn)
	{
		$sql = "INSERT INTO journeymaplocations (JourneyID, MapLocationID) VALUES ('$journeyID', '$locationID')";

		mysqli_query($dbConn, $sql);
	}
?>