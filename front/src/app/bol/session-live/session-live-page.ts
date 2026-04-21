import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {AuthService} from '../../core/auth/auth.service';
import {BolDicePanelComponent} from './bol-dice-panel/bol-dice-panel';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
type ProtagonistKind = 'PJ' | 'PNJ';
type ToolMode = 'active' | 'ready' | 'reference';
type TimelineTone = 'event' | 'consequence' | 'escalation';
type Allegiance = 'ally' | 'foe' | 'wildcard';

interface SessionFact {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: string;
  readonly tone: Tone;
}

interface QuickAction {
  readonly label: string;
  readonly icon: string;
  readonly emphasis: 'primary' | 'secondary';
}

interface StatusTag {
  readonly label: string;
  readonly tone: Tone;
}

interface Protagonist {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly kind: ProtagonistKind;
  readonly vitality: string;
  readonly vitalityPercent: number;
  readonly intent: string;
  readonly lastBeat: string;
  readonly states: readonly StatusTag[];
}

interface FocusLevel {
  readonly name: string;
  readonly summary: string;
  readonly current: boolean;
}

interface SceneCard {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

interface TimelineEntry {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly time: string;
  readonly tone: TimelineTone;
}

interface ToolModule {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly detail: string;
  readonly mode: ToolMode;
}

interface Combatant {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly initiative: number;
  readonly vitality: string;
  readonly vitalityPercent: number;
  readonly nextAction: string;
  readonly allegiance: Allegiance;
  readonly states: readonly StatusTag[];
}

@Component({
  selector: 'app-session-live-page',
  imports: [BolDicePanelComponent],
  templateUrl: './session-live-page.html',
  styleUrl: './session-live-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionLivePageComponent {
  private readonly authService = inject(AuthService);

  protected readonly userName = computed(() => this.authService.user()?.name ?? 'Utilisateur');
  protected readonly sessionFacts: readonly SessionFact[] = [
    {
      label: 'Campagne',
      value: 'Les Cités de Bronze',
      detail: 'Arc III · Le banquet des ombres',
      icon: 'pi pi-sparkles',
      tone: 'accent',
    },
    {
      label: 'Lieu',
      value: 'Citadelle d Argos',
      detail: 'Salle aux lions · aile orientale',
      icon: 'pi pi-map-marker',
      tone: 'neutral',
    },
    {
      label: 'Scène',
      value: 'Négociation sous tension',
      detail: '3 factions présentes · duel probable',
      icon: 'pi pi-megaphone',
      tone: 'warning',
    },
    {
      label: 'Temps fictionnel',
      value: 'Crépuscule · 19:42',
      detail: 'Orage sur le port · visibilité faible',
      icon: 'pi pi-clock',
      tone: 'success',
    },
  ];
  protected readonly quickActions: readonly QuickAction[] = [
    { label: 'Ajouter PNJ', icon: 'pi pi-user-plus', emphasis: 'secondary' },
    { label: 'Lancer combat', icon: 'pi pi-bolt', emphasis: 'primary' },
    { label: 'Faire un jet', icon: 'pi pi-dice', emphasis: 'secondary' },
    { label: 'Ouvrir notes', icon: 'pi pi-book', emphasis: 'secondary' },
    { label: 'Créer scène', icon: 'pi pi-plus-circle', emphasis: 'secondary' },
  ];
  protected readonly protagonists: readonly Protagonist[] = [
    {
      id: 'pj-naia',
      name: 'Naïa Sorel',
      title: 'Duelliste et voleuse sacrée',
      kind: 'PJ',
      vitality: '9 / 12',
      vitalityPercent: 75,
      intent: 'Obtenir le sceau du consul sans révéler le contrat',
      lastBeat: 'A semé le doute chez les gardes avec un faux ordre',
      states: [
        { label: 'alliée', tone: 'success' },
        { label: 'blessée', tone: 'warning' },
      ],
    },
    {
      id: 'pj-malik',
      name: 'Malik Khar',
      title: 'Mercenaire et stratège',
      kind: 'PJ',
      vitality: '11 / 11',
      vitalityPercent: 100,
      intent: 'Contenir les hommes du prince avant la rupture',
      lastBeat: 'Prépare une sortie sécurisée vers les cuisines',
      states: [
        { label: 'allié', tone: 'success' },
        { label: 'hors-combat', tone: 'neutral' },
      ],
    },
    {
      id: 'pj-ysolde',
      name: 'Ysolde de Marne',
      title: 'Occultiste et diplomate',
      kind: 'PJ',
      vitality: '7 / 10',
      vitalityPercent: 70,
      intent: 'Achever le pacte avant que le démon soit nommé',
      lastBeat: 'Perçoit une présence derrière les tentures royales',
      states: [
        { label: 'alliée', tone: 'success' },
        { label: 'empoisonnée', tone: 'danger' },
      ],
    },
    {
      id: 'pnj-veskar',
      name: 'Veskar le Rouge',
      title: 'Capitaine du prince exilé',
      kind: 'PNJ',
      vitality: '10 / 10',
      vitalityPercent: 100,
      intent: 'Forcer l accord en intimidant la table',
      lastBeat: 'A posé sa main sur la garde de son sabre',
      states: [
        { label: 'hostile', tone: 'danger' },
        { label: 'armé', tone: 'warning' },
      ],
    },
    {
      id: 'pnj-selene',
      name: 'Sélène Avra',
      title: 'Intendante du palais',
      kind: 'PNJ',
      vitality: '6 / 6',
      vitalityPercent: 100,
      intent: 'Garder le banquet sous contrôle et sauver les apparences',
      lastBeat: 'Suggère discrètement une retraite vers la galerie haute',
      states: [
        { label: 'alliée', tone: 'success' },
        { label: 'nerveuse', tone: 'neutral' },
      ],
    },
  ];
  protected readonly playerCharacters = this.protagonists.filter(
    (protagonist) => protagonist.kind === 'PJ',
  );
  protected readonly nonPlayerCharacters = this.protagonists.filter(
    (protagonist) => protagonist.kind === 'PNJ',
  );
  protected readonly focusLevels: readonly FocusLevel[] = [
    { name: 'Campagne', summary: 'Arc des Cités de Bronze', current: false },
    { name: 'Session', summary: 'Banquet diplomatique', current: false },
    { name: 'Scène', summary: 'Négociation sous tension', current: true },
    { name: 'Combat', summary: 'Latence de 1 tour', current: false },
  ];
  protected readonly sceneCards: readonly SceneCard[] = [
    {
      label: 'Description',
      value: 'Le banquet continue sous une politesse tendue.',
      detail: 'Les serviteurs ralentissent, la musique s étouffe et chaque regard surveille les issues.',
    },
    {
      label: 'Enjeux',
      value: 'Conserver le sceau et éviter une guerre ouverte.',
      detail: 'Le moindre faux pas peut faire basculer Argos dans une purge immédiate.',
    },
    {
      label: 'Ambiance',
      value: 'Encens lourd, éclairs sur le port, acier à demi tiré.',
      detail: 'La fiction doit sentir le luxe fatigué, la menace et la pluie.',
    },
  ];
  protected readonly sceneActions: readonly QuickAction[] = [
    { label: 'Ajouter événement', icon: 'pi pi-plus', emphasis: 'secondary' },
    { label: 'Ajouter conséquence', icon: 'pi pi-exclamation-circle', emphasis: 'secondary' },
    { label: 'Déclencher rencontre', icon: 'pi pi-users', emphasis: 'secondary' },
    { label: 'Passer en combat', icon: 'pi pi-shield', emphasis: 'primary' },
  ];
  protected readonly timeline: readonly TimelineEntry[] = [
    {
      id: 'event-1',
      title: 'Les gardes ferment la porte du vestibule',
      detail: 'La sortie principale n est plus neutre. Malik repère deux archers sur la mezzanine.',
      time: 'Il y a 4 min',
      tone: 'event',
    },
    {
      id: 'event-2',
      title: 'Veskar exige la lecture immédiate du contrat',
      detail: 'Naïa gagne quelques secondes en contestant l authenticité du sceau.',
      time: 'Il y a 2 min',
      tone: 'escalation',
    },
    {
      id: 'event-3',
      title: 'Le poison d Ysolde se réveille',
      detail: 'Conséquence durable si aucun contrepoison n est injecté avant la prochaine scène.',
      time: 'À l instant',
      tone: 'consequence',
    },
  ];
  protected readonly toolModules: readonly ToolModule[] = [
    {
      id: 'jets',
      name: 'Assistant de jets',
      icon: 'pi pi-dice',
      detail: 'Pool prête pour Agilité + Carrière. Difficulté proposée : 2.',
      mode: 'active',
    },
    {
      id: 'combat',
      name: 'Assistant de combat',
      icon: 'pi pi-bolt',
      detail: 'Mode veille. Passe en initiative détaillée dès la première attaque déclarée.',
      mode: 'ready',
    },
    {
      id: 'rules',
      name: 'Règles rapides',
      icon: 'pi pi-bookmark',
      detail: 'Rappel disponible : héroïsme, duel, manœuvre et empoisonnement.',
      mode: 'reference',
    },
    {
      id: 'notes',
      name: 'Notes de session',
      icon: 'pi pi-file-edit',
      detail: '3 notes épinglées. Une dette envers la guilde reste cachée aux héros.',
      mode: 'active',
    },
    {
      id: 'inventory',
      name: 'Inventaire',
      icon: 'pi pi-briefcase',
      detail: 'Sceau d ambre, antidote incomplet, lettre scellée, 2 poignards de cérémonie.',
      mode: 'reference',
    },
  ];
  protected readonly combatants: readonly Combatant[] = [
    {
      id: 'cmb-naia',
      name: 'Naïa Sorel',
      role: 'PJ',
      initiative: 17,
      vitality: '9 / 12',
      vitalityPercent: 75,
      nextAction: 'Esquive puis riposte',
      allegiance: 'ally',
      states: [
        { label: 'blessée', tone: 'warning' },
        { label: 'mobile', tone: 'accent' },
      ],
    },
    {
      id: 'cmb-veskar',
      name: 'Veskar le Rouge',
      role: 'PNJ',
      initiative: 15,
      vitality: '10 / 10',
      vitalityPercent: 100,
      nextAction: 'Charge sur la table centrale',
      allegiance: 'foe',
      states: [
        { label: 'hostile', tone: 'danger' },
        { label: 'armé', tone: 'warning' },
      ],
    },
    {
      id: 'cmb-ysolde',
      name: 'Ysolde de Marne',
      role: 'PJ',
      initiative: 11,
      vitality: '7 / 10',
      vitalityPercent: 70,
      nextAction: 'Canaliser un sceau de protection',
      allegiance: 'ally',
      states: [
        { label: 'empoisonnée', tone: 'danger' },
        { label: 'concentrée', tone: 'accent' },
      ],
    },
    {
      id: 'cmb-garde',
      name: 'Garde de galerie',
      role: 'PNJ',
      initiative: 9,
      vitality: '6 / 6',
      vitalityPercent: 100,
      nextAction: 'Vise Malik depuis la mezzanine',
      allegiance: 'wildcard',
      states: [
        { label: 'en hauteur', tone: 'neutral' },
        { label: 'incertain', tone: 'warning' },
      ],
    },
  ];
  protected readonly combatSummary = {
    round: 'Round 1',
    currentTurn: 'Tour à préparer',
    resolution:
      'Si Veskar engage maintenant, la meilleure relance narrative est une table renversée qui coupe la ligne des archers.',
  };

  protected logout(): void {
    this.authService.logout();
  }
}
