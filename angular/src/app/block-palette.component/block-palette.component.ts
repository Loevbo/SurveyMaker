import { Component, EventEmitter, Input, Output, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type BlockKind =
  | 'short-answer' | 'long-answer' | 'multiple-choice' | 'checkboxes'
  | 'dropdown' | 'multi-select' | 'number' | 'email' | 'phone'
  | 'link' | 'file' | 'date' | 'time' | 'rating' | 'signature'
  | 'matrix' | 'linear-scale' | 'payment' | 'ranking' | 'wallet';

interface BlockDef {
  id: BlockKind;
  name: string;
  category: 'Questions' | 'Layout blocks';
  description: string;
  exampleLabel?: string;
  exampleHtml: string;
  payload: any;
  icon?: string;
}

const BLOCKS: BlockDef[] = [
  {
    id: 'short-answer',
    name: 'Short answer',
    category: 'Questions',
    description: 'Question with a single-line text response. Add a label or placeholder.',
    exampleLabel: 'Example',
    exampleHtml: `<div class="ex"><label>What is your first name?</label><input type="text" /></div>`,
    payload: { type: 'shortText', label: 'Untitled question', placeholder: 'Your answer', required: false }
  },
  {
    id: 'long-answer',
    name: 'Long answer',
    category: 'Questions',
    description: 'Question with a multi-line text response.',
    exampleLabel: 'Example',
    exampleHtml: `<div class="ex"><label>Describe your experience</label><textarea rows="3"></textarea></div>`,
    payload: { type: 'longText', label: 'Untitled question', placeholder: 'Type here…', required: false }
  },
  {
    id: 'multiple-choice',
    name: 'Multiple choice',
    category: 'Questions',
    description: 'One answer from a list of choices.',
    exampleLabel: 'Example',
    exampleHtml: `<div class="ex"><label>Which plan?</label><div><input type="radio"/> Basic</div><div><input type="radio"/> Pro</div><div><input type="radio"/> Team</div></div>`,
    payload: { type: 'singleChoice', label: 'Untitled question', options: ['Option 1','Option 2','Option 3'], required: false }
  },
  {
    id: 'checkboxes',
    name: 'Checkboxes',
    category: 'Questions',
    description: 'Select multiple answers.',
    exampleLabel: 'Example',
    exampleHtml: `<div class="ex"><label>Choose features</label><div><input type="checkbox"/> A</div><div><input type="checkbox"/> B</div></div>`,
    payload: { type: 'multiChoice', label: 'Untitled question', options: ['Option 1','Option 2','Option 3'], required: false }
  },
  {
    id: 'dropdown',
    name: 'Dropdown',
    category: 'Questions',
    description: 'Compact list in a dropdown.',
    exampleLabel: 'Example',
    exampleHtml: `<div class="ex"><label>Country</label><select><option>Choose…</option></select></div>`,
    payload: { type: 'dropdown', label: 'Untitled question', options: ['Option 1','Option 2','Option 3'], required: false }
  },
  {
    id: 'date',
    name: 'Date',
    category: 'Questions',
    description: 'Pick a calendar date.',
    exampleLabel: 'Example',
    exampleHtml: `<div class="ex"><label>Pick a date</label><input type="date"/></div>`,
    payload: { type: 'date', label: 'Untitled question', required: false }
  }
];

@Component({
  selector: 'app-block-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './block-palette.component.html',
  styleUrls: ['./block-palette.component.scss']
})
export class BlockPaletteComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() insert = new EventEmitter<any>();

  q = signal('');
  selectedId = signal<BlockKind | null>(null);
  hoverIndex = signal(0);

  cats = computed(() => ['Questions','Layout blocks']);
  filtered = computed(() => {
    const s = this.q().toLowerCase().trim();
    return BLOCKS.filter(b => !s || b.name.toLowerCase().includes(s) || b.description.toLowerCase().includes(s));
  });
  selected = computed(() => this.filtered()[Math.min(this.hoverIndex(), this.filtered().length-1)] ?? null);

  openWith(kind?: BlockKind) {
    this.open = true;
    setTimeout(() => {
      if (kind) {
        const i = this.filtered().findIndex(b => b.id === kind);
        this.hoverIndex.set(i >= 0 ? i : 0);
      } else {
        this.hoverIndex.set(0);
      }
    });
  }

  pick(i: number) {
    this.hoverIndex.set(i);
  }

  doInsert() {
    const sel = this.selected();
    if (sel) this.insert.emit(structuredClone(sel.payload));
  }

  doClose() {
    this.close.emit();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.open) return;
    if (e.key === 'Escape') { this.doClose(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); this.hoverIndex.set(Math.min(this.hoverIndex()+1, this.filtered().length-1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); this.hoverIndex.set(Math.max(this.hoverIndex()-1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); this.doInsert(); }
  }
}
