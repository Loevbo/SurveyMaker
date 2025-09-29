// src/app/types/surveyDoc.types.ts
export type Id = string;

export type QuestionType =
  | 'singleChoice'
  | 'multiChoice'
  | 'shortText'
  | 'longText'
  | 'rating'
  | 'date'
  | 'time'
  | 'dateTime'
  | 'dropdown'
  | 'multiSelect'
  | 'yesNo'
  | 'number'
  | 'slider'
  | 'email'
  | 'phone'
  | 'url'
  | 'country'
  | 'fileUpload'
  | 'imageChoice'
  | 'signature'
  | 'nps'
  | 'opinionScale'
  | 'ranking'
  | 'matrixSingle'
  | 'matrixMulti'
  | 'section'
  | 'consent'
  | 'address';

export interface Option {
  id: Id;
  label: string;
  icon?: string;
  imageUrl?: string;
}

interface BaseQuestion {
  id: Id;
  type: QuestionType;
  title: string;
  helpText?: string;
  required: boolean;
  rules: any[];
}

// Choice-family
export interface ChoiceQuestion extends BaseQuestion {
  type: 'singleChoice' | 'multiChoice';
  options: Option[];
  props: {
    layout: 'list' | 'grid';
    shuffle: boolean;
    other: boolean;
    minSelect: number;       // 1 for single, 0..n for multi
    maxSelect?: number;
  };
}

// Text-family
export interface TextQuestion extends BaseQuestion {
  type: 'shortText' | 'longText' | 'email' | 'phone' | 'url';
  props: {
    placeholder?: string;
    multiline: boolean;      // true for longText
    charLimit?: number;
    pattern?: string;
  };
}

// Rating
export interface RatingQuestion extends BaseQuestion {
  type: 'rating';
  props: {
    scaleMin: number;        // 1
    scaleMax: number;        // 5
    icon: 'star' | 'heart' | 'thumbs-up';
    labels?: string[];
  };
}

// Date / Time
export interface DateQuestion extends BaseQuestion {
  type: 'date' | 'time' | 'dateTime';
  props: {
    mode: 'date' | 'time' | 'datetime';
    min?: string;            // ISO
    max?: string;            // ISO
    format?: string;
    timezone?: string;
  };
}

// Dropdown single + multi-select chips
export interface DropdownQuestion extends BaseQuestion {
  type: 'dropdown' | 'multiSelect' | 'country';
  options: Option[];
  props: {
    placeholder?: string;
    searchable: boolean;
    clearable: boolean;
    maxSelect?: number;      // used by multiSelect
    showFlags?: boolean;     // country
  };
}

// Boolean switch
export interface YesNoQuestion extends BaseQuestion {
  type: 'yesNo';
  props: {
    onLabel: string;
    offLabel: string;
    default?: boolean;
  };
}

// Number
export interface NumberQuestion extends BaseQuestion {
  type: 'number';
  props: {
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    thousandSeparator?: boolean;
  };
}

// Slider
export interface SliderQuestion extends BaseQuestion {
  type: 'slider';
  props: {
    min: number;
    max: number;
    step: number;
    showTicks: boolean;
    showValue: boolean;
  };
}

// File upload
export interface FileUploadQuestion extends BaseQuestion {
  type: 'fileUpload';
  props: {
    accept?: string;         // e.g., "image/*,.pdf"
    maxFiles: number;
    maxSizeMB: number;
    storagePath?: string;
  };
}

// Image choice
export interface ImageChoiceQuestion extends BaseQuestion {
  type: 'imageChoice';
  options: Option[];         // use imageUrl on options
  props: {
    layout: 'grid' | 'list';
    multi: boolean;
  };
}

// Signature
export interface SignatureQuestion extends BaseQuestion {
  type: 'signature';
  props: {
    strokeWidth: number;
    bg?: string;
    exportType: 'png' | 'svg';
  };
}

// NPS
export interface NpsQuestion extends BaseQuestion {
  type: 'nps';
  props: {
    min: number;             // 0
    max: number;             // 10
    leftLabel: string;
    rightLabel: string;
  };
}

// Opinion scale
export interface OpinionScaleQuestion extends BaseQuestion {
  type: 'opinionScale';
  props: {
    min: number;
    max: number;
    step: number;
    leftLabel?: string;
    rightLabel?: string;
  };
}

// Ranking
export interface RankingQuestion extends BaseQuestion {
  type: 'ranking';
  options: Option[];
  props: {
    limitTopN?: number;
  };
}

// Matrices
export interface MatrixSingleQuestion extends BaseQuestion {
  type: 'matrixSingle';
  props: {
    rows: string[];
    columns: string[];
    requiredPerRow: boolean;
  };
}

export interface MatrixMultiQuestion extends BaseQuestion {
  type: 'matrixMulti';
  props: {
    rows: string[];
    columns: string[];
    minPerRow?: number;
    maxPerRow?: number;
  };
}

// Section (display only)
export interface SectionQuestion extends BaseQuestion {
  type: 'section';
  props: {
    richText: string;        // markdown/HTML
    showDivider: boolean;
  };
}

// Consent
export interface ConsentQuestion extends BaseQuestion {
  type: 'consent';
  props: {
    text: string;
    linkToTerms?: string;
  };
}

// Address
export interface AddressQuestion extends BaseQuestion {
  type: 'address';
  props: {
    showStreet: boolean;
    showCity: boolean;
    showState: boolean;
    showZip: boolean;
    showCountry: boolean;
    autoComplete: boolean;
  };
}

export type Question =
  | ChoiceQuestion
  | TextQuestion
  | RatingQuestion
  | DateQuestion
  | DropdownQuestion
  | YesNoQuestion
  | NumberQuestion
  | SliderQuestion
  | FileUploadQuestion
  | ImageChoiceQuestion
  | SignatureQuestion
  | NpsQuestion
  | OpinionScaleQuestion
  | RankingQuestion
  | MatrixSingleQuestion
  | MatrixMultiQuestion
  | SectionQuestion
  | ConsentQuestion
  | AddressQuestion;

export interface SurveyDoc {
  id: Id;
  title: string;
  pages: { id: Id; title: string; questions: Question[] }[];
  status: 'draft' | 'published' | 'archived';
  createdUtc: string;
  updatedUtc: string;
  version: number;
}
