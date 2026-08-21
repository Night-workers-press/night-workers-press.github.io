# Night Workers — site

Micro-maison d'édition. Site statique, bilingue EN/FR, prêt pour GitHub Pages.
Aucune dépendance, aucun build : il suffit d'ouvrir `index.html`.

## Pages

| Fichier | Contenu |
|---|---|
| `index.html` | Manifeste, l'équipe des trois, les 8 programmes, le livre fondateur |
| `team.html` | L'équipe en détail — un territoire par traducteur |
| `programmes.html` | Les 8 programmes éditoriaux, avec les rayons de couvertures |
| `catalogue.html` | Catalogue complet, filtrable et triable |
| `edgard-bronce-ceray.html` · `sofia-hamett.html` · `charles-hidetamabiveti.html` | Profils + bibliographies |
| `about.html` | Origine du nom, la règle en trois mots, droits et contact |
| `acknowledgements.html` | **Nos dettes** — Sue Lloyd & The Genge Press, Black Coat Press, les archives |
| `book/*.html` | **100 pages livre** — synopsis, métadonnées, extrait de ~1 200 mots, contexte, navigation dans la série |

## Le seul fichier à modifier : `assets/catalogue.js`

Tout le site (compteurs, rayons, catalogue, filtres) se génère à partir de ce fichier.
Ajouter un livre = ajouter une ligne.

```js
{"t":"Titre anglais",
 "sub":"Sous-titre / note en anglais",
 "fr":"Sous-titre / note en français",
 "au":"Auteur original",
 "tr":"Traducteur",
 "prog":"zevaco",
 "ser":"Novels & Diptychs",
 "pos":3,
 "k":"B0XXXXXXXX",
 "p":"B0XXXXXXXX",
 "h":"B0XXXXXXXX",
 "cov":"https://m.media-amazon.com/images/I/....jpg",
 "new":1},
```

| Champ | Rôle |
|---|---|
| `t` | titre (affiché tel quel dans les deux langues) |
| `sub` / `fr` | ligne de description, version EN et version FR |
| `au` | auteur original — sert au filtre « Auteur » |
| `tr` | traducteur — sert au filtre « Traducteur » et aux compteurs d'équipe |
| `prog` | `zevaco` · `rocambole` · `lostfrench` · `lupin` · `gaboriau` · `rostand` · `updated` · `bakumatsu` · `origins` |
| `ser` | série, pour les rayons (`Les Pardaillan`, `Le Capitan`, `Novels & Diptychs`…) |
| `pos` | numéro dans la série |
| `k` / `p` / `h` | ASIN Kindle / broché / relié — les boutons se créent tout seuls |
| `cov` | URL de la couverture ; si absente ou cassée, une couverture typographique s'affiche |
| `new` | `1` pour afficher le badge « new » et apparaître dans le filtre « Récents » |

Tout champ vide peut simplement être omis.

## Compteurs automatiques

N'importe où dans une page :

```html
<span class="js-count"></span>                              <!-- total -->
<span class="js-count" data-prog="zevaco"></span>           <!-- par programme -->
<span class="js-count" data-tr="Sofia E. V. Hamett"></span> <!-- par traducteur -->
<span class="js-count" data-au="Michel Zévaco"></span>      <!-- par auteur -->
```

## Rayons de couvertures

```html
<div class="shelf js-shelf" data-ser="Le Capitan"></div>     <!-- défilement horizontal -->
<div class="grid-cov js-shelf" data-prog="lupin"></div>      <!-- grille -->
```

## Langues

Des éléments frères, l'inactif est masqué en CSS :

```html
<span data-l="en">The Team</span><span data-l="fr">L'équipe</span><span data-l="ja">翻訳者</span>
```

Le choix est retenu dans le navigateur ; au premier passage c'est la langue du
navigateur qui décide (fr → FR, ja → JA, sinon EN).

**Le japonais n'existe que sur `charles-hidetamabiveti.html`** — son bouton 日本語
n'apparaît que là. Si un lecteur choisit le japonais puis navigue ailleurs, la page
retombe automatiquement sur l'anglais sans effacer sa préférence : dès qu'il revient
sur la page de Charles, il est de nouveau en japonais. Pour ouvrir le japonais sur une
autre page, il suffit d'ajouter des `<span data-l="ja">` et le bouton correspondant.

## Mise en ligne (GitHub Pages)

1. Nouveau dépôt, pousser le contenu de ce dossier à la racine.
2. Settings → Pages → Deploy from branch → `main` / `/ (root)`.
3. Remplacer `https://night-workers-press.github.io/` par l'URL réelle dans les balises
   `canonical`, `sitemap.xml` et `robots.txt`.

## Pages livre et SEO

Les 100 pages sous `book/` sont l'essentiel du référencement : chacune porte un
synopsis original en anglais et en français, un extrait d'environ 1 200 mots pris
au début du livre, une note de contexte sur l'auteur, et des liens vers le reste
de la série. Aucun de ces textes n'est repris d'Amazon — pas de contenu dupliqué.

Elles sont **générées** depuis les manuscrits. Pour en régénérer une après avoir
corrigé un titre ou ajouté un ASIN, il suffit d'éditer `assets/catalogue.js` : la
page se met à jour pour tout sauf l'extrait, qui est figé dans le HTML.

### Titres à paraître

36 des 100 titres n'ont pas encore d'ASIN. Ils affichent un badge « à paraître »
et un bouton inactif. Pour publier l'un d'eux :

1. ajouter `"k":"B0…"` et `"p":"B0…"` à sa ligne dans `assets/catalogue.js` ;
2. ajouter `"pub":1` ;
3. dans `book/<slug>.html`, remplacer le bloc `<span class="soon">` par les deux
   boutons Amazon (le gabarit est visible sur n'importe quelle page déjà publiée).

## À compléter

- **Charles Hidetamabiveti** — ses deux volumes Collache n'ont pas encore d'ASIN.
- **Couvertures** — 32 jaquettes sont stockées en local dans `assets/covers/`.
  Pour les autres, la page tente l'image Amazon déduite de l'ASIN, puis retombe
  sur une couverture typographique. Enregistrer une page auteur Amazon
  supplémentaire dans le dossier parent permet d'en récupérer davantage.
- **Rocambole** — la saga est complète côté manuscrits (20 volumes + Les Misères
  de Londres) ; seuls 5 sont publiés sur Amazon.
