# Bestiaire

Source principale : chapitre 5, section `Bestiaire de la Lémurie` et `Table de création des créatures`.

Ce fichier sert de catalogue de travail pour le projet, en priorité à partir des créatures déjà présentes dans les seeders.

## Créatures actuellement disponibles dans le projet

- Andrak
- Anguille chasseresse
- Azhdarkho
- Banth
- Béhémathon
- Bubalus
- Bronyx
- Cathgan
- Chark
- Coursier des sables
- Crocator
- Dinohyus
- Deodarg
- Dracophon
- Drakk
- Elasmotherium
- Eldaphon
- Fangeux
- Frossor
- Ganuc
- Jemadar
- Jit
- Kalathorn
- Kroark
- Kyphus
- Loup
- Loup géant
- Mythunga
- Ours des cavernes / ours polaire
- Phong
- Parvalus
- Phororacos
- Poad
- Purgat
- Sardolith
- Scorpion-araignée
- Scorpion-araignée géant
- Singe des neiges
- Triotaur
- Ursavus
- Uzeg
- Venator
- Ver des glaces
- Xolag
- Xolth
- Yorth
- Zathog
- Main cavaleuse
- Nécropède
- Nécrophage

### Bestiaire du Beshaar (*La Perle du Beshaar*, p. 24-35)

- Chien de Zaggath
- Dyrhunga
- Dragon de feu
- Essaim de fourmis d'os (pas de profil dans le livre : vitalité 30 = les dégâts qui dispersent la nuée)
- Hyène du Beshaar
- Meneuse de meute (hyène du Beshaar)
- Hyène géante
- Qal'efr (pieuvre des sables) (dégâts `d6M+1` des tentacules ; la morsure `d6Bx2` est en commentaire)
- Spicomallos
- Ver des sables
- Gardien de bronze
- Momie noire d'humain
- Momie noire de coursier des sables

La slorth couronnée (Mélèshu, p. 35) est une rivale à carrières : elle relève des PNJ, pas de ce catalogue.

### Bestiaire du Khanat (*Chroniques Lémuriennes 1.2*, p. 20-26)

- Arctodus
- Bubalus des neiges
- Eucladocéros (esprit -1 à 3 selon l'individu : -1 retenu)
- Morska (profil dans l'eau ; sur terre ferme : Agilité -2, Attaque +0, en commentaire)
- Tigre bleu
- Xalibu
- Yi qi
- Gardien du Royaume Putride (agilité et défense avec l'armure)
- Leng shi (pas d'attaque : dégâts d3 = son hurlement)
- Mogmaï (pas de profil dans le livre : attaque et dégâts de sa volée d'objets, vitalité 1 = le phylactère, taille « Moyenne » retenue)
- Windoku

## Utilisation

- Ce catalogue est une base rapide pour vérifier les noms disponibles côté projet.
- Pour une créature précise, les stats de référence restent dans `backend/database/seeders/BolCreatureSeeder.php`.
- Quand une nouvelle créature est ajoutée, mettre à jour ce fichier en même temps que le seeder.
