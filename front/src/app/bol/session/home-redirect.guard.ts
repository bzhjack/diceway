import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {catchError, map, of} from 'rxjs';
import {BolFightSessionModel} from '../models/bol-fight-session.model';
import {BolFightSessionService} from '../services/bol-fight-session.service';

/** Id de la session ouverte (`libre` ou `combat`) la plus récente — la liste est déjà triée par date
 * décroissante côté backend. `null` s'il n'y en a aucune. */
export function openSessionId(sessions: readonly BolFightSessionModel[]): string | null {
  const open = sessions.find((s) => (s.statut === 'libre' || s.statut === 'combat') && !!s.id);
  return open?.id ?? null;
}

/** Garde de la route `/` : la table est la page d'accueil. S'il existe une session ouverte, on y va
 * directement ; sinon la route s'active et affiche le seuil. Une erreur de chargement laisse passer
 * (le seuil vaut mieux qu'un écran bloqué). */
export const homeRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);

  return inject(BolFightSessionService)
    .fightSessions()
    .pipe(
      map((sessions) => {
        const id = openSessionId(sessions);
        return id ? router.createUrlTree(['/session', id, 'play']) : true;
      }),
      catchError(() => of(true)),
    );
};
