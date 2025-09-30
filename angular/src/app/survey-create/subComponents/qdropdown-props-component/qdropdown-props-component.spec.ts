import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QdropdownPropsComponent } from './qdropdown-props-component';

describe('QdropdownPropsComponent', () => {
  let component: QdropdownPropsComponent;
  let fixture: ComponentFixture<QdropdownPropsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QdropdownPropsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QdropdownPropsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
