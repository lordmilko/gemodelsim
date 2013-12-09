<?php
	/**
	 * Search all Custom Models to determine whether a model already exists (by its URL)
	 * @param $dbConn The Database Connection
	 * @param $url The URL to match against
	 */
	function getIDIfModelExists($dbConn, $url, $optWhereArgs) {

		$modelExists = false;
		$existingModelID = -1;
		
		$sql = "SELECT * FROM model" . $optWhereArgs;

		$result = mysqli_query($dbConn, $sql);
		
		while($row = mysqli_fetch_array($result))
		{
			if($row["URL"] == $url)
			{
				$modelExists = true;
				$existingModelID = $row["ModelID"];
				break;
			}
		}

		return $existingModelID;
	}
?>