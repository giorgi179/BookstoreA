import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import AOS from 'aos';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('heroSection', { static: true })
  heroRef!: ElementRef;

  readonly imageUrl =
    'https://static.wixstatic.com/media/c837a6_676a9365b50d427dae8f9ea112f4a956~mv2.jpg/v1/fill/w_605,h_709,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/c837a6_676a9365b50d427dae8f9ea112f4a956~mv2.jpg';

  isVisible = true;

  private intervalId: ReturnType<typeof setInterval> | undefined;

  testimonials = [
    {
      text: 'Each page felt like stepping into a hidden world filled with emotion, mystery, and breathtaking beauty.',
      author: 'Sophia Laurent',
    },
    {
      text: 'Aurelia has a rare gift for turning ordinary moments into unforgettable pieces of magic and wonder.',
      author: 'Evelyn Hart',
    },
    {
      text: 'Her storytelling wraps around your heart slowly, leaving behind memories that linger for days.',
      author: 'Luna Whitmore',
    },
    {
      text: 'I lost track of time while reading. Every sentence carried warmth, elegance, and quiet power.',
      author: 'Amelia Rosewood',
    },
    {
      text: 'The atmosphere in these stories is unmatched — hauntingly beautiful, delicate, and deeply human.',
      author: 'Isabelle Monroe',
    },
  ];

  // ─── Signals ───────────────────────────────
  currentIndex = signal(0);
  prevIndex = signal(-1);

  // public — template-ს წვდომა აქვს ✓
  goTo(next: number): void {
    this.prevIndex.set(this.currentIndex());
    this.currentIndex.set(next);

    setTimeout(() => {
      this.prevIndex.set(-1);
    }, 850);
  }

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.goTo((this.currentIndex() + 1) % this.testimonials.length);
    }, 3000);
  }

  ngAfterViewInit(): void {
    AOS.init({
      once: false,
      mirror: true,
      offset: 80,
      throttleDelay: 99,
    });

    // DOM-ის render-ის შემდეგ refresh, რომ ახალი elements "დაითვალოს"
    setTimeout(() => {
      AOS.refreshHard();
    }, 0);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
