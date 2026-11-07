export type EntryProfileMode = 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';

export type StudentGender = 'MALE' | 'FEMALE';

export type StudentEducationLevel =
  | 'BASIC_GENERAL'
  | 'SECONDARY_GENERAL'
  | 'SECONDARY_SPECIAL'
  | 'INCOMPLETE_HIGHER_FROM_YEAR_3'
  | 'HIGHER';

export interface StudentFormState {
  studentName: string;
  studentLastInitial: string;
  studentMiddleInitial: string;
  educationOrganization: string;
  groupOrClass: string;
  consentAccepted: boolean;
}

export interface DemographicFormState {
  gender: StudentGender | '';
  age: string;
  residence: string;
  educationLevel: StudentEducationLevel | '';
  consentAccepted: boolean;
}
