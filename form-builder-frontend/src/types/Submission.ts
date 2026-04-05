type SubmissionValue = string | File | null;
type SubmissionAnswers = Record<string, SubmissionValue>;

interface Submission {
  id: string;
  formId: string;
  answers: SubmissionAnswers;
  submittedAt: string;
}
export type {
  SubmissionValue,
  SubmissionAnswers,
  Submission
}