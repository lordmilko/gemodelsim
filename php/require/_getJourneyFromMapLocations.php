<?php

	function getStartEndLocation($index, $row, $previousRow, $journeyIndex, $startEndLocation, $numRows, $postStartLocation, $postEndLocation, $matchIdentifiedCallback)
	{
		//If the JourneyID that has been stored for the previous row is different from the JourneyID in the current row, the Journey from the previous row must have ended. In which case the searching algorithm can be finalized for this record and the start and end locations can be compared against the values sent in POST
		if($journeyIndex != $row["JourneyID"])
		{
			if($index != 0) //If index is 0 there won't be a previous route, so do not attempt to finalize anything
			{
				checkAddNewMapLocation($previousRow, $startEndLocation, $postStartLocation, $postEndLocation, $matchIdentifiedCallback);
			}
			
			$startLocation = useNameOrCoordinates($row);
			$startEndLocation = $startLocation;
		}
		
		//On the last row there won't be any further rows to check against, that would otherwise cause the function to compare the start and end locations of the final row's Journey against those that werent sent in POST. Therefore, if it is the final row, also do a check against the POST locations
		if($index == $numRows - 1)
			checkAddNewMapLocation($row, $startEndLocation, $postStartLocation, $postEndLocation, $matchIdentifiedCallback);
			
		return $startEndLocation;
	}
	
	//Check whether the start and end locations sent in POST match the start and end locations of a Journey
	function checkAddNewMapLocation($row, $startLocation, $postStartLocation, $postEndLocation, $matchIdentifiedCallback)
	{
		$endLocation = useNameOrCoordinates($row);

		//If a match is found, raise a flag saying the route designated by the POST start and end locations already exists in the database
		if(checkJourneyAgainstPOST($startLocation, $endLocation, $postStartLocation, $postEndLocation) == true)
		{	
			$matchIdentifiedCallback($row);
		}
	}

	//Determine whether to use the Name column or Coordinates column value. Always use the Name column unless the value is null
	function useNameOrCoordinates($row)
	{
		$location;
		
		if($row["Name"] == null)
			$location = $row["Coordinates"];
		else
			$location = $row["Name"];
			
		return $location;
	}
	
	function checkJourneyAgainstPOST($startLocation, $endLocation, $postStartLocation, $postEndLocation)
	{
		$locationsMatch = false;
	
		if($startLocation == $postStartLocation && $endLocation == $postEndLocation)
			$locationsMatch = true;
			
		return $locationsMatch;
	}
	
	function checkUpdateCurrentJourney($currentJourney, $nextJourney)
	{
		if($currentJourney != $nextJourney)
			$currentJourney = $nextJourney;
			
		return $currentJourney;
	}

?>