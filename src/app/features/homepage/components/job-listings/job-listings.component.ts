import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
}

@Component({
  selector: 'app-job-listings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="job-listings">
      <h2 class="section-title">Job Listings</h2>
      <div class="jobs-list">
        @for (job of jobs(); track job.id) {
          <div class="job-card">
            <div class="job-info">
              <div class="job-title">
                <strong>Job title:</strong> {{ job.title }}
                <br>
                {{ job.location }}, {{ job.type }}
              </div>
              <div class="job-company">
                <strong>Company:</strong> {{ job.company }}
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './job-listings.component.scss'
})
export class JobListingsComponent {
  jobs = signal<Job[]>([
    {
      id: 1,
      title: 'Software development engineer',
      company: 'Infosys',
      location: 'Bengaluru',
      type: 'Full time'
    },
    {
      id: 2,
      title: 'Software development engineer',
      company: 'Infosys',
      location: 'Bengaluru',
      type: 'Full time'
    },
    {
      id: 3,
      title: 'Software development engineer',
      company: 'Infosys',
      location: 'Bengaluru',
      type: 'Full time'
    }
  ]);
}
