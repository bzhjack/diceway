import {HttpClient} from '@angular/common/http';
import {Directive, ElementRef, effect, inject, input} from '@angular/core';

@Directive({selector: '[inlineSVG]'})
export class InlineSvgDirective {
  readonly inlineSVG = input.required<string>();

  private readonly el = inject(ElementRef);
  private readonly http = inject(HttpClient);

  constructor() {
    effect(() => {
      const url = this.inlineSVG();
      this.http.get(url, {responseType: 'text'}).subscribe((svg: string) => {
        this.el.nativeElement.innerHTML = svg;
      });
    });
  }
}