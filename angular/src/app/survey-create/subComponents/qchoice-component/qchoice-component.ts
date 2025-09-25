import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input } from '@angular/core';
import { SurveyStore } from 'src/app/stores/survey-store';
import { ChoiceQuestion } from 'src/app/types/surveyDoc.types';

@Component({
  selector: 'app-qchoice-component',
  standalone:true,
  imports: [],
  templateUrl: './qchoice-component.html',
  styleUrl: './qchoice-component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class QChoiceComponent {
  @Input({ required: true }) q!: ChoiceQuestion;
  @Input() multi = false;

  private store = inject(SurveyStore);

  onLabel(i: number, v: string) {
    const id = this.q.id;
    this.store.update('Edit option label', d => {
      for (const p of d.pages) {
        const qq = p.questions.find(x => x.id === id) as any;
        if (qq?.options) { qq.options[i].label = v; break; }
      }
    }, { batch: true });
  }

  addOpt() {
    this.store.addChoiceOption(this.q.id, 'Option');
  }
}
