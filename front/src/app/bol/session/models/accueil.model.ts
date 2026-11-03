/** Où en est un chapitre pour ce compte : joué, en cours sur la table ouverte, le prochain à jouer, ou pas encore joué. */
export type ChapitreEtat = 'joue' | 'en-cours' | 'prochain' | 'a-jouer';

/** Un chapitre d'une saga : `titre` est le titre complet du scénario, `libelle` la partie après « — » (le titre entier hors saga). */
export interface AccueilChapitre {
  id: string;
  titre: string;
  libelle: string;
  etat: ChapitreEtat;
}

/** Une saga et ses chapitres dans l'ordre de lecture ; `nom` est null pour « Hors saga ». */
export interface AccueilSaga {
  nom: string | null;
  chapitres: AccueilChapitre[];
}

/** Le mot du bouton d'une saga : « Reprendre » la table ouverte sur son chapitre ; sinon, sur une nouvelle table, « Commencer » une saga dont
 * rien n'est joué, « Continuer » par le chapitre qui suit le dernier joué, « Reste à jouer » pour un chapitre sauté plus tôt (la fin de la
 * saga est jouée), « Jouer » un scénario hors saga, qui n'a pas d'ordre. */
export type AccueilSagaAction = 'Reprendre' | 'Commencer' | 'Continuer' | 'Reste à jouer' | 'Jouer';

/** Le bouton d'une saga : le chapitre qu'il nomme, et où il mène : `route`, la table ouverte à reprendre ; null, le dialogue « Ouvrir une
 * table » sur ce chapitre. */
export interface AccueilSagaSuite {
  id: string;
  libelle: string;
  action: AccueilSagaAction;
  route: string[] | null;
  ariaLabel: string;
}

/** Un chapitre sur la ligne de sa saga : sa marque (son numéro, « Intro », sinon son initiale), son état, et ce qu'en dit un lecteur
 * d'écran. */
export interface AccueilRepere {
  marque: string;
  etat: ChapitreEtat;
  texte: string;
}

/** Une saga résumée pour l'accueil : son avancement, ses chapitres en pastilles et son bouton (null : saga achevée). `nom` est null pour les
 * one shots. `avancement` le dit en toutes lettres, en chapitres (en scénarios pour les one shots). `teinte` choisit sa couleur et son
 * image, de 1 à 4 dans l'ordre alphabétique des sagas ; 0 pour les one shots. */
export interface AccueilSagaResume {
  nom: string | null;
  joues: number;
  total: number;
  reperes: AccueilRepere[];
  suite: AccueilSagaSuite | null;
  avancement: string;
  resume: string;
  teinte: number;
}

/** Où se place un scénario : sa saga (null hors saga), ce qu'on en dit (« Perle du Beshaar », ou « One shot »), son chapitre (« Chapitre 5
 * sur 5 », « Introduction » ; `chapitreCourt` : « Chapitre 5 ») et son nom, sans numéro. */
export interface ScenarioSitue {
  saga: string | null;
  histoire: string;
  chapitre: string | null;
  chapitreCourt: string | null;
  nom: string;
}

/** Où en est une scène du chapitre de la table ouverte. */
export type SceneEtat = 'jouee' | 'en-cours' | 'a-jouer';

/** Une scène du chapitre de la table ouverte, pour la barre de ses scènes ; `texte` est ce qu'en dit un lecteur d'écran. */
export interface AccueilSceneRepere {
  etat: SceneEtat;
  texte: string;
}

/**
 * La table ouverte, pour le bandeau : le fil de l'histoire (le scénario, ou « One shot », ou « Sans scénario » ; le chapitre ; la scène),
 * son titre (le sien, sinon le nom du chapitre, sinon sa date), la scène en cours et la barre des scènes du chapitre. `filAriane` le
 * redit en une ligne, pour la barre compacte.
 */
export interface AccueilTableOuverte {
  id: string;
  saga: string | null;
  /** « Perle du Beshaar », « One shot » ou « Sans scénario ». */
  histoire: string;
  /** « Chapitre 1 sur 5 », « Introduction » ; null hors saga ou pour un chapitre sans numéro. */
  chapitre: string | null;
  /** « Scène 7 sur 10 » ; null sans scène chargée de ce chapitre. */
  scene: string | null;
  titre: string;
  sceneEnCours: string | null;
  enCombat: boolean;
  scenes: AccueilSceneRepere[];
  /** « 5 scènes jouées sur 10 » ; null sans scène. */
  scenesJouees: string | null;
  filAriane: string;
}
