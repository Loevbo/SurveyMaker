import { Injectable, computed, effect, signal } from '@angular/core';
import { enablePatches, produceWithPatches, applyPatches, Draft, Patch } from 'immer';
import { SurveyDoc, Question, Id, ChoiceQuestion, QuestionType } from '../types/surveyDoc.types';
import { QUESTION_DEF_BY_TYPE } from '../survey-create/question-catalog';

enablePatches();

type PatchEntry = {
  patches: Patch[];
  inversePatches: Patch[];
  label?: string;
  at: number;
};

type PersistedStoreV1 = {
  schema: 1;
  doc: SurveyDoc;
  undo: PatchEntry[];
  redo: PatchEntry[];
  selectedQuestionId: Id | null;
  activePageId: Id;
  isDirty: boolean;
  savedAt: number;
};

const nowIso = () => new Date().toISOString();
const guid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

@Injectable({ providedIn: 'root' })
export class SurveyStore {
  private readonly PERSIST_KEY = 'sm:builder:v1';
  // ---- persisted doc ----
  private _doc = signal<SurveyDoc>({
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    title: 'Untitled survey',
    pages: [
      {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        title: 'Page 1',
        questions: [],
      },
    ],
    status: 'draft',
    createdUtc: new Date().toISOString(),
    updatedUtc: new Date().toISOString(),
    version: 1,
  });

  // ---- ephemeral UI ----
  selectedQuestionId = signal<Id | null>(null);
  hoveredQuestionId = signal<Id | null>(null);
  activePageId = signal<Id>(this._doc().pages[0].id);

  // ---- history ----
  private undoStack: PatchEntry[] = [];
  private redoStack: PatchEntry[] = [];
  private batch?: PatchEntry;

  // tick signal to notify computed() when stacks change
  private _historyTick = signal(0);
  private _touchHistory() {
    this._historyTick.update(n => n + 1);
  }

  // ---- derived ----
  doc = computed(() => this._doc());
  canUndo = computed(() => {
    this._historyTick();
    return this.undoStack.length > 0;
  });
  canRedo = computed(() => {
    this._historyTick();
    return this.redoStack.length > 0;
  });
  isDirty = signal(false);

  get state(): SurveyDoc {
    return this._doc();
  }

  cancelBatch() {
    this.batch = undefined;
  }

  // ---------- PERSISTENCE (sessionStorage) ----------
  private _persistTimer?: number;

  /** Try to load a previous session draft when the service is created. */
  constructor() {
    this.restoreFromSession();

    // Persist whenever something important changes (throttled)
    effect(() => {
      // touching these signals makes effect react to any change
      this._doc();
      this._historyTick();
      this.selectedQuestionId();
      this.activePageId();
      this.isDirty();

      this.schedulePersist();
    });

    // as a last safety net, flush on unload
    window.addEventListener('beforeunload', () => this.persistNow());
  }

  private schedulePersist(delay = 250) {
    clearTimeout(this._persistTimer);
    this._persistTimer = window.setTimeout(() => this.persistNow(), delay);
  }

  private persistNow() {
    try {
      const payload: PersistedStoreV1 = {
        schema: 1,
        doc: this._doc(),
        undo: this.undoStack,
        redo: this.redoStack,
        selectedQuestionId: this.selectedQuestionId(),
        activePageId: this.activePageId(),
        isDirty: this.isDirty(),
        savedAt: Date.now(),
      };
      sessionStorage.setItem(this.PERSIST_KEY, JSON.stringify(payload));
    } catch {
      /* storage may be unavailable; ignore */
    }
  }

  /** Restore a draft from sessionStorage (same tab refresh). */
  restoreFromSession() {
    try {
      const raw = sessionStorage.getItem(this.PERSIST_KEY);
      if (!raw) return;
      const s: PersistedStoreV1 = JSON.parse(raw);
      if (!s || s.schema !== 1 || !s.doc) return;

      this._doc.set(s.doc);
      this.undoStack = Array.isArray(s.undo) ? s.undo : [];
      this.redoStack = Array.isArray(s.redo) ? s.redo : [];
      this.selectedQuestionId.set(s.selectedQuestionId ?? null);
      this.activePageId.set(s.activePageId ?? s.doc.pages[0]?.id ?? this.activePageId());
      this.isDirty.set(!!s.isDirty);
      this._touchHistory(); // notify dependents after restore
    } catch {
      /* ignore corrupted data */
    }
  }

