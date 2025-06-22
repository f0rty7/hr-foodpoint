import { Component, signal, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactService, ContactFormData } from '../../services/contact.service';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="form-section">
      <h1 class="main-title">Let's talk</h1>
      <p class="subtitle">
        To request a quote or want to meet up for coffee,
        contact us directly or fill out the form and we will
        get back to you promptly.
      </p>

      <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="contact-form">
        <div class="form-group">
          <input
            type="text"
            formControlName="name"
            placeholder="Your Name"
            class="form-input"
            [class.error]="contactForm.get('name')?.invalid && contactForm.get('name')?.touched">
          @if (contactForm.get('name')?.invalid && contactForm.get('name')?.touched) {
            <span class="error-message">Name is required</span>
          }
        </div>

        <div class="form-group">
          <input
            type="email"
            formControlName="email"
            placeholder="Your Email"
            class="form-input"
            [class.error]="contactForm.get('email')?.invalid && contactForm.get('email')?.touched">
          @if (contactForm.get('email')?.invalid && contactForm.get('email')?.touched) {
            <span class="error-message">
              @if (contactForm.get('email')?.errors?.['required']) {
                Email is required
              } @else if (contactForm.get('email')?.errors?.['email']) {
                Please enter a valid email address
              }
            </span>
          }
        </div>

        <div class="form-group">
          <input
            type="tel"
            formControlName="phone"
            placeholder="Phone Number (Optional)"
            class="form-input"
            [class.error]="contactForm.get('phone')?.invalid && contactForm.get('phone')?.touched">
          @if (contactForm.get('phone')?.invalid && contactForm.get('phone')?.touched) {
            <span class="error-message">Please enter a valid phone number</span>
          }
        </div>

        <div class="form-group">
          <textarea
            formControlName="message"
            placeholder="Type something if you want..."
            class="form-textarea"
            rows="5"
            [class.error]="contactForm.get('message')?.invalid && contactForm.get('message')?.touched">
          </textarea>
          @if (contactForm.get('message')?.invalid && contactForm.get('message')?.touched) {
            <span class="error-message">Message is required</span>
          }
        </div>

        <button
          type="submit"
          class="submit-button"
          [disabled]="contactForm.invalid || isSubmitting()">
          @if (isSubmitting()) {
            Sending...
          } @else {
            Send Message
          }
        </button>
      </form>
    </div>
  `,
  styleUrl: './contact-form.component.scss'
})
export class ContactFormComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);

  // Using Angular v20 signals
  isSubmitting = signal(false);
  submitCount = signal(0);

  // Output events
  formSubmitted = output<ContactFormData>();
  formError = output<string>();

  // Computed property using signals
  canSubmit = computed(() =>
    this.contactForm.valid && !this.isSubmitting() && this.submitCount() < 3
  );

  contactForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  async onSubmit(): Promise<void> {
    if (this.contactForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.submitCount.update(count => count + 1);

    try {
      const formData: ContactFormData = {
        firstName: this.contactForm.value.name.split(' ')[0] || '',
        lastName: this.contactForm.value.name.split(' ').slice(1).join(' ') || '',
        email: this.contactForm.value.email,
        phone: this.contactForm.value.phone || '',
        subject: 'general',
        message: this.contactForm.value.message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      await this.contactService.submitContactForm(formData);

      this.formSubmitted.emit(formData);
      this.resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
      this.formError.emit('Sorry, there was an error sending your message. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  resetForm(): void {
    this.contactForm.reset();
    this.submitCount.set(0);

    // Reset form validation state
    Object.keys(this.contactForm.controls).forEach(key => {
      this.contactForm.get(key)?.setErrors(null);
    });
  }
}
