export type QuestionType =
  | 'singleChoice'
  | 'multiChoice'
  | 'shortText'
  | 'longText'
  | 'rating'
  | 'date';

export type Id = string;

export interface Option {
  id: Id;
  label: string;
}

interface BaseQuestion {
  id: Id;
  type: QuestionType;
  title: string;
  required: boolean;
  rules: any[];
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'singleChoice' | 'multiChoice';
  options: Option[];
  props: {
    shuffle: boolean;
    other: boolean;
    layout: 'list' | 'grid';
  };
}

export interface TextQuestion extends BaseQuestion {
  type: 'shortText' | 'longText';
  props: {
    placeholder?: string;
    charLimit?: number;
    multiline: boolean;     // true for longText
  };
}

export interface RatingQuestion extends BaseQuestion {
  type: 'rating';
  props: {
    scaleMin: number; // 1
    scaleMax: number; // 5
    icon: 'star' | 'heart' | 'thumbs-up';
    labels?: string[];
  };
}

export interface DateQuestion extends BaseQuestion {
  type: 'date';
  props: {
    mode: 'date' | 'time' | 'datetime';
    min?: string; // ISO
    max?: string; // ISO
  };
}

export type Question =
  | ChoiceQuestion
  | TextQuestion
  | RatingQuestion
  | DateQuestion;

export interface SurveyDoc {
  id: Id;
  title: string;
  pages: { id: Id; title: string; questions: Question[] }[];
  status: 'draft' | 'published' | 'archived';
  createdUtc: string;
  updatedUtc: string;
  version: number;
}
