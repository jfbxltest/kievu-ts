/**
 *  Fonctions de géo-localisation OPEN STREET MAP
 * https://nominatim.openstreetmap.org/
 *
 *
 */

export async function getAddressFromLocation(location, language = "fr") {
	const { longitude, latitude } = location;

	const parser = (address) => ({
		street: address.road,
		number: address.house_number,
		postCode: address.postcode,
		municipality: address.town,
		coordonates: { x: longitude, y: latitude },
	});

	const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

	let result;
	try {
		const response = await fetch(url);
		result = await response.json();
		console.log("OSM", result);
		return parser(result.address);
	} catch (e) {
		console.log(e);
	}
}
