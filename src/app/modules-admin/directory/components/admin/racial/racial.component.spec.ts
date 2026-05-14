import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RacialComponent } from './racial.component';

describe('RacialComponent', () => {
  let component: RacialComponent;
  let fixture: ComponentFixture<RacialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RacialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
