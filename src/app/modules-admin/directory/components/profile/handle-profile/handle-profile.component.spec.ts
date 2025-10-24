import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleProfileComponent } from './handle-profile.component';

describe('HandleProfileComponent', () => {
  let component: HandleProfileComponent;
  let fixture: ComponentFixture<HandleProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandleProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandleProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
