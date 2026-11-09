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
 * Une carte de la rangée « Parties » : le nom de la compagnie, son scénario (ou « Partie improvisée »), sa teinte, ses chapitres en
 * pastilles, ses héros, et le chapitre que « Reprendre » nomme (null pour une partie
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

/** Un scénario à choisir (« Nouvelle partie », « Choisir un scénario ») : son nom, sa teinte et ses chapitres dans l'ordre de lecture. */
export interface AccueilScenarioChoix {
  /** L'id du scénario (`BolSaga`). */
  id: string;
  nom: string;
  teinte: number;
  chapitres: AccueilChapitreChoix[];
}

/** Où se place un chapitre : son scénario (« Perle du Beshaar »), son chapitre (« Chapitre 5 sur 5 », « Introduction » ; `chapitreCourt` :
 * « Chapitre 5 ») et son nom, sans numéro. */
export interface ScenarioSitue {
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

/** Ce que le bandeau dit de la scène en cours, en trois morceaux pour mettre le nom de la scène en valeur : « 1. Sacrilège à Satarla — scène 2
 * sur 3 : », « La nuit du coup fourré », « · combat engagé ». `scene` est null sans scène chargée de ce chapitre. */
export interface AccueilLigneScene {
  avant: string;
  scene: string | null;
  apres: string;
}

/**
 * La dernière partie jouée, pour le bandeau : ce qu'on en dit (le scénario, ou « Sans scénario »), le nom de la compagnie,
 * où en est la scène, la barre des scènes du chapitre et ses héros. `filAriane` le redit en une ligne, pour la barre compacte.
 */
export interface AccueilBandeau {
  id: string;
  /** « Perle du Beshaar » ou « Sans scénario ». */
  histoire: string;
  teinte: number;
  titre: string;
  /** Le chapitre en cours, la scène chargée, le combat ; null quand il n'y a rien à en dire (une partie improvisée sans scène, hors combat). */
  ligne: AccueilLigneScene | null;
  enCombat: boolean;
  scenes: AccueilSceneRepere[];
  heros: AccueilHerosCarte[];
  filAriane: string;
}
