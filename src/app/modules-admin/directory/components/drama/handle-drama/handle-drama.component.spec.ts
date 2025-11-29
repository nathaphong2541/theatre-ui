import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleDramaComponent } from './handle-drama.component';

describe('HandleDramaComponent', () => {
  let component: HandleDramaComponent;
  let fixture: ComponentFixture<HandleDramaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandleDramaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandleDramaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
