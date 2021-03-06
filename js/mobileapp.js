var configScenario = {};
configScenario.currentChannel = "Mobile";
configScenario.selectedCustomer = "";
configScenario.currentOffers = [];
var map;

/**
* on document ready
*/
function onMobileAppReady() {

	// token could be in form of AP%2BEMcxz (AP+EMcxz) we need to apply decodeURI when ever we read from URL.
	var token = decodeURIComponent(location.href.split("#")[1]);
	
	console.log("onMobileAppReady getToken: " + token);

	getConfigurationByToken(token).done(function (config) {
		configScenario = config;
		configScenario.currentChannel = "Mobile";
		console.log("maxOffers from config " + token + ": " + configScenario.mobileApp.maxOffersMobile);
		updateMobileAppUI();
	});
}

function updateMobileAppUI() {
	// add listeners on map move (drag and drop)
	
	//google.maps.event.addListener(marker, 'dragend', function() { alert('marker dragged'); } );

	// adding available customers to datalist
	$('#dataList_customers').html('');
	for (i = 0; i < configScenario.customers.length; i++) { 
		$('#dataList_customers').append('<option value="'+ configScenario.customers[i].customerLogin + '">' 
			+ configScenario.customers[i].firstName + ' ' + configScenario.customers[i].lastName + '</option>') ;
	}

	//for demo upgrade purpose - mobileTheme does not exist in config.json of older version
	if(!configScenario.mobileApp.mobileTheme) {
		configScenario.mobileApp.mobileTheme = "b";
	}

	$('#mobilePage').addClass('ui-page-theme-' + configScenario.mobileApp.mobileTheme);
	if (configScenario.mobileApp.mobileTheme != "b") {
		removeBtnActive();
	}

	$('#submitBtn').val(configScenario.mobileApp.login_button_text);
	$('#titleMobileApp').html("Mobile App");
	$('#tokenLoad').val(configScenario.token);
	$('#homeBackground').attr('src', configScenario.mobileApp.homescreen_image);
	/*$(".homeImage").css("background", "url(" + configScenario.mobileApp.homescreen_image + ") no-repeat ");
	$(".homeImage").css("-webkit-background-size", "cover");
	$(".homeImage").css("background-size", "cover");
	$(".homeImage").css("background-size", "100% 100%");*/

	$('#titleMobileApp').html(configScenario.mobileApp.title_mobile_app);
	$('#submitBtn').html(configScenario.mobileApp.login_button_text);

	if(configScenario.mobileApp.appIcon_image != "") {
		$('#appleTouchIcon').attr('href', configScenario.mobileApp.appIcon_image);
		$('#shortcutIcon').attr('href', configScenario.mobileApp.appIcon_image);
	} else {
		$('#appleTouchIcon').attr('href', "images/configurator_icon.png");
		$('#shortcutIcon').attr('href', "images/configurator_icon.png");

	}
	
	$('#shortcutIcon').attr('href', configScenario.mobileApp.appIcon_image);
	$("body").css("overflow", "hidden");
}

function onResetDemoBtn(element) {
	console.log("reset demo for token " + configScenario.token);
	resetDemo(configScenario.token);
	window.location.href='#';
	onNavHomeBtn();
	$('#navHome').removeClass('ui-btn-active');
	$('#navLogin').removeClass('ui-btn-active');
	$('#navOffer').removeClass('ui-btn-active');
}

function onNavLoginBtn(element) {
	hideAll();
	$('#loginPage').show();
	$('#titleMobileApp').html('Login');
	slidePage('#loginPage', 'right');

	if (configScenario.mobileApp.mobileTheme != "b") {
		removeBtnActive();
	}
}

function onNavMapBtn(element) {
	hideAll();
	$('#titleMobileApp').html(configScenario.mobileApp.title_geo_offer_panel);
	$('#mapPage').show();

	// get Geo Offer Information
	$('#imgGeoOffer').attr('src', getOfferImageByCode('geo_offer',configScenario.nba));
	$('#titleGeoOffer').html(getOfferNameByCode('geo_offer',configScenario.nba));
	console.log('getOfferImage: ' + getOfferImageByCode('geo_offer',configScenario.nba));

	var defaultLatLng = new google.maps.LatLng(
		configScenario.mobileApp.geo_latitude, configScenario.mobileApp.geo_longtitude);
	drawMap(defaultLatLng);

	if (configScenario.mobileApp.mobileTheme != "b") {
		removeBtnActive();
	}

	/*if ( navigator.geolocation ) {
		function success(pos) {
			// Location found
			drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
		}
		function fail(error) {
			drawMap(defaultLatLng);// Failed to find location, show default map
		}
		// Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
		navigator.geolocation.getCurrentPosition(success, fail, {maximumAge: 500000, enableHighAccuracy:true, timeout: 6000});
	} else {
		drawMap(defaultLatLng);// No geolocation support, show default map
	}*/
}

