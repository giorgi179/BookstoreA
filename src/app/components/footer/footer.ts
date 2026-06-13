import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../service/profile';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  private svc = inject(ProfileService);

  email = '';
  subscribeChecked = false;

  msg = signal('');
  err = signal(false);
  loading = signal(false);
  subscribed = signal(false);

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubscribe(): void {
    this.msg.set('');
    this.err.set(false);

    const trimmed = this.email.trim();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      this.msg.set('Please enter a valid email address.');
      this.err.set(true);
      return;
    }

    if (!this.subscribeChecked) {
      this.msg.set('Please check the box to subscribe.');
      this.err.set(true);
      return;
    }

    this.loading.set(true);

    this.svc.subscribeNewsletterPublic(trimmed).subscribe({
      next: () => {
        this.loading.set(false);
        this.subscribed.set(true);
        this.msg.set('Thank you for joining the Story Circle!');
        this.err.set(false);
        this.email = '';
        this.subscribeChecked = false;

        setTimeout(() => this.subscribed.set(false), 3000);
      },
      error: (e) => {
        this.loading.set(false);
        this.msg.set('You are already subscribed to the newsletter.');
       
        this.err.set(true);
      },
    });
  }
}