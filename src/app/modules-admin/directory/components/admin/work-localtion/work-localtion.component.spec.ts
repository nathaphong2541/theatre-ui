import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkLocaltionComponent } from './work-localtion.component';

describe('WorkLocaltionComponent', () => {
  let component: WorkLocaltionComponent;
  let fixture: ComponentFixture<WorkLocaltionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkLocaltionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkLocaltionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
