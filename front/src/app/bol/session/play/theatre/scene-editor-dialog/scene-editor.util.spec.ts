import {BolSceneModel} from '../../../../models/bol-scene.model';
import {editorValue, sceneChanges} from './scene-editor.util';

const SCENE: BolSceneModel = {
  id: 's1',
  scenario_id: 'sc1',
  titre: 'Embuscade au gué',
  ordre: 0,
  notes: null,
  distribution: [],
  region_id: null,
  lieu: null,
  moment: null,
  meteo: null,
  danger: null,
  lecture: null,
  pistes: null,
  image: null,
};

describe('sceneChanges', () => {
  it('rogne les textes, vide devient null, danger 0 devient null', () => {
    const changes = sceneChanges({
      titre: '  Le gué  ',
      region_id: 5,
      lieu: ' ',
      moment: 'crepuscule',
      meteo: null,
      danger: 0,
      image: ' ',
      lecture: '  Il pleut.  ',
      notes: '',
      pistes: [
        {texte: ' Suivre ', scene_id: 's3'},
        {texte: '  ', scene_id: null},
      ],
    });
    expect(changes).toEqual({
      titre: 'Le gué',
      region_id: 5,
      lieu: null,
      moment: 'crepuscule',
      meteo: null,
      danger: null,
      image: null,
      lecture: 'Il pleut.',
      notes: null,
      pistes: [{texte: 'Suivre', scene_id: 's3'}],
    });
  });

  it('aucune piste devient null', () => {
    expect(sceneChanges({...editorValue(SCENE), pistes: []}).pistes).toBeNull();
  });

  it('un aller-retour garde la préparation', () => {
    const prepared = {...SCENE, lieu: 'Gué du Tyr', danger: 3, pistes: [{texte: 'Suivre', scene_id: null}]};
    expect(sceneChanges(editorValue(prepared))).toEqual(
      expect.objectContaining({lieu: 'Gué du Tyr', danger: 3, pistes: [{texte: 'Suivre', scene_id: null}]}),
    );
  });
});
