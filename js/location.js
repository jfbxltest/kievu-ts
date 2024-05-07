import {
	getAddressesFromText,
	// getAddressFromLocation,
	getAddresseFromParts,
} from "./location-IRIS.js";

import { getAddressFromLocation } from "./Location-OSM.js";

window.getAddressesFromText = getAddressesFromText;
window.getAddressFromLocation = getAddressFromLocation;
window.getAddresseFromParts = getAddresseFromParts;
// console.log(window);
