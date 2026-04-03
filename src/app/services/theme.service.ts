import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSignal = signal<boolean>(this.getInitialTheme());

  isDarkMode = this.darkModeSignal.asReadonly();

  constructor() {
    this.updateTheme(this.darkModeSignal());
  }

  toggleDarkMode(): void {
    const newState = !this.darkModeSignal();
    this.darkModeSignal.set(newState);
    this.updateTheme(newState);
    localStorage.setItem('theme', newState ? 'dark' : 'light');
  }

  private getInitialTheme(): boolean {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private updateTheme(isDark: boolean): void {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-bs-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-bs-theme', 'light');
    }
  }
}
