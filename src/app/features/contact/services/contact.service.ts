import { Injectable, signal, resource, computed, effect } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  timestamp: string;
  userAgent: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  id?: string;
}

export interface ContactInfo {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: {
    main: string;
    tollFree: string;
    fax: string;
  };
  email: {
    general: string;
    support: string;
    business: string;
  };
  businessHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
  };
}

export interface ContactStats {
  totalSubmissions: number;
  averageResponseTime: string;
  successRate: number;
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly API_BASE_URL = environment.apiUrl + 'contact/';

  // Angular v20 signals for reactive state management
  private submissionInProgress = signal(false);
  private lastSubmission = signal<ContactFormData | null>(null);
  private submissionHistory = signal<ContactFormData[]>([]);
  private errorCount = signal(0);
  private refreshTrigger = signal(0);

  // Public readonly signals
  readonly isSubmitting = this.submissionInProgress.asReadonly();
  readonly lastSubmittedData = this.lastSubmission.asReadonly();

  // Computed signals (Angular v20 stable feature)
  readonly submissionCount = computed(() => this.submissionHistory().length);
  readonly hasErrors = computed(() => this.errorCount() > 0);
  readonly submissionStats = computed((): ContactStats => {
    const history = this.submissionHistory();
    return {
      totalSubmissions: history.length,
      averageResponseTime: '< 24 hours',
      successRate: history.length > 0 ? ((history.length - this.errorCount()) / history.length) * 100 : 100,
      lastUpdated: new Date().toISOString()
    };
  });

  // Contact subjects computed from available options
  readonly availableSubjects = computed(() => [
    'General Inquiry',
    'Technical Support',
    'Business Partnership',
    'Menu Inquiry',
    'Catering Services',
    'Feedback',
    'Complaint',
    'Order Issue'
  ]);

  // Resource for fetching contact information (Angular v20 Resource API)
  readonly contactInfoResource = resource({
    loader: async ({ abortSignal }) => {
      try {
        const response = await fetch(`${this.API_BASE_URL}info`, {
          signal: abortSignal,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (environment.enableLogging) {
          console.log('📋 Contact info fetched successfully:', data);
        }

        return data as ContactInfo;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        if (environment.enableLogging) {
          console.warn('Failed to fetch contact info from API, using fallback data:', error);
        }

        // Fallback to default contact info
        return this.getDefaultContactInfo();
      }
    }
  });

  constructor() {
    // Angular v20 stable effect API for side effects
    effect(() => {
      const stats = this.submissionStats();
      if (environment.enableLogging) {
        console.log('📊 Contact Statistics Updated:', stats);
      }

      // Persist submission stats to localStorage
      this.persistSubmissionData();
    });

    effect(() => {
      const history = this.submissionHistory();
      if (history.length > 0 && environment.enableLogging) {
        console.log(`📝 Submission History Updated: ${history.length} total submissions`);
      }
    });

    effect(() => {
      const errorCount = this.errorCount();
      if (errorCount > 0 && environment.enableLogging) {
        console.warn(`⚠️ Contact service errors: ${errorCount}`);
      }
    });

    // Load existing submission history from localStorage
    this.loadSubmissionHistory();
  }

  private persistSubmissionData(): void {
    const data = {
      history: this.submissionHistory(),
      stats: this.submissionStats(),
      lastUpdated: Date.now()
    };
    localStorage.setItem('contact-submissions', JSON.stringify(data));
  }

  private loadSubmissionHistory(): void {
    try {
      const stored = localStorage.getItem('contact-submissions');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.history && Array.isArray(data.history)) {
          this.submissionHistory.set(data.history);
        }
      }
    } catch (error) {
      if (environment.enableLogging) {
        console.warn('Failed to load submission history:', error);
      }
    }
  }

  async submitContactForm(data: ContactFormData): Promise<ContactResponse> {
    this.submissionInProgress.set(true);

    try {
      const response = await fetch(`${this.API_BASE_URL}submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ContactResponse = await response.json();

      if (result.success) {
        // Update signals on successful submission
        this.lastSubmission.set(data);
        this.submissionHistory.update(history => [...history, data]);

        if (environment.enableLogging) {
          console.log('✅ Contact form submitted successfully:', result);
        }
      } else {
        this.errorCount.update(count => count + 1);
      }

      return result;
    } catch (error) {
      this.errorCount.update(count => count + 1);

      if (environment.enableLogging) {
        console.error('❌ Error submitting contact form:', error);
      }

      throw new Error('Failed to submit contact form. Please try again.');
    } finally {
      this.submissionInProgress.set(false);
    }
  }

  // Convenience getters for Resource API
  get contactInfo(): ContactInfo | undefined {
    return this.contactInfoResource.value();
  }

  get contactInfoLoading(): boolean {
    return this.contactInfoResource.isLoading();
  }

  get contactInfoError(): any {
    return this.contactInfoResource.error();
  }

  get contactInfoStatus(): string {
    return this.contactInfoResource.status();
  }

  // Validation methods using modern approaches
  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Methods for managing state
  refreshContactInfo(): void {
    this.refreshTrigger.update(value => value + 1);
  }

  clearSubmissionHistory(): void {
    this.submissionHistory.set([]);
    this.lastSubmission.set(null);
    this.errorCount.set(0);
    localStorage.removeItem('contact-submissions');
  }

  clearErrors(): void {
    this.errorCount.set(0);
  }

  getSubmissionById(timestamp: string): ContactFormData | null {
    return this.submissionHistory().find(submission =>
      submission.timestamp === timestamp
    ) || null;
  }

  // Get recent submissions (last 10)
  getRecentSubmissions(limit: number = 10): ContactFormData[] {
    return this.submissionHistory()
      .slice(-limit)
      .reverse(); // Show most recent first
  }

  private getDefaultContactInfo(): ContactInfo {
    return {
      address: {
        street: '151 New Park Ave',
        city: 'Hartford',
        state: 'CT',
        zipCode: '06106'
      },
      phone: {
        main: '+1 (203) 302-9545',
        tollFree: '+1 (800) 555-0123',
        fax: '+1 (203) 302-9546'
      },
      email: {
        general: 'contactus@riverlaksoft.com',
        support: 'support@riverlaksoft.com',
        business: 'business@riverlaksoft.com'
      },
      businessHours: {
        weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM',
        saturday: 'Saturday: 10:00 AM - 4:00 PM',
        sunday: 'Sunday: Closed'
      },
      socialLinks: {
        facebook: 'https://facebook.com/hrfoodpoint',
        twitter: 'https://twitter.com/hrfoodpoint',
        instagram: 'https://instagram.com/hrfoodpoint'
      }
    };
  }
}


