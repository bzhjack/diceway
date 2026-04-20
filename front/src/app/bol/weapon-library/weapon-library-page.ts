import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';

interface WeaponReferenceRow {
  readonly arme: string;
  readonly type: 'M' | 'T';
  readonly degats: string;
  readonly portee: string | null;
  readonly notes: string;
}

@Component({
  selector: 'bol-weapon-library-page',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './weapon-library-page.html',
  styleUrl: './weapon-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeaponLibraryPageComponent {
  private readonly weapons: readonly WeaponReferenceRow[] = [
    {arme: 'Arme d’hast', type: 'M', degats: 'd6B', portee: null, notes: 'Arme à deux mains ; inclut le khastok de Malakut.'},
    {arme: 'Bâton', type: 'M', degats: 'd6', portee: null, notes: 'Arme à deux mains.'},
    {arme: 'Dague', type: 'M', degats: 'd6M', portee: '3 m', notes: 'Dissimulable ; inclut kriss, poignard, coutelas...'},
    {arme: 'Épée', type: 'M', degats: 'd6', portee: null, notes: 'Inclut cimeterre, glaive, sabre, tulwar...'},
    {arme: 'Épée / hache à 2 mains', type: 'M', degats: 'd6B', portee: null, notes: 'Armes à deux mains.'},
    {arme: 'Fléau', type: 'M', degats: 'd6', portee: null, notes: 'Ignore les boucliers.'},
    {arme: 'Gourdin', type: 'M', degats: 'd6M', portee: null, notes: 'Option : dégâts non létaux.'},
    {arme: 'Hache', type: 'M', degats: 'd6', portee: '3 m', notes: 'Peut être lancée.'},
    {arme: 'Lance', type: 'M', degats: 'd6', portee: '6 m', notes: 'Peut être lancée.'},
    {arme: 'Masse d’armes', type: 'M', degats: 'd6', portee: '1,5 m', notes: 'Peut être lancée.'},
    {arme: 'Massue', type: 'M', degats: 'd6', portee: '3 m', notes: 'Peut être lancée.'},
    {arme: 'Morgenstern', type: 'M', degats: 'd6B', portee: null, notes: 'Arme à deux mains.'},
    {arme: 'Rapière', type: 'M', degats: 'd6M', portee: null, notes: 'Très chic !'},
    {arme: 'Arbalète', type: 'T', degats: 'd6', portee: '30 m', notes: 'Arme à deux mains ; rechargement : 1 round de combat.'},
    {arme: 'Arbalète lourde', type: 'T', degats: 'd6B', portee: '45 m', notes: 'Arme à deux mains ; rechargement : 2 rounds de combat.'},
    {arme: 'Arc', type: 'T', degats: 'd6', portee: '22 m', notes: 'Arme à deux mains.'},
    {arme: 'Fronde/bâton-fronde', type: 'T', degats: 'd6M', portee: '9 m / 18 m', notes: 'Arme à une main / arme à deux mains.'},
    {arme: 'Javelot/fléchette', type: 'T', degats: 'd6M', portee: '6 m', notes: 'Arme de jet.'},
  ] as const;

  protected readonly searchTerm = signal('');
  protected readonly filteredWeapons = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();

    return [...this.weapons]
      .filter((weapon) => {
        if (!term) {
          return true;
        }

        return [
          weapon.arme,
          this.weaponTypeLabel(weapon.type),
          weapon.degats,
          weapon.portee,
          weapon.notes,
        ].some((value) => value?.toLocaleLowerCase().includes(term));
      });
  });
  protected readonly totalWeaponCount = computed(() => this.weapons.length);
  protected readonly meleeCount = computed(() => this.weapons.filter((weapon) => weapon.type === 'M').length);
  protected readonly rangedCount = computed(() => this.weapons.filter((weapon) => weapon.type === 'T').length);

  protected clearFilters(): void {
    this.searchTerm.set('');
  }

  protected weaponTypeLabel(type: WeaponReferenceRow['type']): string {
    return type === 'M' ? 'Mêlée' : 'Tir';
  }
}
