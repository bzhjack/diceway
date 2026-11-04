/** Où en est un chapitre pour une partie : joué par elle, en cours sur sa table, ou à jouer. */
export type ChapitreEtat = 'joue' | 'en-cours' | 'a-jouer';

/** Un chapitre sur la ligne d'une partie : sa marque (son numéro, « Intro », sinon son initiale), son état, et ce qu'en dit un lecteur
 * d'écran. */
export interface AccueilRepere {
  marque: string;
  /** Le nom du chapitre, en bulle au survol : « 1. Sacrilège à Satarla ». */
  libelle: string;
  etat: ChapitreEtat;
  texte: string;
}

/** Un héros d'une partie, prêt à montrer : son portrait utilisable, sinon son initiale. */
export interface AccueilHerosCarte {
  id: string;
  nom: string;
  portrait: string | null;
  initiale: string;
}

/**
 * Une carte de la rangée « Parties » : le nom de la compagnie, son scénario (la saga, le nom d'un one shot, ou « Partie improvisée »), sa
 * teinte, ses chapitres en pastilles (une saga seulement), ses héros, et le chapitre que « Reprendre » nomme (null pour une partie
 * improvisée). `termine` : le MJ a dit qu'elle a fini son scénario.
 */
export interface AccueilPartie {
  id: string;
  nom: string;
  scenario: string;
  teinte: number;
  reperes: AccueilRepere[];
  heros: AccueilHerosCarte[];
  reprendre: string | null;
  termine: boolean;
  derniere: boolean;
  /** Le chapitre courant ; null pour une partie improvisée. */
  scenarioId: string | null;
  /** Ce qu'un changement de chapitre retirerait de sa table : rien pour une partie improvisée. */
  figurantsARetirer: number;
  /** En plein combat, elle ne change pas de chapitre : le combat doit finir d'abord. */
  enCombat: boolean;
}

/** Un chapitre à choisir dans un menu : son id et son libellé (« 1. Sacrilège à Satarla », « Introduction : … »). */
export interface AccueilChapitreChoix {
  id: string;
  libelle: string;
}

/** Un scénario à choisir (« Nouvelle partie », « Choisir un scénario ») : son nom, sa teinte et ses chapitres dans l'ordre de lecture ; un
 * one shot est un scénario d'un seul chapitre. */
export interface AccueilScenarioChoix {
  /** L'id de la saga, ou celui du chapitre pour un one shot. */
  id: string;
  nom: string;
  oneShot: boolean;
  teinte: number;
  chapitres: AccueilChapitreChoix[];
}

/** Où se place un chapitre : sa saga (null hors saga), ce qu'on en dit (« Perle du Beshaar », ou « One shot »), son chapitre (« Chapitre 5
 * sur 5 », « Introduction » ; `chapitreCourt` : « Chapitre 5 ») et son nom, sans numéro. */
export interface ScenarioSitue {
  saga: string | null;
  histoire: string;
  chapitre: string | null;
  chapitreCourt: string | null;
  nom: string;
}

/** Où en est une scène du chapitre d'une partie. */
export type SceneEtat = 'jouee' | 'en-cours' | 'a-jouer';

/** Une scène du chapitre d'une partie, pour la barre de ses scènes ; `texte` est ce qu'en dit un lecteur d'écran. */
export interface AccueilSceneRepere {
  etat: SceneEtat;
  texte: string;
}

/**
 * La dernière partie jouée, pour le bandeau : le fil de l'histoire (le scénario, ou « One shot », ou « Sans scénario » ; le chapitre ; la
 * scène), le nom de la compagnie, la scène en cours, la barre des scènes du chapitre et ses héros. `filAriane` le redit en une ligne, pour
 * la barre compacte.
 */
export interface AccueilBandeau {
  id: string;
  /** « Perle du Beshaar », « One shot » ou « Sans scénario ». */
  histoire: string;
  teinte: number;
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
  heros: AccueilHerosCarte[];
  filAriane: string;
}
