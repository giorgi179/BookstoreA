import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
}

const BASE_URL = 'https://yourdomain.ge'; // ← შენი დომეინი

const PAGE_SEO: Record<string, SeoConfig> = {
  '/':              { title: 'BookStore – წიგნების ონლაინ მაღაზია საქართველოში', description: 'BookStore-ზე იპოვე საუკეთესო წიგნები ქართულ და ინგლისურ ენაზე. ფართო კოლექცია, სწრაფი მიტანა.', keywords: 'წიგნები, ონლაინ მაღაზია, ქართული წიგნები', ogImage: BASE_URL + '/assets/og-image.jpg' },
  '/books':         { title: 'ყველა წიგნი – BookStore', description: 'დაათვალიერე ჩვენი მთელი კოლექცია – მხატვრული, სამეცნიერო, სამოტივაციო და სხვა.', keywords: 'წიგნები, კატალოგი, ჟანრი', ogImage: BASE_URL + '/assets/og-image.jpg' },
  '/about':         { title: 'ჩვენს შესახებ – BookStore', description: 'გაიცანი BookStore – ქართული ონლაინ წიგნების მაღაზია.', keywords: 'ჩვენს შესახებ, BookStore', ogImage: BASE_URL + '/assets/og-image.jpg' },
  '/contact':       { title: 'კონტაქტი – BookStore', description: 'დაგვიკავშირდი! ჩვენი გუნდი მზადაა დაგეხმაროს.', keywords: 'კონტაქტი, BookStore' },
  '/events':        { title: 'ღონისძიებები – BookStore', description: 'BookStore-ის მიმდინარე ღონისძიებები – პრეზენტაციები და სხვა.', keywords: 'ღონისძიებები, წიგნი' },
  '/basket':        { title: 'კალათა – BookStore', description: 'შეამოწმე კალათა და გააფორმე შეკვეთა.' },
  '/profile':       { title: 'პროფილი – BookStore', description: 'მართე შენი ანგარიში და შეკვეთები.' },
  '/terms':         { title: 'წესები და პირობები – BookStore', description: 'BookStore-ის გამოყენების წესები და პირობები.' },
  '/privacy':       { title: 'კონფიდენციალობა – BookStore', description: 'BookStore-ის კონფიდენციალობის პოლიტიკა.' },
  '/cookies':       { title: 'Cookie პოლიტიკა – BookStore', description: 'Cookie-ების გამოყენების პოლიტიკა.' },
  '/accessibility': { title: 'ხელმისაწვდომობა – BookStore', description: 'BookStore ზრუნავს ყველა მომხმარებლის ხელმისაწვდომობაზე.' },
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(
    private meta: Meta,
    private titleService: Title,
    private router: Router
  ) {}

  initRouteListener(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const path = event.urlAfterRedirects.split('?')[0];
        const config = PAGE_SEO[path] ?? PAGE_SEO['/'];
        this.updateSeo({ ...config, ogUrl: BASE_URL + path, canonicalUrl: BASE_URL + path });
      });
  }

  updateSeo(config: SeoConfig): void {
    this.titleService.setTitle(config.title);
    this.setName('description', config.description);
    if (config.keywords) this.setName('keywords', config.keywords);

    this.setProp('og:title',       config.title);
    this.setProp('og:description', config.description);
    this.setProp('og:url',         config.ogUrl ?? BASE_URL);
    this.setProp('og:type',        'website');
    if (config.ogImage) this.setProp('og:image', config.ogImage);

    this.setName('twitter:card',        'summary_large_image');
    this.setName('twitter:title',       config.title);
    this.setName('twitter:description', config.description);
    if (config.ogImage) this.setName('twitter:image', config.ogImage);

    if (config.canonicalUrl) this.setCanonical(config.canonicalUrl);
  }

  updateBookSeo(book: { title: string; author: string; description: string; imageUrl?: string; id: string }): void {
    const desc = book.description.length > 160 ? book.description.slice(0, 157) + '...' : book.description;
    this.updateSeo({
      title: `${book.title} – ${book.author} | BookStore`,
      description: desc,
      keywords: `${book.title}, ${book.author}, წიგნი`,
      ogImage: book.imageUrl,
      ogUrl: `${BASE_URL}/books/${book.id}`,
      canonicalUrl: `${BASE_URL}/books/${book.id}`,
    });
  }

  private setName(name: string, content: string): void {
    this.meta.getTag(`name="${name}"`)
      ? this.meta.updateTag({ name, content })
      : this.meta.addTag({ name, content });
  }

  private setProp(property: string, content: string): void {
    this.meta.getTag(`property="${property}"`)
      ? this.meta.updateTag({ property, content })
      : this.meta.addTag({ property, content });
  }

  private setCanonical(url: string): void {
    let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
    el.setAttribute('href', url);
  }
}