function onNavHomeBtn(element) {
	hideAll();
	$('#titleMobileApp').html('Mobile App');
	slidePage('#homePage', 'left');

	if (configScenario.mobileApp.mobileTheme != "b") {
		removeBtnActive();
	}
}

function onNavOfferBtn(element) {
	//$('#titleMobileApp').html(configScenario.mobileApp.title_offer_panel);
	hideAll();
	$('#titleMobileApp').html('Offers');
	slidePage('#offerPage', 'right');

	if (configScenario.mobileApp.mobileTheme != "b") {
		removeBtnActive();
	}
}

function onSelectCustomerBtn(element) {
	var customerLogin = $('#inputCustomerLogin').val();
	if(customerLogin == "") return;

	configScenario.selectedCustomer = getCustomerByLogin(customerLogin, configScenario.customers);

	loadOffers().done(function () {
		displayOffers();
	});	

	onNavOfferBtn();
	$('#navOffer').addClass('ui-btn-active');
	$('#navHome').removeClass('ui-btn-active');
	$('#navLogin').removeClass('ui-btn-active');

	changeHeaderNavButton('navIconLeft','ui-icon-bars','$("#leftPanel").panel("open");');
}


function onLoadConfigurationBtn(element) {
	var token = $('#tokenLoad').val();
	if(token == "") return;
	window.location.href='#';
	loadConfiguration(token);
}

function loadConfiguration(token) {
	getConfigurationByToken(token).done(function (config) {
    	configScenario = config;
    	updateMobileAppUI();
    });
}

function loadOffers() {
	var token = configScenario.token;
	var customer = configScenario.selectedCustomer.customerLogin;
	var channel = configScenario.currentChannel;
	var maxOffers = configScenario.mobileApp.maxOffersMobile;
	return getOffersForCustomer(token, customer, channel, maxOffers, true).done(function (offers) {
			//console.log("Offers Loaded..."); 
			// store result in currentOffers - but transform response
			configScenario.currentOffers = offers.map(function (offerItem) {
				var offer = getOfferByCode(offerItem.offer, configScenario.nba);
				offer.score = offerItem.score;
				return offer;
			});
		});
}


function displayOffers() {
	// assume offers are stored in configScenario.currentOffers
	offerList = configScenario.currentOffers;
	
	$('#nba_table').html('');

	var countNBO = offerList.length;
  	$('#titleMobileApp').html(countNBO + ' Top Offers');
  	
  	var htmlOfferList = '<ul data-role="listview" id="offerList">';
  	for (var i=0; i<countNBO; i++) {
  		var offer = offerList[i];
   		
  		if ( offer.offerName != "Default Offer" && offer.offerName != null ) {
			//console.log("[displayOffers] offerCode=" + offer.offerCode + " offerName=" + offer.offerName);
  				
  			htmlOfferList += "<li><a onclick=\"showOfferDetails('" + offer.offerCode + "');\" >"
	   			+"<img src=\"" + offer.offerImg + "\" height=\"100\" class='nbaItemImage'>"
	   			+"<h2>" + offer.offerName + "</h2><p></p></a></li>";	
	   	} else {
			countNBO = countNBO-1;
		}
  	}
  	htmlOfferList += '</ul>';

  	$("#numberOfOffers").html(countNBO);
  	$('#nba_table').html( htmlOfferList ).trigger('create');
  	
  	hideAll();
  	slidePage('#offerPage', 'up');
}

function changeHeaderNavButton(elementid, icon, onClickFunction) {
	$('#' + elementid).removeClass('ui-icon-bars');
	$('#' + elementid).removeClass('ui-icon-carat-l');
	$('#' + elementid).removeClass('ui-icon-carat-r');

	$('#' + elementid).addClass(icon);
	$('#' + elementid).attr('onclick', onClickFunction);
}

