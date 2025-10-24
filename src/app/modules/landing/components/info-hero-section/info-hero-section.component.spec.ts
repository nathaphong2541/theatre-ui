import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoHeroSectionComponent } from './info-hero-section.component';

describe('InfoHeroSectionComponent', () => {
  let component: InfoHeroSectionComponent;
  let fixture: ComponentFixture<InfoHeroSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoHeroSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoHeroSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
