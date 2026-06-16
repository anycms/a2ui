import { provideZonelessChangeDetection, type ApplicationConfig } from '@angular/core';

// Zoneless is the default in Angular v21; provide it explicitly for clarity.
export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};
