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

    this.elementSelect.addEventListener("click", (e) => {
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
      const searchs = search.split(" ");
      searchs.forEach((s) => {
        result = result.replace(
          new RegExp(s, "i"),
          (m) => `<strong>${m}</strong>`
        );
      });
    }
    return result;
  }

  async work(text) {
    this.callApiWithtext(text).then((addresses) => {
      if (addresses) {
        this.showSelect();
        const options = this.elementOptions;
        addresses.forEach((address, i) => {
          if (i < options.length) {
            options[i].innerHTML = this.formateAddress(address, text);
            options[i].dataset.address = JSON.stringify(address);
            options[i].style.display = "bloc";
          } else {
            console.log("exesives response from API", i, address);
          }
        });
        // cache les options vides
        for (let i = addresses.length; i < options.length; i++) {
          options[i].style.display = "";
        }
      }
    });
  }

  async callApiWithtext(text) {
    return fetch(getQueryAddressURL(text))
      .then((response) => response.json())
      .then((result) => {
        if (result.error === true) {
          console.log("error API", result);
        } else if (Array.isArray(result.result)) {
          return result.result.map((r) => ({
            id: r.address.street.id,
            street: r.address.street.name,
            number: r.address.number,
            postCode: r.address.street.postCode,
            municipality: r.address.street.municipality,
            coordonates: r.point,
          }));
        }
      })
      .catch((error) => console.log(error));
  }
}

customElements.define("input-address", InputAddress);
