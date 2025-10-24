import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyConsetComponent } from './policy-conset.component';

describe('PolicyConsetComponent', () => {
  let component: PolicyConsetComponent;
  let fixture: ComponentFixture<PolicyConsetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolicyConsetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PolicyConsetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
