import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should scroll to the top on initialization', () => {
    let calledWith: ScrollToOptions | null = null;
    const originalScrollTo = window.scrollTo;

    Object.defineProperty(window, 'scrollTo', {
      value: (options: ScrollToOptions) => {
        calledWith = options;
      },
      writable: true,
    });

    component.ngOnInit();

    expect(calledWith).toEqual({ top: 0, behavior: 'smooth' });

    Object.defineProperty(window, 'scrollTo', {
      value: originalScrollTo,
      writable: true,
    });
  });
});
