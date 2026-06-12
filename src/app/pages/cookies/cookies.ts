import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

const CONSENT_KEY = 'cookieConsent';

interface CookiePrefs {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookies.html',
  styleUrls: ['./cookies.scss'],
})
export class Cookies implements OnInit {
  prefs: CookiePrefs = {
    necessary: true,
    preferences: true,
    analytics: false,
    marketing: false,
  };

  saved = false;

  ngOnInit(): void {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.prefs = {
          necessary: true,
          preferences: parsed.preferences ?? true,
          analytics: parsed.analytics ?? false,
          marketing: parsed.marketing ?? false,
        };
      } catch {
        // invalid stored value — keep defaults
      }
    }
  }

  savePreferences(): void {
    const consent = {
      ...this.prefs,
      decidedAt: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

    this.saved = true;
    setTimeout(() => (this.saved = false), 2000);
  }
}