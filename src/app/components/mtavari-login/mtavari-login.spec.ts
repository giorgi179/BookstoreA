import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MtavariLogin } from './mtavari-login';

describe('MtavariLogin', () => {
  let component: MtavariLogin;
  let fixture: ComponentFixture<MtavariLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MtavariLogin],
    }).compileComponents();

    fixture = TestBed.createComponent(MtavariLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
