# Avantages

Catalogue de travail basé sur le PDF, sa mise à jour Mythic+ (`doc/pdf-text/07-maj-mythic-plus.txt`) et le seeder
`backend/database/seeders/BolAvantageSeeder.php`.

## Remarques

- Certains avantages donnent un `dé de bonus` sur un domaine précis.
- D'autres modifient directement un attribut ou une ressource.
- Pour l'implémentation, conserver le nom exact comme clé de référence.

## Liste

- Agilité de l’homme-oiseau
- Ami des bêtes
- Ami des céruléens
- Amis dans la pègre
- Amis haut placés
- Arme favorite
- Artiste
- Athlète
- Attirant
- Bagarreur
- Baudrier de guerre
- Beau parleur
- Bibliothèque savante
- Bien né
- Colosse
- Combat à l’aveugle
- Cri de guerre
- Discret
- Doigts de fée
- Dur à cuire
- Envoûtant (Mythic+)
- Érudit
- Fêtard
- Fils des plaines
- Fortuné
- Gamin des rues
- Inspirateur
- Intimidant
- Intrépide
- Laboratoire fourni
- Magie des Rois-Sorciers
- Mains guérisseuses
- Maître artisan (Mythic+)
- Maître du déguisement
- Marqué par les dieux
- Montagnard
- Né en selle
- Odorat développé
- Ouïe fine
- Outillage
- Peau dure
- Perspicace
- Pied marin
- Pisteur des marais
- Poings d’acier
- Pouvoir du Néant
- Prestance (Mythic+)
- Récupération rapide
- Renard du désert
- Résistant à la magie
- Résistant aux poisons
- Roi de la jungle
- Roi de l’évasion
- Santé de fer
- Savant
- Sentir la magie
- Tigre des neiges
- Tireur puissant
- Vigilant
- Vigueur céruléenne
- Vision nocturne
- Vue perçante

## Cas utiles à garder en tête

- `Arme favorite` : lié à une arme précise.
- `Baudrier de guerre` : traite un cas d'armure moyenne sans malus standard.
- `Magie des Rois-Sorciers` et `Pouvoir du Néant` : structurants pour les lanceurs de sorts.
- `Prestance` (Mythic+) : `+1 aura`, maximum 6, maximum de départ 4, comme `Savant` pour l'esprit.
- `Maître artisan` (Mythic+) : exige la carrière forgeron ; points de création comme un alchimiste (égaux au rang de forgeron),
  mais seulement pour armes, armures et outils de qualité courante ou rare. Un alchimiste maître artisan cumule les deux réserves.
- `Envoûtant` (Mythic+) : exige la carrière tentatrice ; une fois par jour, l'aide de `aura + d6` piétailles.
