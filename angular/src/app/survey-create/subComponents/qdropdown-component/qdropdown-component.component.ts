import { Component, ElementRef, HostListener, Input, SimpleChanges } from '@angular/core';
import { SurveyStore } from 'src/app/stores/survey-store';
import { DropdownQuestion, Id, Option } from 'src/app/types/surveyDoc.types';

@Component({
  selector: 'app-qdropdown-component',
  templateUrl: 'qdropdown-component.component.html',
  styleUrls: ['qdropdown-component.component.scss'],
})
export class QdropdownComponent {
  @Input({ required: true }) q!: DropdownQuestion;
  @Input() multi = false;

  constructor(public store: SurveyStore, private el: ElementRef) {
  }

  openProps(id: Id) {
    this.store.selectQuestion(id);
  }

  open = false;
  get options(): Option[] {
    return this.q?.options ?? [];
  }
  selected: Option | null = null;

  get selectedLabel() {
    return this.selected?.label ?? 'Choose one';
  }

  // multi
  selectedMulti: Option[] = [];
  get selectedCount() {
    return this.selectedMulti.length;
  }
  has(o: Option) {
    return this.selectedMulti.some(x => x.id === o.id);
  }

  pick(o: Option) {
    // single
    if (this.multi) return;
    this.selected = o;
    this.open = false;
  }

  toggleMulti(o: Option) {
    const i = this.selectedMulti.findIndex(x => x.id === o.id);
    if (i >= 0) this.selectedMulti.splice(i, 1);
    else this.selectedMulti.push(o);
  }

  removeChip(id: string) {
    const i = this.selectedMulti.findIndex(x => x.id === id);
    if (i >= 0) this.selectedMulti.splice(i, 1);
  }

  toggle() {
    this.open = !this.open;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event) {
    if (!this.el.nativeElement.contains(e.target)) this.open = false;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['q']) this.reconcileSelection();
  }

  private reconcileSelection() {
    const ids = new Set((this.q?.options ?? []).map(o => o.id));

    if (this.selected && !ids.has(this.selected.id)) {
      this.selected = null;
    }

    if (this.selectedMulti.length) {
      this.selectedMulti = this.selectedMulti.filter(o => ids.has(o.id));
    }
  }
}
