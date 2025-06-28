import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <main>
      <app-header />
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: block;
    }

    main {
      // max-height: calc(100dvh - 70px); /* Adjust based on header height */
      // overflow-y: auto;
    }
  `
})
export class AppComponent {
  title = 'hr-foodpoint';
}
