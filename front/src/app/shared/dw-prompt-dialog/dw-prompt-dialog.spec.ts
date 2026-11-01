import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {promptDialog} from './dw-prompt-dialog';

describe('promptDialog', () => {
  let results: (string | null)[];

  const overlay = () => document.querySelector<HTMLElement>('.cdk-overlay-container')!;
  const champ = () => overlay().querySelector<HTMLInputElement>('#dw-prompt-input')!;
  const valider = () => overlay().querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const stable = () => new Promise((done) => setTimeout(done));

  beforeEach(async () => {
    results = [];
    TestBed.configureTestingModule({providers: [provideNoopAnimations()]});
    promptDialog(TestBed.inject(MatDialog), {title: 'Renommer', label: 'Nom', value: 'Conan', maxLength: 10}).subscribe((value) => results.push(value));
    await stable();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('part de la valeur donnée, et pose la limite de longueur', () => {
    expect(champ().value).toBe('Conan');
    expect(champ().maxLength).toBe(10);
    expect(valider().disabled).toBe(false);
  });

  it('refuse un nom vide', async () => {
    champ().value = '   ';
    champ().dispatchEvent(new Event('input'));
    await stable();

    expect(valider().disabled).toBe(true);
  });

  it('rend la valeur sans ses espaces', async () => {
    champ().value = ' Thongor ';
    champ().dispatchEvent(new Event('input'));
    await stable();

    overlay().querySelector<HTMLFormElement>('form')!.requestSubmit();
    await new Promise((done) => setTimeout(done, 50));

    expect(results).toEqual(['Thongor']);
  });
});
