import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QChoicePropsComponent } from './qchoice-props-component';

describe('QChoicePropsComponent', () => {
  let component: QChoicePropsComponent;
  let fixture: ComponentFixture<QChoicePropsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QChoicePropsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QChoicePropsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
