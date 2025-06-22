import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header />
    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: block;
    }

    main {
      min-height: calc(100vh - 80px); /* Adjust based on header height */
    }
  `
})
export class AppComponent {
  title = 'hr-foodpoint';
}
