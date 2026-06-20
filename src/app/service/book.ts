import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { books } from '../controlers';

export interface BookDetails {
  id: number;
  author: string;
  description: string;
  publisher: string;
  pageCount: number;
  publishedDate: string;
  language: string;
  bookId: number;
}
@Injectable({
  providedIn: 'root',
})
export class Book {
  readonly apiUrl = 'https://bookapi-oc2p.onrender.com/api';

  readonly http = inject(HttpClient);

  getBooks(): Observable<books[]> {
    return this.http.get<books[]>(`${this.apiUrl}/Book/get-book-tolist`);
  }
  getBookDetails(): Observable<BookDetails[]> {
    return this.http.get<BookDetails[]>(`${this.apiUrl}/Book/get-book-detals-tolist`);
  }
  search(q: string): Observable<books[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<books[]>(`${this.apiUrl}/Book/search-books`, { params });
  }
}
