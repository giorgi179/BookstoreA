import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Contacts {
  readonly apiUrl = 'https://bookapi-h00v.onrender.com/api';

  readonly http = inject(HttpClient);

  setContact(data: { lastName: string; firstName: string; email: string; massage: string }) {
    return this.http.post(
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
  }
}
