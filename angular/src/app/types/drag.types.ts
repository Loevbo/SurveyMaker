import { Id, QuestionType } from '../types/surveyDoc.types';

export type DragData =
  | { source: 'palette'; type: QuestionType }
  | { source: 'canvas'; pageId: Id; questionId: Id; index: number };
