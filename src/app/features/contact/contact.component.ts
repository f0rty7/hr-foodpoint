import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactFormComponent } from './components/contact-form/contact-form.component';
import { ContactIllustrationComponent } from './components/contact-illustration/contact-illustration.component';
import { ContactInfoComponent } from './components/contact-info/contact-info.component';
import { ContactFormData } from './services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ContactFormComponent,
    ContactIllustrationComponent,
    ContactInfoComponent
  ],
  template: `
    <div class="contact-container">
      <div class="contact-content">
        <!-- Left side - Form -->
        <app-contact-form
          (formSubmitted)="onFormSubmitted($event)"
          (formError)="onFormError($event)" />

        <!-- Right side - Illustration and Contact Info -->
        <div class="info-section">
          <app-contact-illustration />
          <app-contact-info />
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  // Using Angular v20 signals for state management
  lastSubmittedData = signal<ContactFormData | null>(null);
  lastError = signal<string | null>(null);

  // Event handlers for child components
  onFormSubmitted(data: ContactFormData): void {
    this.lastSubmittedData.set(data);
    this.lastError.set(null);

    // Show success message
    alert('Thank you! Your message has been sent successfully. We\'ll get back to you soon.');
  }

  onFormError(error: string): void {
    this.lastError.set(error);
    this.lastSubmittedData.set(null);

    // Show error message
    alert(error);
  }
}
