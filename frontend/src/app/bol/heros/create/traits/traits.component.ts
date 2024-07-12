import {Component, forwardRef} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
  selector: 'bol-heros-traits',
  standalone: true,
  imports: [],
  templateUrl: './traits.component.html',
  styleUrl: './traits.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BolHerosTraitsComponent),
      multi: true,
    }
  ]
})
export class BolHerosTraitsComponent implements ControlValueAccessor {

  private onChange: (rating: number) => void = () => {
    // do nothing by default
  };
  onTouched: () => void = () => {
    // do nothing by default
  };
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  writeValue(value: number[]): void {
    if (value) {
      /*this.armures.clear();
      for (const val of value) {
        this.armures.push(new FormControl(val));
      }*/
    }
  }
}
