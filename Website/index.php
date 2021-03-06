<?php
session_set_cookie_params(3600*24*30);
session_start();


header("Content-Type: text/html;charset=UTF-8");

@$http_proxy = "srv01gr.unx.sas.com:80";
@$demoConfigFile = "config.json";
@$demoConfig = array();
@$enable_logging = true;
@$logging_db = array(
	"host" => "localhost:3306", 
	"user" => "omnichanneldemo",
	"pass" => "CXfmZqwVzDpfzTKJ");



$mysql_link = new mysqli($logging_db['host'], $logging_db['user'], $logging_db['pass'], $logging_db['user']);

if ($mysql_link->connect_errno) {
    // Let's try this:
	echo "Sorry, this website is experiencing problems.";

	echo "Error: Failed to make a MySQL connection, here is why: \n";
	echo "Errno: " . $mysql_link->connect_errno . "\n";
	echo "Error: " . $mysql_link->connect_error . "\n";

	exit;
}


$mysql_link->query("set names 'utf8';");
$mysql_link->set_charset("utf8");
$mysql_link->set_charset('utf-8');

return processRequest();
// Continue reading in processRequest();








function getRequestParameter($parameter) {
	if($_SERVER['REQUEST_METHOD'] == "POST")
		return @$_POST[$parameter] ? @$_POST[$parameter] : @$_GET[$parameter] ;
	else
		return @$_GET[$parameter];
}




function processRequest() {
	$token = getRequestParameter("token");
	$page = getRequestParameter("page");
	$action = getRequestParameter("action");


	if(empty($token)) {
		die ("please provide a token");
	}

	if(empty($page)) {
		$page = "start";
	}

	if(empty($action)) {
		$action = "read";
	}


	if($action == "read") {
		echo getPageFromDatabase($token, $page);


	} else if ($action == "edit") {
		displayEditor($token, $page);

	} else if ($action == "save") {
		// overwrite existing page
		$options = getRequestParameter("options");
		$content = getRequestParameter("content");
		@header('Content-type: application/json');
		echo json_encode(savePageToDatabase($token, $page, $content, $options));
	} else if ($action == "upload") {
		$url = getRequestParameter("url");
		$raw_options = getRequestParameter("uploadOptions");
		$options = array();
		if(!empty($raw_options)) {
			$options = json_decode($raw_options);
		}
		uploadWebsiteToDatabase($token, $page, $url, $options);
	}
}




/**
*
*/
function getConfigFromDatabase($token) {
	global $mysql_link;
	$config = null;

	$configQuerySql = "SELECT * FROM `demo_config` WHERE `token` = '".$token."'";
	$configQueryResult = $mysql_link->query($configQuerySql);



	if(!$configQueryResult || $configQueryResult->num_rows != 1) {
		die("invalid token");
	}
	else {
		$configItem = $configQueryResult->fetch_assoc();;
		$config = json_decode($configItem["config_json"]);
	}


	return $config;
}



/**
*
*/
function getPageFromDatabase($token,$page) {
	global $mysql_link;
	$content = "";
	// check token
	getConfigFromDatabase($token);

	$pageQuerySql = "SELECT * FROM `demo_website` WHERE `token` = '".$token."' and `site` = '".$page."'";
	$pageQueryResult = $mysql_link->query($pageQuerySql);

	if(!$pageQueryResult || $pageQueryResult->num_rows != 1) {
		//die("invalid token " . $pageQueryResult->num_rows);

	}
	else {
		$pageItem = $pageQueryResult->fetch_assoc();;
		$content = $pageItem["content"];
	}

	return $content;
}

function savePageToDatabase($token, $page, $content, $insertJsBase) {
	global $mysql_link;
	$userIP = gethostbyaddr($_SERVER['REMOTE_ADDR']);

	if($insertJsBase == "true") {
		$htmlContent = $content;
		$htmlDom = parseHtmlContent($htmlContent);

		$jsFolderUrl = "http://". $_SERVER['SERVER_NAME'] ."/OmniChannelDemo/";
		$baseRefUrl = "http://#addOriginalUrlHere";
		$htmlDom = addBaseToDOM($htmlDom, $baseRefUrl);
		$htmlDom = addJsToDOM($htmlDom, $jsFolderUrl);
		$content = outputDOMHtml($htmlDom, true);
	}
	

	$encodedContent = $mysql_link->real_escape_string($content);

	$sqlQuery ="INSERT INTO `omnichanneldemo`.`demo_website` (`token`, `site`, `content`, `create_dttm`, `modify_dttm`, `modify_by`) VALUES ('".$token."', '".$page."', '".$encodedContent."', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '".$userIP."') ON DUPLICATE KEY UPDATE `content`='".$encodedContent."', `modify_by` = '".$userIP."' , modify_dttm = CURRENT_TIMESTAMP ";
	$updateResult = $mysql_link->query($sqlQuery);

	if(!$updateResult) {
		return array("status" => "error", "message" => $mysql_link->error, "query"=>$sqlQuery);
	} else {
		return array("status" => "success", "query" => $sqlQuery);
	}
} 



