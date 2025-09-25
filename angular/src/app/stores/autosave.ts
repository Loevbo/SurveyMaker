// src/app/survey-builder/autosave.ts
import { Injectable, effect, inject } from '@angular/core';
import { SurveyStore } from './survey-store';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class AutosaveService {
  private store = inject(SurveyStore);
  private http = inject(HttpClient);

  constructor() {
    const doc$ = toObservable(this.store.doc);
    const dirty$ = toObservable(this.store.isDirty);

    // save when doc changes AND dirty is true (debounced)
    doc$.pipe(
      debounceTime(800),
      switchMap(doc => this.store.isDirty() ? this.http.put<{version:number}>(`/api/surveys/${doc.id}`, doc) : of(null))
    ).subscribe(res => {
      if (res) this.store.markSaved(res.version);
    });
  }
}
