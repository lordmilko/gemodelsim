<?php
	
	require 'require/db.php';
	
	require 'require/_getIDIfModelExists.php';

	$modelDetails = $_POST["newCustomModel"];
	
	$sql = "INSERT INTO model (URL, Name, Type, MethodID) VALUES ('" .
		$modelDetails["url"] . "', '" .
		$modelDetails["name"] . "', '" .
		$modelDetails["type"] . "', '" .
		$modelDetails["methodID"] . "')";
	
	//If the Model being submitted already exists in the database, get its existing ID
	$whereArgs = " WHERE type = 'Custom'";
	$existingModelID = getIDIfModelExists($dbConn, $modelDetails["url"], $whereArgs);
	
	//Determine whether to output the existing model's ID, or the ID of the new model that will be inserted
	$storedModelID = determineStoredModelID($dbConn, $sql, $existingModelID, $modelDetails["methodID"]);
	
	echo $storedModelID;
	
	//Retrieve the Model ID for the Model used, or add the Model if it doesn't exist (and then retrieve its Model ID)
	function determineStoredModelID($dbConn, $sql, $storedModelID, $methodID) {
	
		//If the model exists, update its associated values in the database
		if($storedModelID > -1)
		{
			$storedModelID = $storedModelID;
			mysqli_query($dbConn, "UPDATE model SET MethodID = $methodID WHERE ModelID = $storedModelID");
		}
		//If the model doesn't exist, add it
		else
		{
			mysqli_query($dbConn, $sql);
			$storedModelID = mysqli_insert_id($dbConn);
		}
				
		//return $existingModelID; //why is it existingmodelID? is this a bug? test this
		return $storedModelID;
	}
?>