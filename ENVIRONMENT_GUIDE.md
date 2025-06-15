# Angular Environment Configuration Guide

This document explains how to use the different environment configurations in your HR Foodpoint Angular application.

## 📁 Environment Files Structure

```
src/environments/
├── environment.ts                # Production (default)
├── environment.development.ts    # Development 
└── environment.staging.ts        # Staging
```

## 🚀 Environment Configurations

### Production Environment
- **File**: `environment.ts`
- **Features**: 
  - Production API URL
  - Analytics enabled
  - Logging disabled
  - Optimized build

### Development Environment  
- **File**: `environment.development.ts`
- **Features**:
  - Local API URL
  - Analytics disabled  
  - Logging enabled
  - Source maps enabled
  - Debugging enabled

### Staging Environment
- **File**: `environment.staging.ts`
- **Features**:
  - Staging API URL
  - Analytics enabled
  - Logging enabled
  - Optimized build with source maps

## 🛠️ Build Commands

### Development Build & Serve
```bash
# Development mode (default)
npm run ui
# or explicitly 
ng serve --configuration development
ng build --configuration development
```

### Production Build
```bash
ng build --configuration production
# or simply
ng build
```

### Staging Build & Serve
```bash
ng build --configuration staging
ng serve --configuration staging
```

## 🔧 Environment Variables Available

All environments include these variables:

```typescript
export const environment = {
  production: boolean,           // Production flag
  apiUrl: string,               // API base URL
  appName: string,              // Application name
  version: string,              // Version number
  enableLogging: boolean,       // Console logging
  features: {
    analytics: boolean,         // Analytics tracking
    debugging: boolean          // Debug features
  }
};
```

## 📝 Using Environment Variables in Code

Import environment in your services/components:

```typescript
import { environment } from '../../../environments/environment';

// Example usage
const apiUrl = environment.apiUrl;
const isProduction = environment.production;

if (environment.enableLogging) {
  console.log('Debug information');
}
```

## 🎯 Build Optimizations by Environment

### Development
- ❌ No optimization
- ✅ Source maps enabled
- ✅ Named chunks
- ✅ Vendor chunk separation
- ❌ No build optimizer

### Staging  
- ✅ Optimization enabled
- ✅ Source maps enabled
- ❌ No named chunks
- ❌ No vendor chunk separation
- ✅ Output hashing

### Production
- ✅ Full optimization
- ❌ No source maps
- ❌ No named chunks
- ❌ No vendor chunk separation
- ✅ Output hashing
- ✅ License extraction

## 📊 Bundle Size Limits

### Production & Staging
- Initial bundle: 500KB warning, 1MB error
- Component styles: 4KB warning, 8KB error

### Staging (More Lenient)
- Initial bundle: 600KB warning, 1.2MB error  
- Component styles: 5KB warning, 10KB error

## 🧪 Testing with Environments

Run tests with specific environments:

```bash
# Test with development environment
ng test --configuration development

# Test with staging environment  
ng test --configuration staging
```

## 🚀 Deployment Examples

### Development Deployment
```bash
ng build --configuration development
# Deploy dist/ to development server
```

### Staging Deployment
```bash
ng build --configuration staging
# Deploy dist/ to staging server
```

### Production Deployment
```bash
ng build --configuration production
# Deploy dist/ to production server
```

## 🎛️ Advanced Configuration

You can override specific options using multiple configurations:

```bash
ng build --configuration staging,production
```

This applies staging configuration first, then production overrides.

## 🔒 Environment Security

- ✅ Environment files are included in version control
- ⚠️ Don't put sensitive secrets in environment files
- ✅ Use Angular's build-time replacement system
- ✅ Secrets should be injected at runtime or build time

## 📖 Related Documentation

- [Official Angular Environment Guide](https://angular.dev/tools/cli/environments)
- [Angular Build Configurations](https://angular.dev/tools/cli/build)
- [Angular CLI Commands](https://angular.dev/cli) 