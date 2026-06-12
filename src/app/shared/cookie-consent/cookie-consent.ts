import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

const CONSENT_KEY = 'cookieConsent';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-consent.html',
  styleUrls: ['./cookie-consent.scss'],
})
export class CookieConsent implements OnInit {
  visible = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      this.visible = true;
    }
  }

  acceptAll(): void {
    const consent = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
      decidedAt: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    this.visible = false;
  }

  managePreferences(): void {
    this.visible = false;
    this.router.navigate(['/cookies']);
  }
}