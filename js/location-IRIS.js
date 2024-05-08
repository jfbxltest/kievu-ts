/**
 *  Fonctions de géo-localisation geoservices IRISnet
 * https://geoservices.irisnet.be/localization
 *
 * old:
 * http://service.gis.irisnet.be/urbis/
 *
 */

/**
 * getAddressesFromText
 *
 * @param {
 * } text
 * @param {*} language
 * @returns
 */
export async function getAddressesFromText(text, language = "fr") {
	const object = {
		language,
		address: text,
		spatialReference: 102100,
	};
	return await callApiWithObject("getaddresses", object);
}

/**
 * getAddresseFromParts
 *
 * @param {*} param0
 * @param {*} language
 * @returns
 */
export async function getAddresseFromParts(
	{ street, number, postcode, municipality },
	language = "fr"
) {
	const object = {
		language,
		address: {
			street: {
				name: street,
				postcode,
				municipality,
			},
			number,
		},
		spatialReference: 102100,
	};
	return await callApiWithObject("getaddressesfields", object);
}

/**
 * getAddressFromLocation
 *
 * @param {*} location
 * @param {*} language
 * @returns
 */
export async function getAddressFromLocation(location, language = "fr") {
	const { x, y } = locationToPoint(location);
	const object = {
		language,
		point: { x, y },
		SRS_In: "102100",
		SRS_Out: "102100",
	};
	return await callApiWithObject("getaddressfromxy", object);
}

async function callApiWithObject(endPoint, object) {
	const parser = (result) => ({
		id: result.address.street.id,
		street: result.address.street.name,
		number: result.address.number,
		postCode: result.address.street.postCode,
		municipality: result.address.street.municipality,
		coordonates: result.point,
		adNc: result.adNc,
		qualification: result.qualificationText,
	});

	const url = `https://geoservices.irisnet.be/localization/Rest/Localize/${endPoint}?json=`;
	const request = url + encodeURIComponent(JSON.stringify(object));
	let result;

	try {
		const response = await fetch(request);
		result = await response.json();
	} catch (e) {
		console.log("callApiWithObject", e);
		return;
	}

	if (result.result) {
		if (Array.isArray(result.result)) {
			return result.result.map((r) => parser(r));
		} else {
			return [parser(result.result)];
		}
	} else {
		console.log("callApiWithObject", result);
	}
}

/**
 * Formules de convertion coordonnées Wgs84 / WebMercator
 *
 * https://stackoverflow.com/a/60205803
 *
 *
 *(autre source)
 * http://dotnetfollower.com/wordpress/2011/07/javascript-how-to-convert-mercator-sphere-coordinates-to-latitude-and-longitude/
 */
const Wgs84EquatorialRadius = 6378137;
const Wgs84MetersPerDegree = (Wgs84EquatorialRadius * Math.PI) / 180;

/**
 * convertion Wgs84 (lon/lat)> WebMercator (x/y)
 * @param {longitude, latitude} location
 * @returns {x, y}
 */
function locationToPoint({ longitude, latitude }) {
	return {
		x: Wgs84MetersPerDegree * longitude,
		y: Wgs84MetersPerDegree * latitudeToY(latitude),
	};
}
function latitudeToY(lat) {
	if (lat <= -90) return Number.NEGATIVE_INFINITY;
	if (lat >= 90) return Number.POSITIVE_INFINITY;

	return (Math.log(Math.tan(((lat + 90) * Math.PI) / 360)) * 180) / Math.PI;
}

/**
 * convertion WebMercator (x/y) > Wgs84 (lat/lon)
 * @param {x, y} point
 * @returns {lat, lon} location
 */
function pointToLocation({ x, y }) {
	return {
		lat: yToLatitude(y) / Wgs84MetersPerDegree,
		lon: x / Wgs84MetersPerDegree,
	};
}
function yToLatitude(y) {
	return 90 - (Math.atan(Math.exp((-y * Math.PI) / 180)) * 360) / Math.PI;
}
