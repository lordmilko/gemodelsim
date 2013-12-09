<?php
	require "require/db.php";
	require 'require/_getJourneyFromMapLocations.php';
	
	$routeDetails = $_POST["routeData"];
	
	$journeyToDelete = 0;
	
	$sql = "SELECT * FROM journey, journeymaplocations, maplocation WHERE journey.journeyID = journeymaplocations.journeyID AND journeymaplocations.maplocationid = maplocation.maplocationid AND journey.type = 'Custom'";
	
	$result = mysqli_query($dbConn, $sql);
	
	$index = 0;
	$journeyIndex = 0;
	$startEndLocation = null;
	$previousRow = null;
	
	//Get the Journey to delete data for
	while($row = mysqli_fetch_array($result))
	{
		$startEndLocation = getStartEndLocation($index, $row, $previousRow, $journeyIndex, $startEndLocation, mysqli_num_rows($result), $routeDetails["startLocation"], $routeDetails["endLocation"], "setJourneyToDelete"); //Returns the startLocation of the current Journey each time it is called; allows the start location that has been identified to be maintained across multiple calls to the function
		
		$previousRow = $row;
		
		$journeyIndex = checkUpdateCurrentJourney($previousRow, $row["JourneyID"]); //Update the current stored JourneyID if the current row's JourneyID is different from the last
		
		$index++;
	}
	
	deleteJourneyData($result, $journeyToDelete, $dbConn);
	
	//Store the Journey ID of the Journey to have its rows deleted
	function setJourneyToDelete($row)
	{
		global $journeyToDelete;

		$journeyToDelete = $row["JourneyID"];
	}
	
	//Driver function for deleting a Journey's rows
	function deleteJourneyData($result, $journeyToRemove, $dbConn)
	{	
		mysqli_data_seek($result, 0);
		
		while($row = mysqli_fetch_array($result))
		{
			//For every JourneyMapLocation where its ID matches the ID of the JourneyID, remove its MapLocation
			if($row["JourneyID"] == $journeyToRemove)
			{
				removeJourneyMapLocation($row["JourneyMapLocationsID"], $dbConn);				
				removeMapLocation($row["MapLocationID"], $dbConn);
			}
		}
		
		removeJourney($journeyToRemove, $dbConn);
	}
	
	//Remove rows from the Journey table
	function removeJourney($journeyID, $dbConn)
	{
		$table = "journey";
		$columnName = "journeyID";
		
		removeRecord($table, $columnName, $journeyID, $dbConn);
	}
	
	//Remove rows from the JourneyMapLocations table
	function removeJourneyMapLocation($journeyMapLocationsID, $dbConn)
	{
		$table = "journeymaplocations";
		$columnName = "JourneyMapLocationsID";
		
		removeRecord($table, $columnName, $journeyMapLocationsID, $dbConn);
	}
	
	//Remove rows from the MapLocation table
	function removeMapLocation($mapLocationID, $dbConn)
	{
		$table = "maplocation";
		$columnName = "mapLocationID";
		
		removeRecord($table, $columnName, $mapLocationID, $dbConn);
	}
	
	//Remove a record
	function removeRecord($table, $columnName, $columnVal, $dbConn)
	{
		$sql = "DELETE FROM $table WHERE $columnName = '$columnVal'";
		
		mysqli_query($dbConn, $sql);
	}
?>