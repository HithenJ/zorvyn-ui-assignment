import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <div *ngFor="let toast of notificationService.getToasts()()" 
           class="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 fade-in duration-300 pointer-events-auto min-w-[240px]">
        
        <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
             [ngClass]="{
               'bg-emerald-500/10 text-emerald-500': toast.type === 'success',
               'bg-rose-500/10 text-rose-500': toast.type === 'error',
               'bg-indigo-500/10 text-indigo-500': toast.type === 'info'
             }">
          <i class="bi" 
             [ngClass]="{
               'bi-check-circle-fill': toast.type === 'success',
               'bi-exclamation-triangle-fill': toast.type === 'error',
               'bi-info-circle-fill': toast.type === 'info'
             }"></i>
        </div>

        <div class="flex-1">
          <p class="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-0.5">{{ toast.type }}</p>
          <p class="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">{{ toast.message }}</p>
        </div>

        <button (click)="notificationService.remove(toast.id)" 
                class="ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
          <i class="bi bi-x text-lg"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ToastComponent {
  notificationService = inject(NotificationService);
}
