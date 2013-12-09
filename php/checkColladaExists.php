<?php

$colladaModel = $_POST["colladaModel"];

$url = $colladaModel["url"];

if(file_exists_remote($url))
	echo "true";
else
	echo "false";

/* Check if a Remote File Exists
 * Author: Vivek Vinesh, 16/5/12
 * Retrieved from http://curiositybeyondcontrol.blogspot.com.au/2012/05/check-if-remote-file-exists-using-php.html
 * Date Retrieved: 10/10/13 */
function file_exists_remote($url) {
	$curl = curl_init($url);
	
	curl_setopt($curl, CURLOPT_NOBODY, true);
	
	//Check connection only
	$result = curl_exec($curl);
	
	//Actual request
	$ret = false;
	
	if ($result !== false) {
		$statusCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
		
		//Check HTTP status code
		if ($statusCode == 200) {
			$ret = true;  
		}
	}
	curl_close($curl);
	return $ret;
}
?>