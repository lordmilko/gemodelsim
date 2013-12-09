<?php
	require 'require\db.php';

	$sqlQuery = "SELECT journey.JourneyID, Type, ModelID, DesiredMethodID, maplocation.MapLocationID, Coordinates, Name FROM journey, journeymaplocations, maplocation
	WHERE journey.journeyID = journeymaplocations.journeyID AND journeymaplocations.maplocationID = maplocation.maplocationID";

	require 'require\_populationHeader.php';
	
	while($row = mysqli_fetch_array($result))
	{
		addToJson($i, "JourneyID", $row);
		addToJson($i, "Type", $row);
		addToJson($i, "ModelID", $row);
		addToJson($i, "DesiredMethodID", $row);
		addToJson($i, "MapLocationID", $row);
		addToJson($i, "Coordinates", $row);
		addToJson($i, "Name", $row);
		
		$i++;
	}
		
	echo json_encode ($jsonData);
?>