import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestedProgressComponent } from './requested-progress.component';

describe('RequestedProgressComponent', () => {
  let component: RequestedProgressComponent;
  let fixture: ComponentFixture<RequestedProgressComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestedProgressComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestedProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