function uploadWebsiteToDatabase($token, $page, $url, $options) {
	// check token
	// check url
	// check page
	if(empty($page) || empty($url) || getConfigFromDatabase($token) == null) {
		die("Please provide an ID for page and a URL to grab");
	}

	$htmlContent = grabContentFromUrl($url);

	$htmlDom = parseHtmlContent($htmlContent);

	$insertBase = in_array("insert_base", $options);
	$fixLinks 	= in_array("fix_relative_links", $options);
	$tidyOutput = in_array("tidy_output", $options);
	$insertJS 	= in_array("insert_js", $options);
	$removeExtJs = in_array("remove_ext_js", $options);
	$parsedUrl = parse_url($url);
	// TODO
	$jsFolderUrl = "http://". $_SERVER['SERVER_NAME'] ."/OmniChannelDemo/";
	$baseRefUrl = @$parsedUrl["scheme"] . "://" . @$parsedUrl["host"] . @$parsedUrl["path"];

	if($removeExtJs) {
		$htmlDom = removeExternalJsFromDOM($htmlDom);
	}
	if($fixLinks) {
		$htmlDom = removeRelativeRefs($htmlDom, $baseRefUrl);
	}
	if($insertBase) {
		$htmlDom = addBaseToDOM($htmlDom, $baseRefUrl);
	}
	if($insertJS) {
		$htmlDom = addJsToDOM($htmlDom, $jsFolderUrl);
	}
	
	$htmlOutput = outputDOMHtml($htmlDom, $tidyOutput);
	$htmlOutputLength =  mb_strlen($htmlOutput);

	$savePageResult = savePageToDatabase($token, $page, $htmlOutput, false);

	echo json_encode(array("token" => $token, "page" => $page, "url" => $parsedUrl, "insertBase" => $insertBase, "fixLinks" => $fixLinks, "tidyOutput" => $tidyOutput, "insertJS" => $insertJS, "removeExtJs" => $removeExtJs , "htmlOutputLength" => $htmlOutputLength));
}





function displayEditor($token, $page) {
	$content = getPageFromDatabase($token, $page);
	$config = getConfigFromDatabase($token);

	?>
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<title><?php echo "Editor: " . $page ." Page of ". $config->general->demoName; ?></title>
		<link href="../css/bootstrap.min.css" rel="stylesheet">
		<style type="text/css" media="screen">
		body {
			overflow: hidden;
			background: #333;
			color: #fff;
		}

		#editor {
			margin: 0;
			position: absolute;
			top: 0px;
			bottom: 65px;
			left: 0;
			right: 0;
			font-size: 16px;
		}

		.ace_search_field {
			color: black;
		}

		#control_buttons {
			margin: 0px;
			position: absolute;
			bottom: 10px;
			right: 10px;
		}

		#control_buttons > lable {
			padding-right: 20px;
		}

		</style>
	</head>
	<body>

		<div id="control_buttons">
			<lable>
				<input id="optionsCheckbox" type="checkbox" value="insert_js_base"/> (re) insert required Javascripts and clean up HTML.
			</lable>

			<input type="button" class="btn btn-lg btn-default" value="Save" onclick="saveContent();"/>
			<input type="button" class="btn btn-lg btn-primary" value="Save and Close" onclick="saveContent(true);"/>
		</div>

		<div>
			<pre>
<code id="editor"><?php echo htmlentities($content, ENT_QUOTES, "UTF-8"); ?></code>
			</pre>
		</div>



		<script src="../js/ext/ace/ace.js" type="text/javascript" charset="utf-8"></script>
		<script src="../js/ext/jquery-1.11.3.min.js" type="text/javascript" charset="utf-8"></script>
		<script>
		var editor = ace.edit("editor");
		var reloadPageAfterSaving = true;
		editor.setTheme("ace/theme/monokai");
		editor.session.setMode("ace/mode/html");

		function saveContent(closeWindowAfterSaving) {
			var token = "<?php echo $token; ?>";
			var page = "<?php echo $page; ?>";
			var content = editor.getValue();
			var options = ($('input#optionsCheckbox').is(':checked'));

			return $.ajax("./", {
				type: 'POST',
				data: {action: "save",token: token, page: page, content: content, options: options}
			} ).done(function(result) {
				if(result.status == "success") {
					alert("Website saved successfully.");
					if(closeWindowAfterSaving) {
						window.close();
					}
					else if(reloadPageAfterSaving) {
						location.reload();
					}
				} else {
					alert("Error: Could not save website.");
					console.log("Error Message: " + result.message);
				}

			});;

		}

		</script>


	</body>
	</html>

	<?php

}

