# DICEWAY

Le projet s'appuie sur deux répertoires de travail principaux :

- `front/` : frontend Angular principal
- `backend/` : backend Laravel principal

## Priorités

- Pour tout travail frontend, intervenir dans `front/`.
- Pour tout travail backend, intervenir dans `backend/`.
- Si une tâche touche `front/`, appliquer aussi les règles locales de `front/AGENTS.md`.

## Règles de travail

- Ne pas modifier les fichiers générés dans `dist/`, `.angular/` ou `node_modules/`.
- Préférer des changements ciblés qui respectent les conventions déjà en place.
- Ne pas déplacer de code entre `front/` et `backend/` sans demande explicite.

## Commandes utiles

- Front:
  - `cd front && npm start`
  - `cd front && npm run build`
  - `cd front && npm test`
- Backend:
  - `cd backend && php artisan serve`
  - `cd backend && php artisan migrate`
  - `cd backend && php artisan test`

## Validation

- Pour une modification dans `front/`, valider au minimum avec `cd front && npm run build`.
- Pour une modification dans `backend/`, lancer la commande de validation ou le test le plus proche du changement.

## Notes

- `backend/package.json` sert surtout au build Vite côté Laravel.
- Les conventions Angular détaillées du frontend vivent dans `front/AGENTS.md`.
