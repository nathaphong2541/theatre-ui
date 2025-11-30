import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSearchComponent } from './all-search.component';

describe('AllSearchComponent', () => {
  let component: AllSearchComponent;
  let fixture: ComponentFixture<AllSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
