<?php
	require "require/db.php";
	require 'require/_getIDIfModelExists.php';

	$modelData = $_POST["modelData"];
	
	$optWhereArgs = " WHERE type = 'Custom'";
	$modelID = getIDIfModelExists($dbConn, $modelData["url"], $optWhereArgs);
	
	removeReferencesToModel($dbConn, $modelID);
	
	//Replace all references to the model in any existing Journeys with NULL
	function removeReferencesToModel($dbConn, $modelID)
	{
		$sql = "SELECT * FROM journey WHERE type = 'Custom'";
		
		$result = mysqli_query($dbConn, $sql);
		
		while($row = mysqli_fetch_array($result))
		{
			if($row["ModelID"] == $modelID)
			{
				$journeyID = $row["JourneyID"];
				
				$sqlUpdate = "UPDATE journey SET ModelID = null WHERE JourneyID = '$journeyID'";
				
				mysqli_query($dbConn, $sqlUpdate);				
			}
		}
	}
	
	$sqlDelete = "DELETE FROM model WHERE ModelID = '$modelID'";
	
	mysqli_query($dbConn, $sqlDelete);
?>