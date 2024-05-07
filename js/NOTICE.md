# Custom element `input-address`

## Intégration

L'intégration HTML se fait en 2 temps :

1. L'icorporation du fichier source et des fonctions de localisation (notez l'ordre) :

```html
<head>
	...
	<script src="js/location.js" type="module" defer></script>
	(1er)
	<script src="js/input-address.js" type="module" defer></script>
	(2nd) ...
</head>
```

- _Le composant requiert les fonctions (présentes dans `js/location.js`)_
  - `getAddressesFromText` (une liste d'adresses qui avoisinent la saisie)
  - `getAddressFromLocation` (une adresse depuis une géo-localisation)

2. L'implémentation du contrôle :

```html
<body>
	...
	<input-address>
		<input
			type="text"
			placeholder="(utiliser la position actuelle)"
			autocomplete="off"
		/>
	</input-address>
	...
</body>
```

- _Notez les attributs (optionnels)_
  - `placeholder` (invite à la géo-localisation via le "bouton action")
  - `autocompete="off"` (évite l'interaction du navigateur)

## Descriptif

### Composition

Le controle personnalisé (custom element) `input-address` est composé de 3 éléments:

- La _Zone de Texte Adresse_ (ZTA\*) `<input type="text" ... >`(récuperée par slot) doit être l'enfant de `input-address`

- Le _Button To Action_ (BTA\*) `<button>` créé automatiquement (dans le "shadow DOM") qui permet (selon son état):
  - V -> l'appel à la géo-localisation
  - X -> la ré-initialisation de la ZTA\*  
    <br>
- une liste d'options `<div>` également créée automatiquement qui sera remplie d'adresses suggérées.

### Mise en forme (les styles CSS)

- Si il y a la possibilité d'importer une feuille de style CSS, on exploite la propriété `adoptedStyleSheets` du shadow DOM pour importé `input-address.styles.css`.

- Sinon (old-school) le style est directement codé dans le fichier `input-address.js` et injecté. (`shadowRoot.innerHTML = <style> ... </style>`)

### Fonctionnement

- Etat initial :

  - La ZTA\* est vide (et affiche le "placeholder" pour inviter à la géo-localisation)
  - Le BTA\* est dans l'état "V" (click pour géo-localisation)

- Lorsque la ZTA\* est modifiée (saisie utilisateur) :

  - Appel à l'API "getAddresses" : une liste d'adresses est affichée.
  - Le BTA\* est toujours dans l'état "V"

- Lorsque une adresse est selectionée (click dans la liste) :

  - La ZTA\* est remplie par le nom de rue de l'adresse sélectionnée.
  - Envoi d'un message avec les données de l'adresse (cf. API)
  - Le BTA\* passe à l'état "X" (click pour annulation)

- Si click exterieur (perte de focus) :
  - La ZTA\* est vidée (`value=""`)
  - Le BTA\* re-passe à l'état "V" (???)
  - La liste d'adresses est masquée

## API

L'idée est que le composant soit utilisé das un contexte autonome et indépendant.  
Le contexte est (normalement) un formulaire dont la ZTA est un champ.  
L'utilisation que fait l'utilisateur du composant doit envoyer des informations au formulaire (adresse complète par géo-localisation ou QUE le nom de rue avec la localité et code postal).  
Mais le composant n'a pas de référence vers le formulaire (et ne doit pas en avoir), il envoie juste un message qui sera capturé et exploité.

### Le message personnalisé `addresschange`

est émis par :

```js
this.dispatchEvent( new CustomEvent('addresschange', {
    detail: {
      address: { id, adNc?, street, number?, postCode, municipality, coordonates? },
      state: { }
    }
  })
)
```

et capturé par :

```js
document.addEventListener("addresschange", (e) => {
	const data = e.detail;
});
```

Libre au système d'exploité ces données (remplir les différents champs, politique de validation, etc.)
|Address| Descriptif |
|-------------|----------------------------------------------- |
|id | id (unique) de la rue |
|adNc | id (unique) de l'adresse (rue+numéro+localité) |
|street | nom de la rue (traduit) |
|number | numéro de l'habitation |
|postCode | code postal (xxxx) |
|municipality | localité (traduite) |
|coordonates | coordonnées GPS (x / y) |

## Exemple de mise en oeuvre

Soit un formulaire d'adresse contenant les champs adresse, numéro, CP, Localité.

Un script capturant le message `addresschange` met à jour les diférents champs `element.value = e.detail.address.data`.

### Le Bon Numéro

Le champs 'numéro' est problématique. En effet :

- Par géo-localisation le 'numéro' est approximatif.
- Lors d'une selection d'une adresse proposée, le 'numéro' est absent: l'utilisateur doit alors le précisser.
- Une rue peut être sur 2 communes.

La saisie (ou modification) du numéro DOIT donc entrainer :

- Le contrôle de l'adresse (rue+numéro existe?)
- La mise à jour AUTOMATIQUEMENT du code postal et de la localité.

Cela ne se réalise que par un appel supplémentaire à une API, implémenté par la function `getAddresseFromParts` (fonction présente dans le fichier 'js/location.js')  
Cette function renvoie les informations nécessaires. 👍