  /** Remove the session draft (use after publish or when user discards draft). */
  clearSessionDraft() {
    sessionStorage.removeItem(this.PERSIST_KEY);
  }

  // Core mutator
  update(label: string, mutator: (draft: Draft<SurveyDoc>) => void, opts?: { batch?: boolean }) {
    const [next, patches, inverse] = produceWithPatches(this._doc(), mutator);
    this._doc.set({ ...next, updatedUtc: nowIso() });
    this.isDirty.set(true);

    if (opts?.batch) {
      if (!this.batch) this.batch = { patches: [], inversePatches: [], label, at: Date.now() };
      this.batch.patches.push(...patches);
      this.batch.inversePatches.unshift(...inverse); // reverse order for inverse
    } else {
      this.pushHistory({ patches, inversePatches: inverse, label, at: Date.now() });
    }

    this.redoStack = [];
    this._touchHistory();
    this.schedulePersist();
  }

  beginBatch(label = 'edit') {
    if (!this.batch) this.batch = { patches: [], inversePatches: [], label, at: Date.now() };
  }

  endBatch() {
    if (this.batch && (this.batch.patches.length || this.batch.inversePatches.length)) {
      this.pushHistory(this.batch);
    }
    this.batch = undefined;
    this.schedulePersist();
  }

