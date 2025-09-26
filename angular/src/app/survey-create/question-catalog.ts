import { Question, QuestionType, Id } from '../types/surveyDoc.types';

export interface QuestionDef {
  type: QuestionType;
  title: string;   // palette title
  sub: string;     // palette subtitle
  icon: string;    // iconify name
  def: {
    // title/other fields if you use them
    props: any; // keep as you had it (or narrow per type if you prefer)
  };
}

const guid = (): Id => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

export const QUESTION_CATALOG: QuestionDef[] = [
  {
    type: 'singleChoice',
    title: 'Multiple Choice',
    sub: 'Single Answer',
    icon: 'lucide:check-square',
    def: {
      props: {
        shuffle: false,
        other: false,
        layout: 'list',
        // required by ChoiceQuestion now:
        minSelect: 1,
        maxSelect: 1
      }
    }
  },
  {
    type: 'multiChoice',
    title: 'Multiple Choice',
    sub: 'Multiple Answers',
    icon: 'lucide:check-square',
    def: {
      props: {
        shuffle: false,
        other: true,
        layout: 'list',
        // required by ChoiceQuestion now:
        minSelect: 0,
        maxSelect: null   // null => unlimited
      }
    }
  },
  {
    type: 'shortText',
    title: 'Short Text',
    sub: 'Single line',
    icon: 'lucide:text',
    def: {
      props: { placeholder: 'Type your answer…', multiline: false }
    }
  },
  {
    type: 'longText',
    title: 'Long Text',
    sub: 'Paragraph',
    icon: 'lucide:align-left',
    def: {
      props: { placeholder: 'Write your answer…', multiline: true, charLimit: 1000 }
    }
  },
  {
    type: 'rating',
    title: 'Rating',
    sub: '1–5',
    icon: 'lucide:star',
    def: {
      props: { scaleMin: 1, scaleMax: 5, icon: 'star' }
    }
  },
  {
    type: 'date',
    title: 'Date',
    sub: 'Calendar',
    icon: 'lucide:calendar',
    def: {
      props: { mode: 'date' }
    }
  }
];

// handy lookup by type
export const QUESTION_DEF_BY_TYPE: Record<QuestionType, QuestionDef> =
  QUESTION_CATALOG.reduce<Record<QuestionType, QuestionDef>>((acc, d) => {
    acc[d.type] = d;
    return acc;
  }, {} as Record<QuestionType, QuestionDef>);
