<?php
	require 'require/db.php';
	
	$sqlQuery = "SELECT * FROM model";
	
	require 'require\_populationHeader.php';
	
	while($row = mysqli_fetch_array($result))
	{
		addToJson($i, "ModelID", $row);
		addToJson($i, "URL", $row);
		addToJson($i, "Name", $row);
		addToJson($i, "Type", $row);
		addToJson($i, "MethodID", $row);
	
		$i++;
	}
	
	echo json_encode($jsonData);
?>