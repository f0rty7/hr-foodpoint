import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { PopularDishesComponent } from './components/popular-dishes/popular-dishes.component';
import { JobListingsComponent } from './components/job-listings/job-listings.component';
import { AboutUsComponent } from './components/about-us/about-us.component';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // HeaderComponent,
    HeroSectionComponent,
    PopularDishesComponent,
    JobListingsComponent,
    AboutUsComponent
  ],
  template: `
    <div class="homepage-container">
      <!-- <app-header /> -->
      <app-hero-section />

      <main class="main-content">
        <section class="content-sections">
          <app-popular-dishes />
          <app-job-listings />
        </section>
        <app-about-us />
      </main>
    </div>
  `,
  styleUrl: './homepage.component.scss'
})
export class HomepageComponent {
  // Using signals for reactive state management
  isLoading = signal(false);
  error = signal<string | null>(null);
}
