import { Question, QuestionType, Id } from '../types/surveyDoc.types';

export interface QuestionDef {
  type: QuestionType;
  title: string;   // palette title
  sub: string;     // palette subtitle
  icon: string;    // iconify name
}

const guid = (): Id => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

export const QUESTION_CATALOG: QuestionDef[] = [
  { type: 'singleChoice', title: 'Multiple Choice', sub: 'Single Answer', icon: 'lucide:circle-check' },
  { type: 'multiChoice', title: 'Multiple Choice', sub: 'Multiple Answers', icon: 'lucide:square-check' },
  { type: 'dropdown', title: 'Dropdown', sub: 'Single select', icon: 'lucide:chevron-down' },
  { type: 'multiSelect', title: 'Multi-select', sub: 'Multi select', icon: 'lucide:chevron-down' },

  { type: 'shortText', title: 'Short Text', sub: 'Single line', icon: 'lucide:align-left' },
  { type: 'longText', title: 'Long Text', sub: 'Paragraph', icon: 'lucide:align-left' },

  { type: 'yesNo', title: 'Yes / No', sub: 'Toggle', icon: 'lucide:toggle-right' },
  { type: 'number', title: 'Number', sub: 'Min/Max/Step', icon: 'lucide:hash' },
  { type: 'slider', title: 'Slider', sub: 'Range', icon: 'lucide:sliders' },

  { type: 'email', title: 'Email', sub: 'Validated', icon: 'lucide:mail' },
  { type: 'phone', title: 'Phone', sub: 'Validated', icon: 'lucide:phone' },
  { type: 'url', title: 'URL', sub: 'Validated', icon: 'lucide:link' },

  { type: 'date', title: 'Date', sub: 'Calendar', icon: 'lucide:calendar' },
  { type: 'time', title: 'Time', sub: 'Clock', icon: 'lucide:clock' },
  { type: 'dateTime', title: 'Date & Time', sub: 'Combined', icon: 'lucide:calendar-clock' },
  { type: 'country', title: 'Country', sub: 'Dropdown', icon: 'lucide:globe' },

  { type: 'fileUpload', title: 'File upload', sub: 'Images/Docs', icon: 'lucide:upload' },
  { type: 'imageChoice', title: 'Image choice', sub: 'Grid/List', icon: 'lucide:image' },
  { type: 'signature', title: 'Signature', sub: 'Draw', icon: 'lucide:pen-line' },

  { type: 'rating', title: 'Rating', sub: 'Stars 1–5', icon: 'lucide:star' },
  { type: 'nps', title: 'NPS', sub: '0–10', icon: 'lucide:gauge' },
  { type: 'opinionScale', title: 'Opinion scale', sub: 'Custom range', icon: 'lucide:scale' },

  { type: 'ranking', title: 'Ranking', sub: 'Drag to order', icon: 'lucide:list-ordered' },
  { type: 'matrixSingle', title: 'Matrix', sub: 'Single per row', icon: 'lucide:grid-2x2' },
  { type: 'matrixMulti', title: 'Matrix (multi)', sub: 'Multi per row', icon: 'lucide:grid-3x3' },

  { type: 'section', title: 'Section', sub: 'Text block', icon: 'lucide:align-left' },
  { type: 'consent', title: 'Consent', sub: 'Agreement', icon: 'lucide:shield-check' },
  { type: 'address', title: 'Address', sub: 'Grouped fields', icon: 'lucide:map-pin' },
];

// handy lookup by type
export const QUESTION_DEF_BY_TYPE: Record<QuestionType, QuestionDef> =
  QUESTION_CATALOG.reduce<Record<QuestionType, QuestionDef>>((acc, d) => {
    acc[d.type] = d;
    return acc;
  }, {} as Record<QuestionType, QuestionDef>);
