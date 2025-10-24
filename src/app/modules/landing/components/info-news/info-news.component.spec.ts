import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoNewsComponent } from './info-news.component';

describe('InfoNewsComponent', () => {
  let component: InfoNewsComponent;
  let fixture: ComponentFixture<InfoNewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoNewsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoNewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
