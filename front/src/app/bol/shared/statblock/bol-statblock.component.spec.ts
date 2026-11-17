import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {provideRouter} from '@angular/router';
import {BolStatblockData} from '../models/bol-statblock.model';
import {BolStatblockComponent} from './bol-statblock.component';

const DRAJIT = {
  accent: 'pnj',
  title: 'Drajit, aubergiste du Coursier bleu',
  isCreation: false,
  comment: null,
  chips: [],
  vitals: [],
  tiles: [],
  sections: [],
  editRoute: null,
  advancedEditRoute: null,
} as unknown as BolStatblockData;

describe('BolStatblockComponent', () => {
  async function rendre(image: string) {
    TestBed.configureTestingModule({imports: [MatIconTestingModule], providers: [provideRouter([])]});
    const fixture = TestBed.createComponent(BolStatblockComponent);
    fixture.componentRef.setInput('data', DRAJIT);
    fixture.componentRef.setInput('imageSrc', image);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('avec un portrait : le bandeau le montre en grand, et flouté en fond', async () => {
    const page = await rendre('/api/bol/portraits/drajit.png');

    expect(page.querySelector('.bs-head')!.classList).toContain('bs-head--image');
    expect(page.querySelector('.bs-head-fond')!.getAttribute('src')).toBe('/api/bol/portraits/drajit.png');
    expect(page.querySelector('.bs-head-fond')!.getAttribute('aria-hidden')).toBe('true');
    expect(page.querySelector('.bs-portrait-img')!.getAttribute('src')).toBe('/api/bol/portraits/drajit.png');
    // Tant que le bandeau est en vue, la rangée des chiffres ne répète pas le portrait.
    expect(page.querySelector('.bs-stats')!.classList).not.toContain('bs-stats--colle');
    expect(page.querySelector('.bs-stats-mini')).toBeNull();
  });

  it.each(['', '/assets/bol/empty-avatar.jpg'])('sans portrait (« %s ») : le médaillon de son type, pas de fond', async (image) => {
    const page = await rendre(image);

    expect(page.querySelector('.bs-head')!.classList).not.toContain('bs-head--image');
    expect(page.querySelector('.bs-head-fond')).toBeNull();
    expect(page.querySelector('.bs-portrait mat-icon')).not.toBeNull();
  });
});
