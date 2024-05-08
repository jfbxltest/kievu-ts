// import {
// 	getAddressesFromText,
// 	getAddressFromLocation,
// 	getAddresseFromParts,
// } from "./location-IRIS.js";
import sheet from "./input-address.css" with { type: "css" };
/**
 *  Les appels à l'API de geolocalisation doivent être externalisés du composant
 *
 * getAddressesFromText
 * Renvoit un ensemble adresses corresponadant à une saisie partielle
 *
 * getAddressFromLocation
 * Renvoit une adresse à partir d'une coordonnée
 *
 */
``;
const HTML = `
    <div class="address">
			<div class="street">
					<slot></slot>
					<div class="loader">
						<span class="spiner"></span>
					</div>
			</div>
			<button id='action-id'></button>
    </div>
    <div id="select-id" tabindex="0">
        <div class="option"></div>
        <div class="option"></div>
        <div class="option"></div>
        <div class="option"></div>
        <div class="option"></div>
        <div class="option"></div>
        <div class="option"></div>
        <div class="option"></div>
        <div class="option"></div>
        <div class="option"></div>
        <div class="option"></div>
        <div class="option"></div>
    </div>
		`;

class InputAddress extends HTMLElement {
	onAddress = false;
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });
		shadow.adoptedStyleSheets = [sheet];
		shadow.innerHTML = HTML;
	}

	connectedCallback() {
		this.elementSelect = this.shadowRoot.getElementById("select-id");
		this.elementOptions = this.shadowRoot.querySelectorAll(".option");
		this.buttonAction = this.shadowRoot.getElementById("action-id");
		this.elementInput = this.querySelector("#adresse-id");
		this.elementNumber = document.querySelector('[data-address="number"]');
		this.elementPostCode = document.querySelector('[data-address="post-code"]');
		this.elementMunicipality = document.querySelector(
			'[data-address="municipality"]'
		);

		this.elementInput.addEventListener("keyup", (e) => {
			if (e.key === "Escape") {
				this.resetAddress();
				this.hideSelect();
				return;
			} else {
				this.work(this.elementInput.value);
			}
		});

		this.elementInput.addEventListener("blur", (e) => {
			if (e.relatedTarget !== this) {
				this.elementInput.value = "";
				this.hideSelect();
			}
		});

		this.elementSelect.addEventListener("click", (e) => {
			this.updateAdress(e.target.address || e.target.parentNode.address);
			this.hideSelect();
		});

		this.buttonAction.addEventListener("click", (e) => {
			if (e.target.innerText == "X") {
				this.resetAddress();
			} else {
				this.makeGeoPosition();
			}
		});

		this.elementNumber.addEventListener("change", (e) => {
			if (this.onAddress) {
				this.validationAdress();
			}
		});

		this.resetAddress();
	}

	resetAddress() {
		this.buttonAction.innerText = "V";
		this.elementInput.disabled = false;
		this.elementInput.value = "";
		this.elementNumber.value = "";
		this.elementPostCode.value = "";
		this.elementMunicipality.value = "";
		this.elementPostCode.disabled = false;
		this.elementMunicipality.disabled = false;
		// this.elementNumber.disabled = true
		this.elementInput.focus();
		this.onAddress = false
		
	}
	updateAdress(address) {
		this.buttonAction.innerText = "X";
		this.elementInput.disabled = true;
		this.elementInput.value = address.street ?? "";
		this.elementNumber.value = address.number ?? "";
		this.elementPostCode.value = address.postCode ?? "";
		this.elementMunicipality.value = address.municipality ?? "";
		this.elementPostCode.disabled = true;
		this.elementMunicipality.disabled = true;
		if (this.elementNumber.value === "") this.elementNumber.focus();
		this.onAddress = true;
	}

	showSelect() {
		this.elementSelect.style.display = "block";
	}

	hideSelect() {
		this.elementSelect.style = "";
	}

	showLoader() {
		this.shadowRoot.querySelector(".loader").style.display = "flex";
	}
	hideLoader() {
		this.shadowRoot.querySelector(".loader").style = "";
	}

	async work(search) {
		search = search.trim();
		if (search.length > 2) {
			const addresses = await getAddressesFromText(search);

			if (addresses.error === true) {
				console.log("error API", addresses);
			} else {
				this.setListAddresses(addresses, search);
			}
		}
	}

	async validationAdress() {
		const address = {
			street: this.elementInput.value,
			number: this.elementNumber.value,
			postcode: this.elementPostCode.value,
			municipality: this.elementMunicipality.value,
		};
		if (address.street !== "" && address.number !== "") {
			const result = await getAddresseFromParts(address);
			if (result && result[0]) {
				if (result[0].adNc) {
					this.elementPostCode.value = result[0].postCode;
					this.elementMunicipality.value = result[0].municipality;
					this.elementNumber.nextElementSibling.classList.remove("show");
					
				} else {
					this.elementNumber.nextElementSibling.classList.add("show");
					this.elementNumber.focus();
					this.elementNumber.select();
				}
			}
		} else {
			console.log("bad address :", address);
		}
	}

	/**
	 * setListAddresses(addresses, search)
	 *
	 * génère les éléments de la liste d'adresse
	 *  - avec la mise en évidence des termes de la recherche
	 *  - avec les données de l'adresse (dataset)
	 *
	 * @param {[{street, number, postCode, municipality}]} addresses
	 * @param {string} search
	 *
	 */
	setListAddresses(addresses, search) {
		const formateAddress = ({ street, number, postCode, municipality }) => {
			let result = `${street} ${number !== "" ? " " + number + ", " : ""}`;

			if (search && typeof search == "string") {
				search.replace(/ +/g, " ");
				const searchs = search.split(" ");
				searchs.forEach((s) => {
					result = result.replace(new RegExp(s, "i"), (m) => `<%%>${m}</%%>`);
				});
				result = result.replaceAll("%%", "strong");
			}
			result += `<span>${postCode} ${municipality}</span>`;
			return `${result}`;
		};

		if (addresses) {
			this.showSelect();
			const options = this.elementOptions;
			for (let i = 0; i < addresses.length; i++) {
				if (i < options.length) {
					options[i].innerHTML = formateAddress(addresses[i]);
					options[i].address = { ...addresses[i] };
					options[i].style.display = "bloc";
				} else {
					console.log("excessive response from API", i, addresses[i]);
				}
			}
			// cache les options vides
			for (let i = addresses.length; i < options.length; i++) {
				options[i].style.display = "none";
			}
		}
	}

	/**
	 * 
	 * getAddressFromLocation() from OpenStreetMap return a object
	 * getAddressFromLocation() from geoservices.irisnet return a array
	 * 
	 */
	async makeGeoPosition() {
		
		const onSuccess = async (pos) => {
			const address = await getAddressFromLocation(pos.coords);
			console.log("getCurrentPosition, address", address);
			if (address) {
				if (Array.isArray(address)) {
					this.updateAdress(address[0]);
				} else if (address) {
					this.updateAdress(address);
				}
			}
			this.hideLoader();
		};

		const onError = (error) => {
			console.log(error);
			this.hideLoader();
		};
		const options = {
			enableHighAccuracy: true,
			timeout: 15000,
			maximumAge: 0,
		};

		if ("geolocation" in navigator) {
			/* geolocation is available */
			this.showLoader();
			navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
		} else {
			/* geolocation IS NOT available */
			alert("la géo-localisation n'est pas disponible")
		}
	}
}

customElements.define("input-address", InputAddress);
