import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initToolbar } from '@stagewise/toolbar';
import { AngularPlugin } from '@stagewise-plugins/angular';

// initToolbar({
//   plugins: [AngularPlugin],
// });

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
