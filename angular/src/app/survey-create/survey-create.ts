import { Component, signal, CUSTOM_ELEMENTS_SCHEMA, inject, computed, ElementRef, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SurveyStore } from '../stores/survey-store';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragData } from '../types/drag.types';
import { QUESTION_CATALOG, QuestionDef } from './question-catalog';
import { Question } from '../types/surveyDoc.types';
import { QChoiceComponent } from './subComponents/qchoice-component/qchoice-component';
import { QChoicePropsComponent } from './subComponents/qchoice-props-component/qchoice-props-component';

@Component({
  selector: 'app-survey-create',
  imports: [FontAwesomeModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    QChoiceComponent,
    QChoicePropsComponent],
  templateUrl: './survey-create.html',
  styleUrl: './survey-create.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})





export class SurveyCreate {

  private http = inject(HttpClient);
  store = inject(SurveyStore);


  // Signals & derived state (super fast)
  
  catalog = QUESTION_CATALOG;
  doc = this.store.doc;                                 // SurveyDoc signal
  selectedId = this.store.selectedQuestionId;           // selected question signal
  canUndo = this.store.canUndo;
  canRedo = this.store.canRedo;
  isDirty = this.store.isDirty;

  page = computed(() => {
    const id = this.store.activePageId();
    return this.doc().pages.find(p => p.id === id)!;
  });

  // ---------- Toolbar actions ----------
  undo() { this.store.undo(); }
  redo() { this.store.redo(); }


  save() {
    const snapshot = this.store.snapshot();
    this.http.put<{version:number}>(`/api/surveys/${snapshot.id}`, snapshot)
      .subscribe(res => this.store.markSaved(res.version));
  }




  //#region Title changes

  editingTitle = false;
  private titleBeforeEdit = '';

  @ViewChild('titleBox') titleBox?: ElementRef<HTMLInputElement>;

  beginEditTitle() {
    if (this.editingTitle) return;
    this.titleBeforeEdit = this.doc().title;
    this.editingTitle = true;

    this.store.beginBatch('Edit survey title');

    // wait until the input is in the DOM
    requestAnimationFrame(() => {
      const el = this.titleBox?.nativeElement;
      if (el) { el.focus(); el.select(); }
    });
  }

  onTitleInput(v: string) {
    this.store.update('Edit survey title', d => { d.title = v; }, { batch: true });
  }

  commitTitle() {
    this.store.endBatch();
    this.editingTitle = false;
  }

  cancelTitle() {
    // drop the batched edits and restore the old value
    this.store.cancelBatch?.();
    this.store.update('Revert title', d => { d.title = this.titleBeforeEdit; });
    this.editingTitle = false;
  }

  //#endregion




  // click-to-add
  addFromPalette(def: QuestionDef) {
    const idx = this.page().questions.length;
    this.store.insertQuestionAt(this.page().id, idx, def.type);
    // (optional) set default options for choice types here if you want
  }

  // canvas drop handler
  onCanvasDrop(evt: CdkDragDrop<Question[]>) {
    const data = evt.item.data as DragData;

    // palette -> canvas (insert)
    if (data.source === 'palette') {
      this.store.insertQuestionAt(this.page().id, evt.currentIndex, data.type);
      return;
    }

    // canvas -> canvas (reorder on same page)
    if (data.source === 'canvas' && evt.previousContainer === evt.container) {
      this.store.reorderQuestion(this.page().id, evt.previousIndex, evt.currentIndex);
      return;
    }

    // (later) cross-page moves would be handled here
  }


  openProps(id: string) {
    this.store.selectQuestion(id);
  }





}
