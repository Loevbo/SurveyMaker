import { Question, QuestionType, Id } from '../types/surveyDoc.types';

export interface QuestionDef {
  type: QuestionType;
  title: string;   // palette title
  sub: string;     // palette subtitle
  icon: string;    // iconify name
  build: () => Question; // factory with sensible defaults
}

const guid = (): Id => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

export const QUESTION_CATALOG: QuestionDef[] = [
  {
    type: 'singleChoice',
    title: 'Multiple Choice',
    sub: 'Single Answer',
    icon: 'lucide:check-square',
    build: () => ({
      id: guid(),
      type: 'singleChoice',
      title: 'Multiple choice question',
      required: false,
      options: [
        { id: guid(), label: 'Option 1' },
        { id: guid(), label: 'Option 2' },
        { id: guid(), label: 'Option 3' }
      ],
      rules: [],
      props: { shuffle: false, other: false, layout: 'list' }
    })
  },
  {
    type: 'multiChoice',
    title: 'Multiple Choice',
    sub: 'Multiple Answers',
    icon: 'lucide:square-check-big',
    build: () => ({
      id: guid(),
      type: 'multiChoice',
      title: 'Select all that apply',
      required: false,
      options: [
        { id: guid(), label: 'Option A' },
        { id: guid(), label: 'Option B' }
      ],
      rules: [],
      props: { shuffle: false, other: true, layout: 'list' }
    })
  },
  {
    type: 'shortText',
    title: 'Short Text',
    sub: 'Single line',
    icon: 'lucide:textarea-t',
    build: () => ({
      id: guid(),
      type: 'shortText',
      title: 'Short answer',
      required: false,
      rules: [],
      props: { placeholder: 'Type your answer…', multiline: false }
    })
  },
  {
    type: 'longText',
    title: 'Long Text',
    sub: 'Paragraph',
    icon: 'lucide:align-left',
    build: () => ({
      id: guid(),
      type: 'longText',
      title: 'Paragraph',
      required: false,
      rules: [],
      props: { placeholder: 'Write your answer…', multiline: true, charLimit: 1000 }
    })
  },
  {
    type: 'rating',
    title: 'Rating',
    sub: '1–5',
    icon: 'lucide:star',
    build: () => ({
      id: guid(),
      type: 'rating',
      title: 'Rate your experience',
      required: false,
      rules: [],
      props: { scaleMin: 1, scaleMax: 5, icon: 'star', labels: ['Bad', 'Great'] }
    })
  },
  {
    type: 'date',
    title: 'Date',
    sub: 'Calendar',
    icon: 'lucide:calendar',
    build: () => ({
      id: guid(),
      type: 'date',
      title: 'Pick a date',
      required: false,
      rules: [],
      props: { mode: 'date' }
    })
  }
];

// handy lookup by type
export const QUESTION_DEF_BY_TYPE: Record<QuestionType, QuestionDef> =
  QUESTION_CATALOG.reduce<Record<QuestionType, QuestionDef>>((acc, d) => {
    acc[d.type] = d;
    return acc;
  }, {} as Record<QuestionType, QuestionDef>);
