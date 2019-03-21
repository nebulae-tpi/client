import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogArrivedComponent } from './dialog-arrived.component';

describe('DialogArrivedComponent', () => {
  let component: DialogArrivedComponent;
  let fixture: ComponentFixture<DialogArrivedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogArrivedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogArrivedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
