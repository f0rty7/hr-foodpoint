import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-illustration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="illustration">
      <div class="email-icon">
        <div class="envelope">
          <div class="envelope-front"></div>
          <div class="envelope-back"></div>
          <div class="letter"></div>
        </div>
        <div class="floating-elements">
          <div class="chat-bubble"></div>
          <div class="airplane"></div>
          <div class="dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './contact-illustration.component.scss'
})
export class ContactIllustrationComponent {
  // This component focuses purely on the illustration
}
