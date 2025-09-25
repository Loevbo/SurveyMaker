import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { SurveyStore } from 'src/app/stores/survey-store';
import { ChoiceQuestion } from 'src/app/types/surveyDoc.types';

@Component({
  selector: 'app-qchoice-props',
  standalone:true,
  imports: [CommonModule],
  templateUrl: './qchoice-props-component.html',
  styleUrl: './qchoice-props-component.scss'
})
export class QChoicePropsComponent {
  private store = inject(SurveyStore);

  // typed computed question (will re-render on any change)
  q = computed(() => this.store.selectedQuestion() as ChoiceQuestion | undefined);

  private id() { return this.q()!.id; }

  setTitle(v: string) {
    this.store.updateQuestion<ChoiceQuestion>(this.id(), 'Edit choice title', q => q.title = v, { batch: true });
  }
  add() {
    this.store.updateQuestion<ChoiceQuestion>(this.id(), 'Add option', q => {
      q.options.push({ id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), label: 'Option' });
    });
  }
  rename(i: number, v: string) {
    this.store.updateQuestion<ChoiceQuestion>(this.id(), 'Rename option', q => q.options[i].label = v, { batch: true });
  }
  remove(i: number) {
    this.store.updateQuestion<ChoiceQuestion>(this.id(), 'Remove option', q => q.options.splice(i, 1));
  }
  setShuffle(v: boolean) {
    this.store.updateQuestion<ChoiceQuestion>(this.id(), 'Toggle shuffle', q => q.props.shuffle = v);
  }
  setOther(v: boolean) {
    this.store.updateQuestion<ChoiceQuestion>(this.id(), 'Toggle other', q => q.props.other = v);
  }
  setLayout(v: 'list'|'grid') {
    this.store.updateQuestion<ChoiceQuestion>(this.id(), 'Change layout', q => q.props.layout = v);
  }
}
