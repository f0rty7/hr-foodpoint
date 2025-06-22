import { Injectable, inject, signal, resource } from '@angular/core';
import { environment } from '../../../../environments/environment';

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
  private readonly API_BASE_URL = environment.apiUrl + 'homepage'; // Use environment variable

  // Signal to trigger resource refresh
  private refreshTrigger = signal(0);

  // Resource for fetching all jobs
  readonly jobsResource = resource({
    loader: async ({ abortSignal }) => {
      try {
        const response = await fetch(`${this.API_BASE_URL}/jobs`, {
          signal: abortSignal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Log in development environment
        if (environment.enableLogging) {
          console.log('Fetched jobs:', data);
        }

        // Extract jobs array from the response object
        return data.jobs as Job[];
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error; // Re-throw abort errors
        }

        if (environment.enableLogging) {
          console.warn('Failed to fetch jobs from API, using fallback data:', error);
        }
        // Fallback to mock data if API fails
        return this.getMockJobs();
      }
    }
  });

  // Resource for fetching a single job by ID
  private jobIdSignal = signal<number | undefined>(undefined);

  readonly jobByIdResource = resource({
    params: () => {
      const id = this.jobIdSignal();
      return id ? { id } : undefined;
    },
    loader: async ({ params, abortSignal }) => {
      if (!params?.id) return null;

      try {
        const response = await fetch(`${this.API_BASE_URL}/jobs/${params.id}`, {
          signal: abortSignal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as Job;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        if (environment.enableLogging) {
          console.warn('Failed to fetch job from API:', error);
        }
        // Fallback to finding in current jobs
        const jobs = this.jobsResource.value();
        return jobs?.find((job: Job) => job.id === params.id) || null;
      }
    }
  });

  // Computed getters for easy access
  get jobs(): Job[] {
    return this.jobsResource.value() || [];
  }

  get jobsLoading(): boolean {
    return this.jobsResource.isLoading();
  }

  get jobsError(): any {
    return this.jobsResource.error();
  }

  get jobsStatus(): any {
    return this.jobsResource.status();
  }

  // Methods
  getJobById(id: number): Job | null {
    this.jobIdSignal.set(id);
    return this.jobByIdResource.value() || null;
  }

  refreshJobs(): void {
    this.jobsResource.reload();
  }

  // Trigger a complete refresh by updating the refresh signal
  forceRefresh(): void {
    this.refreshTrigger.update(value => value + 1);
    this.jobsResource.reload();
  }

  searchJobs(query: string): Job[] {
    const lowerQuery = query.toLowerCase();
    return this.jobs.filter(job =>
      job.title.toLowerCase().includes(lowerQuery) ||
      job.company.toLowerCase().includes(lowerQuery) ||
      job.location.toLowerCase().includes(lowerQuery)
    );
  }

  private getMockJobs(): Job[] {
    return [
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
  }

  // Utility method to find job from current resource state
  findJobById(id: number): Job | undefined {
    return this.jobs.find((job: Job) => job.id === id);
  }

  // Legacy method for backward compatibility
  async loadJobs(): Promise<Job[]> {
    this.forceRefresh();
    return this.jobs;
  }
}
