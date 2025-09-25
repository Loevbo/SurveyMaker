import { Injectable, computed, signal } from '@angular/core';
import {
  enablePatches,
  produceWithPatches,
  applyPatches,
  Draft,
  Patch
} from 'immer';
import { SurveyDoc, Question, Id } from '../types/surveyDoc.types';
import { QUESTION_DEF_BY_TYPE } from '../survey-create/question-catalog';

enablePatches();

type PatchEntry = {
  patches: Patch[];
  inversePatches: Patch[];
  label?: string;
  at: number;
};

const nowIso = () => new Date().toISOString();
const guid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

@Injectable({ providedIn: 'root' })
export class SurveyStore {
  // ---- persisted doc ----
  private _doc = signal<SurveyDoc>({
    id: guid(),
    title: 'Untitled survey',
    pages: [{ id: guid(), title: 'Page 1', questions: [] }],
    status: 'draft',
    createdUtc: nowIso(),
    updatedUtc: nowIso(),
    version: 1
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
  private _touchHistory() { this._historyTick.update(n => n + 1); }

  // ---- derived ----
  doc = computed(() => this._doc());
  canUndo = computed(() => { this._historyTick(); return this.undoStack.length > 0; });
  canRedo = computed(() => { this._historyTick(); return this.redoStack.length > 0; });
  isDirty = signal(false);

  get state(): SurveyDoc { return this._doc(); }

  cancelBatch() { this.batch = undefined; }

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
  }

  beginBatch(label = 'edit') {
    if (!this.batch) this.batch = { patches: [], inversePatches: [], label, at: Date.now() };
  }

  endBatch() {
    if (this.batch && (this.batch.patches.length || this.batch.inversePatches.length)) {
      this.pushHistory(this.batch);
    }
    this.batch = undefined;
  }

  private pushHistory(entry: PatchEntry) {
    if (!entry.patches.length) return;
    this.undoStack.push(entry);
    // optional cap: if (this.undoStack.length > 200) this.undoStack.shift();
    this._touchHistory();
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return;
    const prev = applyPatches(this._doc(), entry.inversePatches);
    this._doc.set(prev);
    this.redoStack.push(entry);
    this._touchHistory();
  }

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return;
    const next = applyPatches(this._doc(), entry.patches);
    this._doc.set(next);
    this.undoStack.push(entry);
    this._touchHistory();
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

  updateQuestionTitle(qid: Id, title: string) {
    this.update('Edit title', d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === qid);
        if (q) { q.title = title; break; }
      }
    }, { batch: true });
  }

  toggleRequired(qid: Id) {
    this.update('Toggle required', d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === qid);
        if (q) { q.required = !q.required; break; }
      }
    });
  }

  addChoiceOption(qid: Id, label = 'Option') {
    this.update('Add option', d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === qid);
        if (q && 'options' in q) {
          (q.options as any).push({ id: guid(), label });
        }
      }
    });
  }

  deleteQuestion(qid: Id) {
    this.update('Delete question', d => {
      for (const p of d.pages) {
        const i = p.questions.findIndex(x => x.id === qid);
        if (i >= 0) { p.questions.splice(i, 1); break; }
      }
      if (this.selectedQuestionId() === qid) this.selectedQuestionId.set(null);
    });
  }

  reorderQuestion(pageId: Id, from: number, to: number) {
    this.update('Reorder question', d => {
      const arr = d.pages.find(p => p.id === pageId)!.questions;
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
    }, { batch: true });
  }

  snapshot(): SurveyDoc {
    return structuredClone(this._doc());
  }

  markSaved(serverVersion: number) {
    this.isDirty.set(false);
    this._doc.update(v => { v.version = serverVersion; return v; });
  }

  // ---- creation factory (uses catalog) ----
  private _createQuestion(type: Question['type']): Question {
    const def = QUESTION_DEF_BY_TYPE[type];
    if (!def) throw new Error(`Unknown question type: ${type as string}`);
    return def.build(); // fresh ids & defaults
  }






  selectedQuestion = computed<Question | undefined>(() => {
    const id = this.selectedQuestionId();
    if (!id) return undefined;
    const d = this._doc();
    for (const p of d.pages) {
      const q = p.questions.find(x => x.id === id);
      if (q) return q;
    }
    return undefined;
  });

   selectQuestion(id: Id | null) { this.selectedQuestionId.set(id); }

   updateQuestion<T extends Question>(
    id: Id,
    label: string,
    apply: (q: Draft<T>) => void,
    opts?: { batch?: boolean }
  ) {
    this.update(label, d => {
      for (const p of d.pages) {
        const q = p.questions.find(x => x.id === id) as Draft<T> | undefined;
        if (q) { apply(q); break; }
      }
    }, opts);
  }
}
