import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminLoginService } from '../../service/admin-login';


@Component({
  selector: 'app-mtavari-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mtavari-login.html',
  styleUrl: './mtavari-login.scss',
})
export class MtavariLogin {
  private auth = inject(AdminLoginService);

  email    = signal('');
  password = signal('');
  showPass = signal(false);

  readonly loading = this.auth.loading;
  readonly error   = this.auth.error;

  submit() {
    if (!this.email() || !this.password()) return;
    this.auth.login(this.email(), this.password()).subscribe();
  }
}