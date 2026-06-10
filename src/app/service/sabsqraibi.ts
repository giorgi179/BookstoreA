import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Sabsqraibi {
  readonly apiUrl = 'https://bookapi-h00v.onrender.com/api';

  readonly http = inject(HttpClient);

  
}
