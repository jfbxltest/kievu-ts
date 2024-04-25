const CSS = `
:host {
    position: relative;
}

.select {
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
`;
const HTML = `
    <style>${CSS}</style>
    <div>
        <slot></slot>
    </div>
    <div class="select">
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
    </div>`;

const msgErr = {};
const getQueryAddressURL = (searchValue) => `
https://geoservices.irisnet.be/localization/Rest/Localize/getaddresses?language=fr&address=${searchValue}&spatialReference=31370`;

class InputAddress extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = HTML;
  }
  connectedCallback() {
    const child = this.children[0];
    if (
      !child instanceof HTMLInputElement ||
      child.getAttribute("type") !== "text"
    ) {
      throw new Error('pas possible: il faut un élément <input type="text"> ');
    }

    child.addEventListener("keyup", () => {
      const text = child.value.trim();
      if (text.length > 2) {
        this.work(text);
      }
    });

    this.select.addEventListener("click", (e) => {
      child.value = e.target.innerText;
      this.hideSelect();
    });
  }

  get select() {
    return this.shadowRoot.querySelector(".select");
  }
  get options() {
    return this.shadowRoot.querySelectorAll(".option");
  }

  showSelect() {
    this.select.style.display = "block";
  }

  hideSelect() {
    this.select.style = "";
  }

  formateAddress(address) {
    return `${address.street} ${
      address.number !== "" ? " " + address.number + ", " : ""
    }${address.postCode} ${address.municipality}`;
  }

  async work(text) {
    const addresses = await this.callApiWithtext(text);
    if (addresses) {
      this.showSelect();
      const options = this.options;
      addresses.forEach((address, i) => {
        if (i < options.length) {
          options[i].innerText = this.formateAddress(address);
        } else {
          console.log("exesives response from API", i, address);
        }
      });
    }
  }

  async callApiWithtext(text) {
    const JSON = await fetch(getQueryAddressURL(text));
    const response = await JSON.json();

    if (response.error === true) {
      console.log("error API", response);
    } else {
      if (Array.isArray(response.result)) {
        return response.result.map((r) => ({
          street: r.address.street.name,
          number: r.address.number,
          postCode: r.address.street.postCode,
          municipality: r.address.street.municipality,
        }));
      }
    }
  }
}

customElements.define("input-address", InputAddress);
