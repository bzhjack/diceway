import {TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {DwImageDialogComponent} from './dw-image-dialog';

describe('DwImageDialogComponent', () => {
  it('montre l’image carrée avec son texte alternatif et un bouton pour fermer', async () => {
    TestBed.configureTestingModule({providers: [{provide: MAT_DIALOG_DATA, useValue: {src: '/assets/bol/pnj/1.jpg', alt: 'Portrait de Archer de Tyrus'}}]});
    const fixture = TestBed.createComponent(DwImageDialogComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const image = element.querySelector<HTMLImageElement>('img.dwi-image')!;
    expect(image.getAttribute('src')).toBe('/assets/bol/pnj/1.jpg');
    expect(image.alt).toBe('Portrait de Archer de Tyrus');
    expect(element.querySelector('button.dwi-close')?.getAttribute('aria-label')).toBe('Fermer');
  });
});
