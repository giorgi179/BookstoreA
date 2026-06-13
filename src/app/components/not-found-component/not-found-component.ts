import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found-component.html',
  styleUrl: './not-found-component.scss',
})
export class NotFoundComponent implements OnInit {
  @ViewChild('hero', { static: true }) heroRef!: ElementRef<HTMLElement>;

  ngOnInit(): void {
    requestAnimationFrame(() => {
      this.heroRef.nativeElement.classList.add('not-found--visible');
    });
  }
}