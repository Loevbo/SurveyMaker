import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockPaletteComponent } from './block-palette.component';

describe('BlockPaletteComponent', () => {
  let component: BlockPaletteComponent;
  let fixture: ComponentFixture<BlockPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockPaletteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlockPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