function parseHtmlContent($source) {
	$domDocument = new DOMDocument();
	@$domDocument->loadHTML('<?xml encoding="utf-8" ?>' . $source);
	
	foreach ($domDocument->childNodes as $item) {
		if ($item->nodeType == XML_PI_NODE) {
			$domDocument->removeChild($item);
		}
	}

	return $domDocument;
}

function removeRelativeRefs($domDocument, $baseUrl) {
	// get all js, css, img...
	// public DOMNodeList DOMDocument::getElementsByTagName ( string $name )
	return $domDocument;
}

function addBaseToDOM($domDocument, $baseUrl) {
	$heads = $domDocument->getElementsByTagName('head');
	if($heads->length > 0) {
		if(!$domDocument->getElementById("ocdBaseTag")) 
		{
			$baseElement = $domDocument->createElement('base','');
			$baseElement->setAttribute("id", "ocdBaseTag");
			$baseElement->setAttribute("href", $baseUrl);
			$heads->item(0)->insertBefore($baseElement, $heads->item(0)->firstChild);
		}
	}

	return $domDocument;
}

function removeExternalJsFromDOM($domDocument) {
	$scripts = $domDocument->getElementsByTagName('script');

	$domElemsToRemove = array(); 

	for($i = 0; $i < $scripts->length; $i++) {
		$scriptNode = $scripts->item($i);
		$domElemsToRemove[] = $scriptNode;
	}

	foreach($domElemsToRemove as $domElemToRemove) {
		$domElemToRemove->parentNode->removeChild($domElemToRemove);
	}

	return $domDocument;
}

function addJsToDOM($domDocument, $jsFolderUrl) {

	$bodys = $domDocument->getElementsByTagName('body');
	if($bodys->length > 0) {
		// if ocdJQueryTag is not there 

		if(!$domDocument->getElementById("ocdJQueryTag")) {
			$jsElement1 = $domDocument->createElement('script','');
			$jsElement1->setAttribute("id", "ocdJQueryTag");
			$jsElement1->setAttribute("src", $jsFolderUrl . "js/ext/jquery-1.11.3.min.js");
			$bodys->item(0)->appendChild($jsElement1);
		}

		if(!$domDocument->getElementById("ocdApiTag")) {
			$jsElement2 = $domDocument->createElement('script','');
			$jsElement2->setAttribute("id", "ocdApiTag");
			$jsElement2->setAttribute("src", $jsFolderUrl . "js/api.js");
			$bodys->item(0)->appendChild($jsElement2);
		}

		if(!$domDocument->getElementById("ocdWebsiteTag")) {
			$jsElement3 = $domDocument->createElement('script','');
			$jsElement3->setAttribute("id", "ocdWebsiteTag");
			$jsElement3->setAttribute("src", $jsFolderUrl . "js/website.js");
			$bodys->item(0)->appendChild($jsElement3);
		}
		
	}
	return $domDocument;
}


function outputDOMHtml($domDocument, $tidyOutput = false) {
	if($tidyOutput) {
		$domDocument->preserveWhiteSpace = false;
		$domDocument->formatOutput = true;
	} else {
		$domDocument->preserveWhiteSpace = true;
		$domDocument->formatOutput = false;
	}
	return $domDocument->saveHTML();
}


function tidyHtml($content) {
	$html = $content;

	// Specify configuration
	$config = array(
		'indent'         => true,
		'output-xhtml'   => false,
		'wrap'           => 400);

	// Tidy
	$tidy = new tidy;
	$tidy->parseString($html, $config, 'utf8');
	$tidy->cleanRepair();

	// Output
	return $tidy;
}


function grabContentFromUrl($url) {

	error_reporting(E_ALL);
	$ch = curl_init();
    $host = parse_url($url, PHP_URL_HOST); //Ex: www.google.com
    curl_setopt($ch, CURLOPT_TIMEOUT, 1000);
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.73 Safari/537.36");
    curl_setopt($ch, CURLOPT_REFERER, $host);
	//curl_setopt($ch, CURLOPT_HEADER, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_ENCODING, "");
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_FRESH_CONNECT, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
    //curl_setopt($ch, CURLOPT_SSLVERSION, 3);    

    if(FALSE === ($retval = curl_exec($ch))) {
    	echo curl_error($ch);
    } else {
    	$encoding = mb_detect_encoding($retval, 'UTF-8, ISO-8859-1');

    	if($encoding == 'ISO-8859-1') {
    		$stringEncoded = mb_convert_encoding($retval, 'UTF-8', 'ISO-8859-1');	
    	} else {
    		$stringEncoded = $retval;
    	}

    	$stringEncoded = html_entity_decode($stringEncoded, ENT_QUOTES, 'UTF-8');

    	return $stringEncoded;
    }
}

?>

