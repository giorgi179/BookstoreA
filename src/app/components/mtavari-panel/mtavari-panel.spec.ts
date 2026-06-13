import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MtavariPanel } from './mtavari-panel';

describe('MtavariPanel', () => {
  let component: MtavariPanel;
  let fixture: ComponentFixture<MtavariPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MtavariPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(MtavariPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
