import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoDonetComponent } from './info-donet.component';

describe('InfoDonetComponent', () => {
  let component: InfoDonetComponent;
  let fixture: ComponentFixture<InfoDonetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoDonetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoDonetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
