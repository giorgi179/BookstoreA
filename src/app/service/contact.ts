import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Contacts {
  // readonly apiUrl = 'https://bookapi-oc2p.onrender.com/api';
  readonly apiUrl = 'https://giorgi0012.app.n8n.cloud/webhook-test/0a0adde1-0392-436a-8ff9-5113375a9c06';

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
