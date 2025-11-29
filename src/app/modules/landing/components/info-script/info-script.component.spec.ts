import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoScriptComponent } from './info-script.component';

describe('InfoScriptComponent', () => {
  let component: InfoScriptComponent;
  let fixture: ComponentFixture<InfoScriptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoScriptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoScriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
