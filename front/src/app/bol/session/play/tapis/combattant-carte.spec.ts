import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {TapisCard} from '../../models/tapis.model';
import {CardPouvoirs} from '../../models/pouvoirs-combat.model';
import {CombattantCarteComponent} from './combattant-carte';

const POUVOIRS: CardPouvoirs = {regeneration: false, intangible: false, poison: false, vulnerabilite: null, avertissements: []};

function demon(pouvoirs: Partial<CardPouvoirs>): TapisCard {
  return {
    key: 'demon-1',
    kind: 'demon',
    camp: 'adversaires',
    pivotId: 1,
    sourceId: 'd1',
    nom: 'Krulak',
    avatar: '',
    badge: null,
    rang: 'Coriace',
    degats: 'd6',
    defense: '2',
    vitaliteCourante: 21,
    vitaliteMax: 21,
    joueur: null,
    heroisme: null,
    attitude: null,
    vilenie: null,
    pouvoirs: {...POUVOIRS, ...pouvoirs},
  };
}

const LONGUE = 'Statuette de la bibliothèque : seule sa destruction le tue pour de bon';

describe('CombattantCarteComponent', () => {
  let fixture: ComponentFixture<CombattantCarteComponent>;

  async function rendre(card: TapisCard): Promise<HTMLElement> {
    TestBed.configureTestingModule({imports: [MatIconTestingModule]});
    fixture = TestBed.createComponent(CombattantCarteComponent);
    fixture.componentRef.setInput('card', card);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const popover = () => document.querySelector<HTMLElement>('.cc-faible-pop');

  it('la vulnérabilité est une icône : son texte n’est plus écrit sur la carte, il est dans son nom', async () => {
    const carte = await rendre(demon({vulnerabilite: {element: LONGUE}}));

    const bouton = carte.querySelector<HTMLButtonElement>('button.cc-faible')!;
    expect(bouton.getAttribute('aria-label')).toBe(`Vulnérable : ${LONGUE} (dégâts doublés)`);
    expect(carte.querySelector('.cc-head')?.textContent).not.toContain(LONGUE);
    expect(popover()).toBeNull();
  });

  it('un clic sur l’icône ouvre l’explication ; Fermer la referme', async () => {
    const carte = await rendre(demon({vulnerabilite: {element: 'feu'}}));
    const bouton = carte.querySelector<HTMLButtonElement>('button.cc-faible')!;

    bouton.click();
    await fixture.whenStable();

    expect(bouton.getAttribute('aria-expanded')).toBe('true');
    expect(popover()?.querySelector('.cc-faible-texte')?.textContent).toBe('Feu');
    expect(popover()?.querySelector('.cc-faible-effet')?.textContent).toContain('dégâts doublés');

    popover()!.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();

    expect(popover()).toBeNull();
    expect(bouton.getAttribute('aria-expanded')).toBe('false');
  });

  it('sans vulnérabilité, pas d’icône', async () => {
    const carte = await rendre(demon({}));

    expect(carte.querySelector('.cc-faible')).toBeNull();
  });
});