  private pushHistory(entry: PatchEntry) {
    if (!entry.patches.length) return;
    this.undoStack.push(entry);
    // optional cap: if (this.undoStack.length > 200) this.undoStack.shift();
    this._touchHistory();
    this.schedulePersist();
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return;
    const prev = applyPatches(this._doc(), entry.inversePatches);
    this._doc.set(prev);
    this.redoStack.push(entry);
    this._touchHistory();
    this.schedulePersist();
  }

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return;
    const next = applyPatches(this._doc(), entry.patches);
    this._doc.set(next);
    this.undoStack.push(entry);
    this._touchHistory();
    this.schedulePersist();
  }

  // ---- commands ----
  addQuestion(type: Question['type']) {
    const pageId = this.activePageId();
    const idx = this._doc().pages.find(p => p.id === pageId)!.questions.length;
    this.insertQuestionAt(pageId, idx, type);
  }

  insertQuestionAt(pageId: Id, index: number, type: Question['type']) {
    this.update('Insert question', d => {
      const page = d.pages.find(p => p.id === pageId)!;
      const q = this._createQuestion(type);
      page.questions.splice(index, 0, q);
      this.selectedQuestionId.set(q.id);
    });
  }

  updateQuestionTitle(qid: Id, title: string, opts?: { batch?: boolean }) {
    this.update(
      'Edit question title',
      d => {
        for (const p of d.pages) {
          const q = p.questions.find(x => x.id === qid);
          if (q) {
            q.title = title;
            break;
          }
        }
      },
      { batch: !!opts?.batch }
    );
  }

  updateQuestionHelpText(qid: Id, helpText: string, opts?: { batch?: boolean }) {
    this.update(
      'Edit help text',
      d => {
        for (const p of d.pages) {
          const q = p.questions.find(x => x.id === qid);
          if (q) {
            q.helpText = helpText;
            break;
          }
        }
      },
      { batch: !!opts?.batch }
    );
  }

  toggleRequired(qid: Id) {
    this.update('Toggle required', d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === qid);
        if (q) {
          q.required = !q.required;
          break;
        }
      }
    });
  }

  deleteQuestion(qid: Id) {
    this.update('Delete question', d => {
      for (const p of d.pages) {
        const i = p.questions.findIndex(x => x.id === qid);
        if (i >= 0) {
          p.questions.splice(i, 1);
          break;
        }
      }
      if (this.selectedQuestionId() === qid) this.selectedQuestionId.set(null);
    });
  }

  reorderQuestion(pageId: Id, from: number, to: number) {
    this.update(
      'Reorder question',
      d => {
        const arr = d.pages.find(p => p.id === pageId)!.questions;
        const [m] = arr.splice(from, 1);
        arr.splice(to, 0, m);
      },
      { batch: true }
    );
  }

  snapshot(): SurveyDoc {
    return structuredClone(this._doc());
  }

  markSaved(serverVersion: number) {
    this.isDirty.set(false);
    this._doc.update(v => {
      v.version = serverVersion;
      return v;
    });
  }

  private static readonly GENERIC_HELP = 'Please provide your answer.';

  private static readonly DEFAULT_HELP = {
    singleChoice: 'Ask one clear question and offer a few options.',
    multiChoice: 'Choose one or more options.',
    shortText: 'Keep it short and sweet.',
    longText: 'Provide a longer, descriptive answer.',
    rating: 'Rate on the given scale.',
    date: 'Pick a date.',
    time: 'Pick a time.',
    dateTime: 'Pick a date and time.',
  } satisfies Partial<Record<QuestionType, string>>;

  private helpFor(type: QuestionType): string {
    return SurveyStore.DEFAULT_HELP[type] ?? SurveyStore.GENERIC_HELP;
  }

  // ---- creation factory (uses catalog) ----
  private _createQuestion(type: QuestionType): Question {
    const base = {
      id: guid(),
      type,
      title: 'New question',
      helpText: this.helpFor(type),
      required: false,
      rules: [] as any[],
    };

    switch (type) {
      case 'singleChoice':
        return {
          ...base,
          type,
          options: [
            { id: guid(), label: 'Option', icon: 'lucide:shapes' },
            { id: guid(), label: 'Option', icon: 'lucide:star' },
          ],
          props: { layout: 'list', shuffle: false, other: false, minSelect: 1 },
        };

      case 'multiChoice':
        return {
          ...base,
          type,
          options: [
            { id: guid(), label: 'Option', icon: 'lucide:check-circle' },
            { id: guid(), label: 'Option', icon: 'lucide:check-circle' },
          ],
          props: {
            layout: 'list',
            shuffle: false,
            other: false,
            minSelect: 0,
            maxSelect: undefined,
          },
        };

      case 'dropdown':
        return {
          ...base,
          type,
          options: [
            { id: guid(), label: 'Option' },
            { id: guid(), label: 'Option' },
          ],
          props: { placeholder: 'Choose…', searchable: true, clearable: true },
        };

      case 'multiSelect':
        return {
          ...base,
          type,
          options: [
            { id: guid(), label: 'Option' },
            { id: guid(), label: 'Option' },
          ],
          props: {
            placeholder: 'Choose…',
            searchable: true,
            clearable: true,
            maxSelect: undefined,
          },
        };

      case 'yesNo':
        return { ...base, type, props: { onLabel: 'Yes', offLabel: 'No', default: false } };

      case 'number':
        return {
          ...base,
          type,
          props: { min: undefined, max: undefined, step: 1, unit: '', thousandSeparator: false },
        };

      case 'slider':
        return {
          ...base,
          type,
          props: { min: 0, max: 100, step: 1, showTicks: false, showValue: true },
        };

      case 'shortText':
        return {
          ...base,
          type,
          props: { placeholder: 'Your answer…', multiline: false, charLimit: 100 },
        };

      case 'longText':
        return {
          ...base,
          type,
          props: { placeholder: 'Write your answer…', multiline: true, charLimit: 1000 },
        };

      case 'email':
        return {
          ...base,
          type,
          props: { placeholder: 'name@example.com', multiline: false, pattern: '.+@.+' },
        };

      case 'phone':
        return {
          ...base,
          type,
          props: { placeholder: '+1 555 000 0000', multiline: false, pattern: '^[+0-9 ()-]{6,}$' },
        };

      case 'url':
        return {
          ...base,
          type,
          props: { placeholder: 'https://example.com', multiline: false, pattern: '^https?://' },
        };

      case 'date':
        return {
          ...base,
          type,
          props: { mode: 'date', min: undefined, max: undefined, format: 'yyyy-MM-dd' },
        };

      case 'time':
        return {
          ...base,
          type,
          props: { mode: 'time', min: undefined, max: undefined, format: 'HH:mm' },
        };

      case 'dateTime':
        return {
          ...base,
          type,
          props: { mode: 'datetime', min: undefined, max: undefined, format: 'yyyy-MM-dd HH:mm' },
        };

      case 'country':
        return {
          ...base,
          type,
          options: [], // generate when rendering/prop editing
          props: {
            placeholder: 'Select a country',
            searchable: true,
            clearable: true,
            showFlags: true,
          },
        };

      case 'fileUpload':
        return {
          ...base,
          type,
          props: { accept: '', maxFiles: 1, maxSizeMB: 10, storagePath: '/uploads' },
        };

      case 'imageChoice':
        return {
          ...base,
          type,
          options: [
            { id: guid(), label: 'Option', imageUrl: '' },
            { id: guid(), label: 'Option', imageUrl: '' },
          ],
          props: { layout: 'grid', multi: false },
        };

      case 'signature':
        return { ...base, type, props: { strokeWidth: 2, bg: '#fff', exportType: 'png' } };

      case 'rating':
        return { ...base, type, props: { scaleMin: 1, scaleMax: 5, icon: 'star', labels: [] } };

      case 'nps':
        return {
          ...base,
          type,
          props: {
            min: 0,
            max: 10,
            leftLabel: 'Not at all likely',
            rightLabel: 'Extremely likely',
          },
        };

      case 'opinionScale':
        return {
          ...base,
          type,
          props: { min: 1, max: 7, step: 1, leftLabel: 'Disagree', rightLabel: 'Agree' },
        };

      case 'ranking':
        return {
          ...base,
          type,
          options: [
            { id: guid(), label: 'Option' },
            { id: guid(), label: 'Option' },
            { id: guid(), label: 'Option' },
          ],
          props: { limitTopN: undefined },
        };

      case 'matrixSingle':
        return {
          ...base,
          type,
          props: {
            rows: ['Row 1', 'Row 2'],
            columns: ['Poor', 'OK', 'Good'],
            requiredPerRow: false,
          },
        };

      case 'matrixMulti':
        return {
          ...base,
          type,
          props: {
            rows: ['Row 1', 'Row 2'],
            columns: ['A', 'B', 'C'],
            minPerRow: 0,
            maxPerRow: undefined,
          },
        };

      case 'section':
        return {
          ...base,
          type,
          title: 'Section title',
          helpText: undefined,
          required: false,
          props: { richText: 'Section content…', showDivider: true },
        };

      case 'consent':
        return {
          ...base,
          type,
          props: { text: 'I agree to the terms', linkToTerms: '' },
          required: true,
        };

      case 'address':
        return {
          ...base,
          type,
          props: {
            showStreet: true,
            showCity: true,
            showState: true,
            showZip: true,
            showCountry: true,
            autoComplete: true,
          },
        };

      default:
        // fallback to a simple shortText
        return {
          ...base,
          type: 'shortText',
          props: { placeholder: 'Your answer…', multiline: false },
        } as any;
    }
  }

  selectedQuestion = computed(() => {
    const id = this.selectedQuestionId();
    if (!id) return undefined;
    const d = this._doc();
    for (const p of d.pages) {
      const q = p.questions.find(x => x.id === id);
      if (q) return q;
    }
    return undefined;
  });

  selectQuestion(id: Id | null) {
    this.selectedQuestionId.set(id);
  }

  updateQuestion<T extends Question>(
    id: Id,
    apply: (q: Draft<T>) => void,
    opts?: { batch?: boolean; label?: string }
  ) {
    this.update(
      opts?.label ?? 'Update question',
      d => {
        for (const p of d.pages) {
          const idx = p.questions.findIndex(x => x.id === id);
          if (idx >= 0) {
            apply(p.questions[idx] as any);
            break;
          }
        }
      },
      { batch: opts?.batch }
    );
  }

  removeChoiceOption(qid: Id, idx: number) {
    this.update('Remove option', d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === qid);
        if (q && (q as any).options) {
          (q as any).options.splice(idx, 1);
          // clamp maxSelect to options length if needed
          const cq = q as any as ChoiceQuestion;
          if (cq.props.maxSelect != null && cq.props.maxSelect > cq.options.length) {
            cq.props.maxSelect = cq.options.length;
          }
        }
      }
    });
  }

  setOptionIcon(qid: Id, optId: Id, icon: string, opts?: { batch?: boolean }) {
    this.update(
      'Set option icon',
      d => {
        for (const p of d.pages) {
          const q = p.questions.find(x => x.id === qid) as ChoiceQuestion | undefined;
          if (!q) continue;
          const o = q.options.find(o => o.id === optId);
          if (o) o.icon = icon;
          break;
        }
      },
      opts
    );
  }

  // (optional) if you don’t already have label/CRUD helpers, these are useful:
  setOptionLabel(qid: Id, optId: Id, label: string, opts?: { batch?: boolean }) {
    this.update(
      'Set option label',
      d => {
        for (const p of d.pages) {
          const q = p.questions.find(x => x.id === qid) as ChoiceQuestion | undefined;
          if (!q) continue;
          const o = q.options.find(o => o.id === optId);
          if (o) o.label = label;
          break;
        }
      },
      opts
    );
  }

  removeOption(qid: Id, optId: Id) {
    this.update('Remove option', d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === qid) as ChoiceQuestion | undefined;
        if (!q) continue;
        const i = q.options.findIndex(o => o.id === optId);
        if (i >= 0) q.options.splice(i, 1);
        break;
      }
    });
  }

  addChoiceOption(qid: Id, label = 'Option', icon?: string) {
    this.update('Add option', d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === qid) as ChoiceQuestion | undefined;
        if (!q) continue;

        const newLabel = label ?? `Option ${q.options.length + 1}`;
        const newIcon = icon ?? 'lucide:shapes'; // full icon name

        q.options.push({
          id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
          label: newLabel,
          icon: newIcon,
        });
        break;
      }
    });
  }

  setRequired(qid: Id, required: boolean) {
    this.update('Set required', d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === qid);
        if (!q) continue;

        q.required = required;

        const props: any = q.props ?? (q.props = {});
        // be robust to undefined/strings
        const curMin =
          typeof props.minSelect === 'number'
            ? props.minSelect
            : Number.isFinite(+props.minSelect)
            ? +props.minSelect
            : 0;

        if (required) {
          // Only raise to 1 if it's below 1; never lower an existing higher value
          props.minSelect = Math.max(curMin, 1);
        }
        // else: don't touch minSelect when turning required off
        break;
      }
    });
  }

  setMinSelect(qid: Id, min: number) {
    this.update('Set min selections', d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === qid);
        if (!q) continue;

        const props: any = q.props ?? (q.props = {});
        const requiredMin = q.required ? 1 : 0;

        let nextMin = Math.floor(Number.isFinite(min) ? min : 0);
        nextMin = Math.max(requiredMin, nextMin);

        const curMax = Number.isFinite(props.maxSelect)
          ? props.maxSelect
          : Number.isFinite(+props.maxSelect)
          ? +props.maxSelect
          : 0;

        if (curMax > 0 && nextMin > curMax) {
          // policy: bump max to keep invariant
          props.maxSelect = nextMin;
        }

        props.minSelect = nextMin;
        break;
      }
    });
  }

  setMaxSelect(qid: Id, max: number) {
    this.update('Set max selections', d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === qid);
        if (!q) continue;

        const props: any = q.props ?? (q.props = {});
        const curMin = Number.isFinite(props.minSelect)
          ? props.minSelect
          : Number.isFinite(+props.minSelect)
          ? +props.minSelect
          : 0;

        let nextMax = Math.floor(Number.isFinite(max) ? max : 0);
        nextMax = Math.max(0, nextMax); // 0 => “no limit”

        if (nextMax > 0 && nextMax < curMin) {
          nextMax = curMin; // keep invariant: max >= min (if max != 0)
        }

        props.maxSelect = nextMax;
        break;
      }
    });
  }
}
