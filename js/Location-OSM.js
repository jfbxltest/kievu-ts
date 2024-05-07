/**
 *  Fonctions de géo-localisation OPEN STREET MAP
 * https://nominatim.openstreetmap.org/
 *
 *
 */
export async function getAddressesFromText(text, language = "fr") {
	const object = {
		language,
		address: text,
		spatialReference: 4326,
	};
	return await callApiWithObject("getaddresses", object);
}

export async function getAddresseFromParts(
	{ street, number, postcode, municipality },
	language = "fr"
) {}

export async function getAddressFromLocation(location, language = "fr") {
	const { lon, lat } = location;

	const parser = (address) => ({
		street: address.road,
		number: address.house_number,
		postCode: address.postCode,
		municipality: address.town,
		coordonates: { x, y },
	});

	const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${y}&lon=${x}`;

	let result;
	try {
		const response = await fetch(url);
		result = await response.json();
		return parser(result.address);
	} catch (e) {
		console.log(e);
	}
}
