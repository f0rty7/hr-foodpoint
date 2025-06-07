# HR FoodPoint - Homepage Feature

A modern Angular application featuring a lazy-loaded homepage route with food and job listings.

## Features

### 🚀 Modern Angular Architecture
- **Lazy Loading**: Homepage route is lazy loaded at `/app`
- **Standalone Components**: All components use Angular's standalone architecture
- **Signals**: Reactive state management using Angular signals
- **Defer Blocks**: Optimized loading with `@defer` blocks (ready for implementation)
- **NgOptimizedImage**: Performance-optimized image loading

### 🎨 Design Implementation
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Modern UI**: Clean, professional design matching the provided mockup
- **Component Architecture**: Modular components for maintainability

### 📱 Homepage Sections
1. **Header**: Navigation with logo and menu items
2. **Hero Section**: Main title with call-to-action button
3. **Popular Dishes**: Grid layout showcasing food items
4. **Job Listings**: Professional job postings display
5. **About Us**: Company information with image and text

## Technical Stack

- **Angular v18+**: Latest Angular features
- **TypeScript**: Type-safe development
- **SCSS**: Advanced styling with variables and mixins
- **Signals**: Modern reactive state management
- **Standalone Components**: No NgModules required

## Project Structure

```
hr-foodpoint/src/app/
├── features/
│   └── homepage/
│       ├── components/
│       │   ├── header/
│       │   ├── hero-section/
│       │   ├── popular-dishes/
│       │   ├── job-listings/
│       │   └── about-us/
│       ├── services/
│       │   ├── dish.service.ts
│       │   └── job.service.ts
│       ├── homepage.component.ts
│       ├── homepage.component.scss
│       └── homepage.routes.ts
├── app.routes.ts
└── app.component.html
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Navigate to Homepage**
   - Open browser to `http://localhost:4200`
   - Automatically redirects to `/app` (homepage route)

## Route Configuration

The homepage is configured as a lazy-loaded route:

```typescript
// app.routes.ts
{
  path: 'app',
  loadChildren: () => import('./features/homepage/homepage.routes').then(m => m.homepageRoutes)
}
```

## Modern Angular Features Used

### Signals for State Management
```typescript
dishes = signal([...]);
jobs = signal([...]);
```

### Control Flow Syntax
```typescript
@for (dish of dishes(); track dish.id) {
  <div class="dish-card">{{ dish.name }}</div>
}
```

### Inject Function
```typescript
private dishService = inject(DishService);
```

### Defer Blocks (Ready for Implementation)
```typescript
@defer (on viewport) {
  <app-popular-dishes />
} @placeholder {
  <div>Loading dishes...</div>
}
```

## Performance Optimizations

- **Lazy Loading**: Route-level code splitting
- **Signals**: Efficient change detection
- **NgOptimizedImage**: Optimized image loading
- **Defer Blocks**: Component-level lazy loading
- **CSS Grid**: Efficient layouts

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Adding New Components
1. Create component in appropriate feature directory
2. Use standalone component architecture
3. Implement signals for reactive state
4. Add proper TypeScript interfaces

### Styling Guidelines
- Use SCSS with BEM methodology
- Mobile-first responsive design
- CSS custom properties for theming
- Consistent spacing and typography

## Future Enhancements

- [ ] Implement actual API integration
- [ ] Add authentication
- [ ] Implement search functionality
- [ ] Add animations and transitions
- [ ] PWA capabilities
- [ ] Internationalization (i18n)

## License

MIT License
