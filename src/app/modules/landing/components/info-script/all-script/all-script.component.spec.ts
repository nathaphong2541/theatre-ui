import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllScriptComponent } from './all-script.component';

describe('AllScriptComponent', () => {
  let component: AllScriptComponent;
  let fixture: ComponentFixture<AllScriptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllScriptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllScriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
