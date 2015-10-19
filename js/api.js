

function respondToOffer(token, customer, offerCd, responseCd, channelCd, details) {
	return callApi({action: 'respondToOffer', 
					token: token, 
					customer: customer, 
					offer: offerCd, 
					response: responseCd, 
					channel: channelCd, 
					details: details
				});
}

function getOffersForCustomer(token, customer, channel, maxOffers) {
	return callApi({action: 'getOffers',
					token: token,
					customer: customer, 
					channel: channel,
					maxOffers : maxOffers
				});
}

function getHistoryForCustomer(token, customer) {
	return callApi({action: 'getHistory', 
					token: token, 
					customer: customer
				});
}


function getConfigurationByToken(token) {
	return callApi({action: 'getConfig', 
					token: token
				});
}

function saveConfiguration($config) {
	return callApi({action: 'saveConfig', 
					config: JSON.stringify(configScenario)
				});
}
	

function callApi(parameters) {
	var baseUrl = window.location.protocol + "//" + window.location.host + "/OmniChannelDemo/api/";
	return $.ajax(baseUrl, {
        type: 'POST',
        data: parameters
    } );
}











function readToken() {
	return window.localStorage.omnichanneltoken ? window.localStorage.omnichanneltoken : "";
}


function saveToken(token) {
	window.localStorage.omnichanneltoken = token;
}



function getOfferByCode(offerCode, offerList) {
	var offer = {};
	var offerIndex = getOfferIndexByCode(offerCode, offerList);
	
	if(offerIndex >= 0) {
		offer = offerList[offerIndex];
	}

	return offer;
}


function getOfferIndexByCode(offerCode, offerList) {
	var offerIndex = -1;

	for (var k=0; k < offerList.length; k++) {
		if (offerCode == offerList[k].offerCode) {
			var offerIndex = k;
			break;
		}
	}

	return offerIndex;
}


function getCustomerByLogin(customerLogin, customerList) {
	var customer = {};
	var customerIndex = getCustomerIndexByLogin(customerLogin, customerList);
	
	if(customerIndex >= 0) {
		customer = customerList[customerIndex];
	}

	return customer;
}

function getCustomerIndexByLogin(customerLogin, customerList) {
	var customerIndex = -1;

	for (var k=0; k < customerList.length; k++) {
		if (customerLogin == customerList[k].customerLogin) {
			var customerIndex = k;
			break;
		}
	}

	return customerIndex;
}

function base64_encodeProperties(propertyArray) {
	for (var property in propertyArray) {
		if (propertyArray.hasOwnProperty(property)) {
            if (property) propertyArray[property] = base64_encode(propertyArray[property]);
        }       
    }

    return propertyArray;
}


function base64_decodeProperties(propertyArray) {
	for (var property in propertyArray) {
		if (propertyArray.hasOwnProperty(property)) {
            if (property) propertyArray[property] = base64_decode(propertyArray[property]);
        }       
    }

    return propertyArray;
}


function base64_encode(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function base64_decode(str) {
    return decodeURIComponent(escape(window.atob(str)));
}