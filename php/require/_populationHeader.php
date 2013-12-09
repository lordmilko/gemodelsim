<?php
	$result = mysqli_query($dbConn, $sqlQuery);

	$jsonData = array();
	$i = 0;
	
	function addToJson($i, $data, $row) {
	
		global $jsonData;

		$jsonData[$i][$data] = $row[$data];
	}
?>