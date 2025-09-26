import { Injectable, computed, effect, signal } from '@angular/core';
import { enablePatches, produceWithPatches, applyPatches, Draft, Patch } from 'immer';
import { SurveyDoc, Question, Id, ChoiceQuestion } from '../types/surveyDoc.types';
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

  DEFAULT_HELP: Record<Question['type'], string> = {
    singleChoice: 'Ask one clear question and offer a few options.',
    multiChoice: 'Choose one or more options.',
    shortText: 'Keep it short and sweet.',
    longText: 'Provide a longer, descriptive answer.',
    rating: 'Rate on the given scale.',
    date: 'Pick a date/time.',
  };

  // ---- creation factory (uses catalog) ----
  private _createQuestion(type: Question['type']): Question {
    const def = QUESTION_DEF_BY_TYPE[type];

    const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    if (type === 'singleChoice' || type === 'multiChoice') {
      const single = type === 'singleChoice';
      return {
        id,
        type,
        title: 'New question',
        helpText: this.DEFAULT_HELP[type] ?? '',
        required: false,
        rules: [],
        options: [],
        props: {
          shuffle: false,
          other: false,
          layout: 'list',
          minSelect: single ? 1 : 0,
          maxSelect: single ? 1 : null,
        },
      };
    }

    if (!def) throw new Error(`Unknown question type: ${type as string}`);
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
      const newIcon  = icon  ?? 'lucide:shapes';   // full icon name

      q.options.push({
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        label: newLabel,
        icon: newIcon,
      });
      break;
    }
  });
}
}
