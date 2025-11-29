import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDramaComponent } from './list-drama.component';

describe('ListDramaComponent', () => {
  let component: ListDramaComponent;
  let fixture: ComponentFixture<ListDramaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListDramaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListDramaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
