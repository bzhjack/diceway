import {Directive} from '@angular/core';

const EMPTY_AVATAR = '/assets/bol/empty-avatar.jpg';

/** Portrait introuvable (ex. `/assets/bol/pnj/<id>.jpg` jamais déposé) : remplace l'image cassée par l'avatar vide. */
@Directive({
  selector: 'img[dwAvatarFallback]',
  host: {'(error)': 'onError($event)'},
})
export class AvatarFallbackDirective {
  protected onError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Garde-fou : si l'avatar vide manque lui aussi, ne pas boucler.
    if (!img.src.endsWith(EMPTY_AVATAR)) {
      img.src = EMPTY_AVATAR;
    }
  }
}
