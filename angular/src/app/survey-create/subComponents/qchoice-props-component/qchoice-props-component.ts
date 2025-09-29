import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { IconPickerComponent } from 'src/app/shared/icon-picker/icon-picker-component/icon-picker-component';
import { SurveyStore } from 'src/app/stores/survey-store';
import { ChoiceQuestion } from 'src/app/types/surveyDoc.types';

@Component({
  selector: 'app-qchoice-props',
  standalone: true,
  imports: [CommonModule, IconPickerComponent],
  templateUrl: './qchoice-props-component.html',
  styleUrl: './qchoice-props-component.scss',
})
export class QChoicePropsComponent {
  private store = inject(SurveyStore);

  q = computed<ChoiceQuestion | undefined>(() => {
    const anyQ = this.store.selectedQuestion();
    return anyQ && (anyQ.type === 'singleChoice' || anyQ.type === 'multiChoice')
      ? (anyQ as ChoiceQuestion)
      : undefined;
  });

  isSingle = () => this.q()?.type === 'singleChoice';

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

  setMin(v: string) {
    const q = this.q()!;
    const num = Math.max(0, Math.floor(Number(v) || 0));
    this.store.updateQuestion<ChoiceQuestion>(
      q.id,
      draft => {
        const maxAllowed = draft.props.maxSelect ?? draft.options.length;
        draft.props.minSelect = Math.min(num, maxAllowed);
        if (draft.required && draft.props.minSelect === 0) draft.props.minSelect = 1;
      },
      { label: 'Set min selections', batch: true }
    );
  }

  setMax(v: string) {
    const q = this.q()!;
    const raw = v.trim();
    this.store.updateQuestion<ChoiceQuestion>(
      q.id,
      draft => {
        if (raw === '') {
          draft.props.maxSelect = null; // unlimited
        } else {
          let n = Math.max(1, Math.floor(Number(raw) || 1));
          const maxReal = draft.options.length;
          n = Math.min(n, maxReal);
          if (n < draft.props.minSelect) draft.props.minSelect = n;
          draft.props.maxSelect = n;
        }
      },
      { label: 'Set max selections', batch: true }
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

  onMinChange(n: number) {
    this.store.setMinSelect(this.q().id, Number.isFinite(n) ? n : 0);
  }

  onMaxChange(n: number) {
    this.store.setMaxSelect(this.q().id, Number.isFinite(n) ? n : 0);
  }
}
