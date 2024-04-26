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

    child.addEventListener("keyup", () => this.work(child.value));

    this.elementSelect.addEventListener("click", (e) => {
      console.log(e.target.innerHTML, e.target.innerText);
      child.value = e.target.innerText;
      child.dataset.address = e.target.dataset.address;
      this.hideSelect();
    });
  }

  get elementSelect() {
    return this.shadowRoot.querySelector(".select");
  }
  get elementOptions() {
    return this.shadowRoot.querySelectorAll(".option");
  }

  showSelect() {
    this.elementSelect.style.display = "block";
  }

  hideSelect() {
    this.elementSelect.style = "";
  }

  formateAddress({ street, number, postCode, municipality }, search) {
    let result = `${street} ${
      number !== "" ? " " + number + ", " : ""
    }${postCode} ${municipality}`;

    if (search && typeof search == "string") {
      search.replace(/ +/g, " ");
      const finded = [];
      const searchs = search.split(" ");
      searchs.forEach((s) => {
        result = result.replace(new RegExp(s, "i"), (m) => `<%%>${m}</%%>`);
      });
      result = result.replaceAll("%%", "strong");
    }
    return result;
  }

  async work(search) {
    search = search.trim();
    if (search.length > 2) {
      this.callApiWithCallback(search, this.setAddresses.bind(this));
    }
  }

  setAddresses(addresses, search) {
    if (addresses) {
      this.showSelect();
      const options = this.elementOptions;
      for (let i = 0; i < addresses.length; i++) {
        if (i < options.length) {
          options[i].innerHTML = this.formateAddress(addresses[i], search);
          options[i].dataset.address = JSON.stringify(addresses[i]);
          options[i].style.display = "bloc";
        } else {
          console.log("excessive response from API", i, addresses[i]);
        }
      }
      // cache les options vides
      for (let i = addresses.length; i < options.length; i++) {
        options[i].style.display = "";
      }
    }
  }

  async callApiWithCallback(search, callback) {
    const response = await fetch(getQueryAddressURL(search));
    const results = await response.json();

    if (results.error === true) {
      console.log("error API", results);
    } else if (Array.isArray(results.result)) {
      const addresses = results.result.map((r) => ({
        id: r.address.street.id,
        street: r.address.street.name,
        number: r.address.number,
        postCode: r.address.street.postCode,
        municipality: r.address.street.municipality,
        coordonates: r.point,
      }));

      callback(addresses, search);
    }
  }
}

customElements.define("input-address", InputAddress);
