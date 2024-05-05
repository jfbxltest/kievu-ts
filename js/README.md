# Composants

Custom Elements mis en oeuvre.  
Une liste déroulante
Un module de recherche d'adresse (appel API)

## Geolocalisation

L'api de geolocalisation utilisée est https://geoservices.irisnet.be/localization/

Les descriptifs sont consultables à

- https://geoservices.irisnet.be/localization/SOAP/Localization?wsdl
- https://geoservices.irisnet.be/localization/SOAP/Localization?xsd=1
- https://geoservices.irisnet.be/localization/SOAP/Localization?xsd=2

Les functions utilisées

- Obtenir les adresses par l'auto-completion: _getAdresses_
- Obtenir l'adresse à partir de la localisation de l'utilisateur: _getAddressFromXY_
- Verification de l'adresse: _getAddressesField_

Fonctionnement

- Par littéral:  
  On passe à l'API REST les parametres sous forme de chaîne _querystring_. `url?language=fr&adresses=rue+de+la+loi`

- Par objet:
  on passe à l'API REST le parametre "json" l'objet _json_ OBJECT converti sous forme de chaine `url?language=fr&json=encodeURIComponent(JSON.stringify(OBJECT))`

- De manière générale:

```js
const url = "https://geoservices.irisnet.be/localization/Rest/Localize/";

async function callApiWithObject(endPoint, object) {
	const request =
		url + endPoint + "?json=" + encodeURIComponent(JSON.stringify(params));
	const response = await fetch(request);
	const results = await response.json();
}
```

### Obtenir les adresses par l'auto-completion

getAdresses
https://geoservices.irisnet.be/localization/Rest/Localize/getaddresses?

```js
var object = {
	language: "fr",
	adress: "rue de la loi",
	spatialReference: 4326,
};
callApiWithObject("getaddresses", object);
```

### Obtenir l'adresse à partir de la localisation de l'utilisateur.

GetXyCoordinates  
https://geoservices.irisnet.be/localization/Rest/Localize/getaddressfromxy?

```js
var object = {
	language: "fr",
	point: { x: "149785", y: "170561" },
	SRS_In: "4326",
	SRS_Out: "4326",
};
callApiWithObject("getaddressfromxy", object);
```

Le système de coordonnées à utiliser est le wgs 1984, codifié 4326

## Interface UI

- La geolocalisation est gérée par la page (pas par le composant).  
  _Au chargement de la page est repèré la prise en charge, la demande d'autorisation.
  l'obtention de la localisation qui est asynchrone est effectuée par le composant ???_

- Le control interagit avec le reste du formulaire par le dataset "address" dont les valeurs sont

  - number
  - post-code
  - municipality

  _De ce fait le rendu du control ne se fait que par le slot principal_

- L'activation du `control` se produit à chaque intervention de l'utilisateur.
- Lors de l'activation du `control` les champs code postal et localité sont verouillés.  
  _( Ces champs sont pilotés par le choix de rue)_

- Par défaut le champ adresse mentionne "(utiliser votre position)"
- Un boutton action est créé par le `control`.

  - par défaut: un signe "v" pour valider la position actuelle
  - en cours: un signe "x" pour la réinitialisation

- l'utisateur opte pour renseigner l'adresse par sa position actuelle
  - Appel à l'API GetXyCoordinates
  - tout les champs sont remplis ...
  - possibilité de correction des champ
- l'utilisateur opte pour une saisie manuelle de l'adresse
  - Appel à l'API GetAdresses
  - L'utilisateur choisi une adresse proposée
  - certain champs sont remplis ... (il peut manquer le numéro de rue)
  - possibilité de correction des champ
- Avant soumission:
  - Controle de l'exactitude l'adresse via appel API
