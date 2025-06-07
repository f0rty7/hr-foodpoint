import { Injectable, signal } from '@angular/core';

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  description?: string;
  salary?: string;
  requirements?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private jobsSignal = signal<Job[]>([]);

  // Read-only signal for components to subscribe to
  readonly jobs = this.jobsSignal.asReadonly();

  async loadJobs(): Promise<Job[]> {
    // Simulate API call
    const mockJobs: Job[] = [
      {
        id: 1,
        title: 'Software development engineer',
        company: 'Infosys',
        location: 'Bengaluru',
        type: 'Full time',
        description: 'Develop and maintain software applications',
        salary: '₹6-12 LPA',
        requirements: ['JavaScript', 'React', 'Node.js']
      },
      {
        id: 2,
        title: 'Software development engineer',
        company: 'Infosys',
        location: 'Bengaluru',
        type: 'Full time',
        description: 'Work on enterprise software solutions',
        salary: '₹6-12 LPA',
        requirements: ['Java', 'Spring Boot', 'MySQL']
      },
      {
        id: 3,
        title: 'Software development engineer',
        company: 'Infosys',
        location: 'Bengaluru',
        type: 'Full time',
        description: 'Build scalable web applications',
        salary: '₹6-12 LPA',
        requirements: ['Angular', 'TypeScript', 'REST APIs']
      }
    ];

    this.jobsSignal.set(mockJobs);
    return mockJobs;
  }

  getJobById(id: number): Job | undefined {
    return this.jobs().find(job => job.id === id);
  }

  searchJobs(query: string): Job[] {
    const lowerQuery = query.toLowerCase();
    return this.jobs().filter(job =>
      job.title.toLowerCase().includes(lowerQuery) ||
      job.company.toLowerCase().includes(lowerQuery) ||
      job.location.toLowerCase().includes(lowerQuery)
    );
  }
}
