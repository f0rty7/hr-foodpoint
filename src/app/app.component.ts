import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet />
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class AppComponent {
  title = 'hr-foodpoint';
}
