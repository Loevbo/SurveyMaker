import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QChoiceComponent } from './qchoice-component';

describe('QChoiceComponent', () => {
  let component: QChoiceComponent;
  let fixture: ComponentFixture<QChoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QChoiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QChoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
