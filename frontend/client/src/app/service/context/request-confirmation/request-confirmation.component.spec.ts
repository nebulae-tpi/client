import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestConfirmationComponent } from './request-confirmation.component';

describe('RequestConfirmationComponent', () => {
  let component: RequestConfirmationComponent;
  let fixture: ComponentFixture<RequestConfirmationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestConfirmationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