function showOfferDetails(offerCode) {
	hideAll();
	changeHeaderNavButton('navIconLeft','ui-icon-carat-l','onSelectCustomerBtn(this);');

	$('#offerDetails').toggle();
	var offer = getOfferByCode(offerCode, configScenario.nba);
	
	$('#offerDetailsLabel').html(offer.offerName);
	$('#offerDetailsDescription').html(offer.offerDesc);
	$('#offerDetailsImage').attr('src', offer.offerImg);

	// set the offerCode as a hidden value
	$('#offerDetailsOfferCode').val(offerCode);

	// track response of offer details click 
	var token = configScenario.token;
	var customer =configScenario.selectedCustomer.customerLogin;
	var channel = configScenario.currentChannel;
	var details = "";
	respondToOffer(token, customer, offerCode, "show interest", channel, details)
	  .done(function(){
	});

}

function onResponseBtnClick(element, response) {
	changeHeaderNavButton('navIconLeft','ui-icon-bars','$("#leftPanel").panel("open");');

	//read the offerCode from the hidden value
	var token = configScenario.token;
	var customer =configScenario.selectedCustomer.customerLogin;
	var channel = configScenario.currentChannel;
	var offerCode = $('#offerDetailsOfferCode').val();
	var details = "";

	respondToOffer(token, customer, offerCode, response, channel, details)
	  .done(function(){
		slidePage('#offerDetails', 'right', 'hide');

		loadOffers().done(function () {
			displayOffers();
		});

	  });
}

function onGeoResponseBtnClick(element, response) {
	changeHeaderNavButton('navIconLeft','ui-icon-bars','$("#leftPanel").panel("open");');

	//read the offerCode from the hidden value
	var token = configScenario.token;
	var customer = $('#inputCustomerLogin').val();
	var channel = 'Geolocation';
	var offerCode = 'geo_offer';
	var details = "";

	respondToOffer(token, customer, offerCode, response, channel, details)
	  .done(function(){
	  	// do nothing
	  });

	$('#popupGeoOffer').popup('close');
}

function onGetPositionBtnClick(element) {
	changeHeaderNavButton('navIconLeft','ui-icon-bars','$("#leftPanel").panel("open");');

	//read the offerCode from the hidden value
	var token = configScenario.token;
	var customer = $('#inputCustomerLogin').val();
	var channel = 'Geolocation';
	var offerCode = 'geo_offer';
	var details = "";
	var response = 'open popup';

	respondToOffer(token, customer, offerCode, response, channel, details)
	  .done(function(){
	  	// do nothing
	  });
}

function hideAll() {
	$('#homePage').hide();
	$('#offerPage').hide();
	$('#loginPage').hide();
	$('#offerDetails').hide();
	$('#mapPage').hide();
}

function slidePage(pageId, direction, type) {
	var effect = 'slide';
    // Set the options for the effect type chosen
    var options = { direction: direction };

    // Set the duration (default: 400 milliseconds)
    var duration = 400;
    if(type == "hide") {
    	$(pageId).hide(effect, options, duration); 
	} else {
    	$(pageId).show(effect, options, duration);
    }
}


function drawMap(latlng) {
	var myOptions = {
		zoom: parseInt(configScenario.mobileApp.geo_zoom),
		center: latlng,
		mapTypeControl: false,
		zoomControl: false,
		streetViewControl: false,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("mapPageInner"), myOptions);
	
	google.maps.event.addListener(map, 'dragend', function() { 
		// update latitude and longtitude
		$('#mapLatPosition').html('' + map.getCenter().lat());
		$('#mapLngPosition').html('' + map.getCenter().lng()); 
	} );
	// Add an overlay to the map of current lat/lng
	var marker = new google.maps.Marker({
		position: latlng,
		draggable: true,
		icon: configScenario.mobileApp.map_pin_image,
    	animation: google.maps.Animation.DROP,
		map: map,
		title: "Greetings!"
	});

	// display latitude and longtitude (first time)
	$('#mapLatPosition').html('' + map.getCenter().lat());
	$('#mapLngPosition').html('' + map.getCenter().lng());
}

function removeBtnActive() {
	$('#navHome').removeClass('ui-btn-active');
	$('#navLogin').removeClass('ui-btn-active');
	$('#navOffer').removeClass('ui-btn-active');
	$('#navMap').removeClass('ui-btn-active');
	
}
