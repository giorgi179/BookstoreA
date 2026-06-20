import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderSerch } from './loader-serch';

describe('LoaderSerch', () => {
  let component: LoaderSerch;
  let fixture: ComponentFixture<LoaderSerch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderSerch],
    }).compileComponents();

    fixture = TestBed.createComponent(LoaderSerch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
