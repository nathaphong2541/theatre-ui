import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartnerDirectoriesComponent } from './partner-directories.component';

describe('PartnerDirectoriesComponent', () => {
  let component: PartnerDirectoriesComponent;
  let fixture: ComponentFixture<PartnerDirectoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerDirectoriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartnerDirectoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
