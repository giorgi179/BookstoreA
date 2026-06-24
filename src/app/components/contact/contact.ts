import { Component, inject } from '@angular/core';
import { Contacts } from '../../service/contact';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  readonly apiUrl = inject(Contacts);
  readonly fb = inject(FormBuilder);

  contactForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    massage: ['', [Validators.required, Validators.minLength(10)]]
  });

  submit(){

    if (this.contactForm.invalid) {
      alert('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }
    
    const FormValue = this.contactForm.getRawValue();
    console.log('Sending to API:', JSON.stringify(FormValue));
    
    this.apiUrl.setContact(FormValue).subscribe({
      next: (response) => {
      
        alert('წარმატებით გაიგზავნა!');
        this.contactForm.reset();
      },
      error: (err) => {
      
        let errorMessage = `შეცდომა: ${err.status}`;
        
        if (err.error?.errors) {
          const errors = err.error.errors;
          const errorList = Object.entries(errors)
            .map(([key, value]: any) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          errorMessage = `ვალიდაციის შეცდომები:\n${errorList}`;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        
        alert(errorMessage);
      }
    });
  }
}

