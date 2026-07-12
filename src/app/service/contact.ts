import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Contacts {
  readonly apiUrl = 'https://bookapi-oc2p.onrender.com/api'; 
  readonly n8nUrl = 'https://giorgi0012.app.n8n.cloud/webhook/books';

  readonly http = inject(HttpClient);

  setContact(data: { lastName: string; firstName: string; email: string; massage: string }) {
  
    const saveToDb = this.http.post(
      `${this.apiUrl}/User/user-massage`,
      {},
      {
        params: {
          lastName: data.lastName,
          firstName: data.firstName,
          email: data.email,
          massage: data.massage
        }
      }
    );


    const sendToN8n = this.http.post(this.n8nUrl, data).pipe(
      catchError((err) => {
        console.error('n8n error:', err);
        return of(null); 
      })
    );

    // ორივეს ერთდროულად გაშვება
    return forkJoin([saveToDb, sendToN8n]);
  }
}