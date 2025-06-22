# Contact Feature

This contact feature implements a modern, responsive contact form using Angular v20 features and Material Design components.

## Features

### Angular v20 Features Used
- **Standalone Components**: No need for NgModule declarations
- **Signals**: For reactive state management (`isSubmitting`, `submitCount`)
- **Computed Properties**: Derived state from signals (`canSubmit`)
- **Control Flow Syntax**: New `@if` and `@else` syntax for conditional rendering
- **Inject Function**: Modern dependency injection pattern
- **TypeScript 5.8**: Latest TypeScript features and strict typing

### UI/UX Features
- **Responsive Design**: Mobile-first approach with grid layouts
- **Modern Material Design**: Outlined form fields, elevated cards
- **Hero Section**: Eye-catching gradient background with 3D image effect
- **Form Validation**: Real-time validation with helpful error messages
- **Loading States**: Visual feedback during form submission
- **Success/Error Notifications**: Snackbar notifications for user feedback
- **Accessibility**: ARIA labels and keyboard navigation support

### Form Features
- **Reactive Forms**: Angular reactive forms with TypeScript validation
- **Email Validation**: RFC-compliant email validation
- **Phone Validation**: International phone number format support
- **Character Limits**: Minimum/maximum character validation
- **Subject Categories**: Predefined contact subjects
- **Form Reset**: Clean form reset functionality
- **Submission Limiting**: Prevents spam with submission count tracking

### Backend Integration
- **Encore.ts API**: Type-safe API endpoints
- **Structured Logging**: Comprehensive logging for monitoring
- **Error Handling**: Graceful error handling and user feedback
- **Data Validation**: Server-side validation and sanitization

## Project Structure

```
src/app/features/contact/
├── contact.component.ts          # Main container component
├── contact.component.scss        # Container layout styling
├── contact.routes.ts            # Lazy route configuration
├── components/                   # Feature components
│   ├── contact-form/
│   │   ├── contact-form.component.ts        # Form logic with Angular v20 features
│   │   └── contact-form.component.scss      # Form styling
│   ├── contact-illustration/
│   │   ├── contact-illustration.component.ts # Email illustration
│   │   └── contact-illustration.component.scss # Illustration styling & animations
│   └── contact-info/
│       ├── contact-info.component.ts        # Contact details & social links
│       └── contact-info.component.scss      # Contact info styling
├── services/
│   └── contact.service.ts       # HTTP service with async/await
└── README.md                    # This file

app/contact/
├── encore.service.ts            # Encore service configuration
└── contact.ts                   # Backend API endpoints
```

## Usage

### Navigation
The contact page is accessible via:
- Desktop navigation: "Contact" link in header
- Mobile navigation: "Contact" link in mobile menu
- Direct URL: `/contact`

### API Endpoints
- `POST /contact/submit` - Submit contact form
- `GET /contact/info` - Get contact information
- `GET /contact/health` - Health check

### Form Fields
- **First Name** (required, min 2 chars)
- **Last Name** (required, min 2 chars)
- **Email** (required, valid email format)
- **Phone** (optional, international format)
- **Subject** (required, dropdown selection)
- **Message** (required, min 10 chars)

## Styling Features

### Color Scheme
- Primary: Purple gradient (#667eea to #764ba2)
- Background: Light gray (#f8fafc)
- Cards: White with subtle shadows
- Text: Semantic color hierarchy

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 768px
- Desktop: > 768px

### Animations
- Hover effects on cards and buttons
- Loading pulse animation
- Smooth transitions and transforms
- 3D perspective effects on hero image

## Future Enhancements

- [ ] reCAPTCHA integration
- [ ] File attachment support
- [ ] Live chat integration
- [ ] Multi-language support
- [ ] Advanced analytics tracking
- [ ] Email template customization
- [ ] Auto-response functionality 
