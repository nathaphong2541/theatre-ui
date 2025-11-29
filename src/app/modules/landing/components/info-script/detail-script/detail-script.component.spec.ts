import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailScriptComponent } from './detail-script.component';

describe('DetailScriptComponent', () => {
  let component: DetailScriptComponent;
  let fixture: ComponentFixture<DetailScriptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailScriptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailScriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
