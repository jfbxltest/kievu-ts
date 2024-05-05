import { getAddressesFromText, getAddressFromLocation } from "./location.js";
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

const CSS = `
:host {
    position: relative;
		display: inline-block;
}

#select-id {
    display: none;
    cursor: pointer;
    position: absolute;
    width: 100%;
    padding: 5px 0;
    margin: 2px 0 0;
    font-size: 14px;
    background-color: #fff;
    border: 1px solid #ccc;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    -webkit-box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);
}
.option {
    padding: 3px 20px;
    font-weight: 400;
    color: #333;
}
.option:hover {
    background-color: #801337;
    color: white;
}
.option>span {
  font-style: italic;
  font-weight: 500;
  color: #939292;
  font-size: 12px;
  white-space: nowrap;
}
.address {
	display: flex;
}
.street {
	flex-grow: 1;
}
button {
  width: 32px;
  font-weight: 900;
}
`;
const HTML = `
    <style>${CSS}</style>
    <div class="address">
			<div class="street">
					<slot></slot>
			</div>
			<button id='action-id'></button>
    </div>
    <div id="select-id">
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
	constructor() {
		super();
		const shadow = this.attachShadow({ mode: "open" });
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

		this.addEventListener("blur", (e) => {
			this.hideSelect();
		});

		this.elementSelect.addEventListener("click", (e) => {
			this.updateAdress(e.target.address);
			this.hideSelect();
		});

		this.buttonAction.addEventListener("click", (e) => {
			if (e.target.innerText == "X") {
				this.resetAddress();
			} else {
				this.makeGeoPosition();
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
		this.elementInput.focus();
	}
	updateAdress(address) {
		this.buttonAction.innerText = "X";
		this.elementInput.disabled = true;
		this.elementInput.value = address.street ?? "";
		this.elementNumber.value = address.number ?? "";
		this.elementPostCode.value = address.postCode ?? "";
		this.elementMunicipality.value = address.municipality ?? "";
		if (this.elementNumber.value === "") this.elementNumber.focus();
	}

	showSelect() {
		this.elementSelect.style.display = "block";
	}

	hideSelect() {
		this.elementSelect.style = "";
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
					options[i].address = addresses[i];
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

	async makeGeoPosition() {
		const onSuccess = async (pos) => {
			const address = await getAddressFromLocation(pos.coords);
			if (address && address[0]) {
				this.updateAdress(address[0]);
			}
		};

		const onError = (error) => console.log(error);

		const options = {
			enableHighAccuracy: true,
			timeout: 15000,
			maximumAge: 0,
		};

		if ("geolocation" in navigator) {
			/* geolocation is available */
			navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
		} else {
			/* geolocation IS NOT available */
		}
	}
}

customElements.define("input-address", InputAddress);
