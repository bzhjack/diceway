import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {TapisCard} from '../../models/tapis.model';
import {MeleePietailleDialogData} from '../../models/melee-pietaille-dialog.model';
import {MeleePietailleDialogComponent} from './melee-pietaille-dialog';

function mook(id: number, camp: TapisCard['camp']): TapisCard {
  return {
    key: `pnj-${id}`,
    kind: 'pnj',
    camp,
    pivotId: id,
    sourceId: 'src',
    nom: `Sbire ${id}`,
    avatar: '',
    badge: null,
    rang: 'Piétaille',
    degats: 'd3',
    defense: '0',
    vitaliteCourante: 2,
    vitaliteMax: 2,
    joueur: null,
    heroisme: null,
    attitude: null,
    vilenie: null,
  };
}

describe('MeleePietailleDialogComponent', () => {
  let fixture: ComponentFixture<MeleePietailleDialogComponent>;
  const close = vi.fn();

  async function open(data: MeleePietailleDialogData): Promise<HTMLElement> {
    close.mockReset();
    TestBed.configureTestingModule({
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: data},
        {provide: MatDialogRef, useValue: {close}},
      ],
    });
    // L'icône du titre est un SVG enregistré par l'application : ici, une icône vide.
    TestBed.inject(MatIconRegistry).addSvgIconLiteral('sword', TestBed.inject(DomSanitizer).bypassSecurityTrustHtml('<svg></svg>'));
    fixture = TestBed.createComponent(MeleePietailleDialogComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function type(root: HTMLElement, index: number, value: string): void {
    const input = root.querySelectorAll<HTMLInputElement>('.mpd-total')[index];
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function applyButton(root: HTMLElement): HTMLButtonElement {
    return [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes('Appliquer'))!;
  }

  function checked(root: HTMLElement): string[] {
    return [...root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].filter((box) => box.checked).map((box) => box.closest('li')!.textContent!.trim().split(' ')[1]);
  }

  it('gives d3 to the smaller camp and d6M to the bigger one', async () => {
    const root = await open({camps: {heros: [mook(1, 'heros')], adversaires: [mook(11, 'adversaires'), mook(12, 'adversaires')]}});

    const placeholders = [...root.querySelectorAll<HTMLInputElement>('.mpd-total')].map((input) => input.placeholder);
    expect(placeholders).toEqual(['d3', 'd6M']);
    expect(root.textContent).toContain('Le camp le plus nombreux tue d6M');
  });

  it('says a tie is an interpretation', async () => {
    const root = await open({camps: {heros: [mook(1, 'heros')], adversaires: [mook(11, 'adversaires')]}});

    expect(root.textContent).toContain('interprétation');
  });

  it('proposes the last mooks of each camp once the roll in front is known, and applies the checked ones', async () => {
    const root = await open({camps: {heros: [mook(1, 'heros'), mook(2, 'heros')], adversaires: [mook(11, 'adversaires'), mook(12, 'adversaires'), mook(13, 'adversaires')]}});
    expect(applyButton(root).disabled).toBe(true);

    type(root, 0, '1');
    type(root, 1, '2');

    expect(checked(root)).toEqual(['1', '2', '13']);
    expect(applyButton(root).disabled).toBe(false);
    applyButton(root).click();
    expect(close).toHaveBeenCalledWith({tombes: ['pnj-1', 'pnj-2', 'pnj-13']});
  });

  it('refuses a typed result out of the die range', async () => {
    const root = await open({camps: {heros: [mook(1, 'heros')], adversaires: [mook(11, 'adversaires'), mook(12, 'adversaires')]}});

    type(root, 0, '5');
    type(root, 1, '4');

    expect(applyButton(root).disabled).toBe(true);
  });
});
