import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { IconPickerComponent } from 'src/app/shared/icon-picker/icon-picker-component/icon-picker-component';
import { SurveyStore } from 'src/app/stores/survey-store';
import { ChoiceQuestion, Question } from 'src/app/types/surveyDoc.types';

@Component({
  selector: 'app-qdropdown-props',
  imports: [CommonModule, IconPickerComponent],
  templateUrl: './qdropdown-props-component.html',
  styleUrl: './qdropdown-props-component.scss',
})
export class QdropdownPropsComponent {
  private store = inject(SurveyStore);

  q = computed<Question | undefined>(() => {
    const anyQ = this.store.selectedQuestion();
    return anyQ && (anyQ.type === 'dropdown' || anyQ.type === 'multiSelect')
      ? (anyQ as Question)
      : undefined;
  });

  isSingle = () => this.q()?.type === 'multiSelect';

  setDesc(v: string) {
    const id = this.q()!.id;
    this.store.updateQuestion<ChoiceQuestion>(
      id,
      q => {
        q.helpText = v; // if you added a description prop
      },
      { batch: true, label: 'Edit text' }
    );
  }

  add() {
    const id = this.q()!.id;
    this.store.addChoiceOption(id, 'Option');
  }
  rename(i: number, v: string) {
    const id = this.q()!.id;
    this.store.update(
      'Edit option',
      d => {
        for (const p of d.pages) {
          const qq = p.questions.find(x => x.id === id) as ChoiceQuestion | undefined;
          if (qq) {
            qq.options[i].label = v;
            break;
          }
        }
      },
      { batch: true }
    );
  }

  setRequired(on: boolean) {
    const q = this.q()!;
    this.store.updateQuestion<ChoiceQuestion>(
      q.id,
      draft => {
        draft.required = on;
        if (draft.type === 'singleChoice') {
          draft.props.minSelect = 1;
          draft.props.maxSelect = 1;
        } else {
          if (on && draft.props.minSelect < 1) draft.props.minSelect = 1;
        }
      },
      { label: 'Toggle required' }
    );
  }

  startEdit(_field: 'title' | 'help') {
    this.store.beginBatch('Edit question text');
  }

  setTitle(v: string) {
    if (!this.q) return;
    this.store.updateQuestionTitle(this.q()!.id, v, { batch: true });
  }

  setHelp(v: string) {
    if (!this.q) return;
    this.store.updateQuestionHelpText(this.q()!.id, v, { batch: true });
  }

  onPickIcon(optId: string, icon: string) {
    this.store.setOptionIcon(this.q().id, optId, icon); // <-- tracked by history
  }

  onLabel(optId: string, v: string) {
    this.store.setOptionLabel(this.q().id, optId, v, { batch: true }); // batch while typing
  }

  remove(optId: string) {
    this.store.removeOption(this.q().id, optId);
  }

  removeById(optId: string, ev?: Event) {
    ev?.stopPropagation();
    this.store.removeOption(this.q().id, optId);
  }

  commitEdit() {
    this.store.endBatch();
  }

  toggleRequired(ev?: Event) {
    ev?.stopPropagation();
    const curr = this.q().required;
    this.store.setRequired(this.q().id, !curr); // uses your store helper; participates in undo/redo
  }

  onToggleKey(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggleRequired(e);
    }
  }
}
