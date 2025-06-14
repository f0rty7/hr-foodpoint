import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobService } from '../../services/job.service';

@Component({
  selector: 'app-job-listings',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (jobService.jobsLoading) {
      <div class="loading-message">Loading jobs...</div>
    }

    @if (jobService.jobsError) {
      <div class="error-message">Error: {{ jobService.jobsError }}</div>
    }

    <section class="job-listings">
      <div class="section-header">
        <h2 class="section-title">Job Listings</h2>
        <!-- <button
          class="refresh-btn"
          (click)="jobService.refreshJobs()"
          [disabled]="jobService.jobsLoading"
          title="Refresh jobs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M3 21v-5h5"></path>
          </svg>
          <span>Refresh</span>
        </button> -->
      </div>
      <div class="jobs-list">
        @for (job of jobService.jobs; track job.id) {
          <div class="job-card">
            <div class="card-header">
              <div class="company-logo">
                <span>{{ getCompanyInitial(job.company) }}</span>
              </div>
            </div>

            <div class="company-info">
              <div class="company-name">{{ job.company }}</div>
              <div class="posted-date">5 days ago</div>
            </div>

            <h4 class="job-title">{{ job.title }}</h4>

            <div class="job-tags">
              <span class="tag">{{ job.type }}</span>
              <!-- <span class="tag">Senior level</span> -->
            </div>

            <div class="card-footer">
              <div class="job-details">
                <div class="salary">{{ job.salary }}</div>
                <div class="location">{{ job.location }}</div>
              </div>
              <button class="apply-btn">View</button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './job-listings.component.scss'
})
export class JobListingsComponent {
  constructor(public jobService: JobService) {}

  getCompanyInitial(companyName: string): string {
    return companyName.charAt(0).toUpperCase();
  }
}
