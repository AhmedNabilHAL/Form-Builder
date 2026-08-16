import type { Control } from "react-hook-form";
import type { SubmissionValue } from "./Submission";

type InputType = 'text-input' | 'select-input' | 'file-upload';
interface BaseInput {
  id: string;
  title: string;
  required: boolean;
  sortOrder?: number;
}

interface TextInput extends BaseInput {
  type: 'text-input';
}

interface SelectInput extends BaseInput {
  type: 'select-input';
  options: SelectOption[];
}

interface SelectOption {
  id: string;
  value: string;
}

interface FileUploadInput extends BaseInput {
  type: 'file-upload';
}

type FormElement = TextInput | SelectInput | FileUploadInput;

interface BaseFieldProps {
  name: string;
  control?: Control<Record<string, SubmissionValue>>;
  label: string;
  required?: boolean;
  disabled?: boolean
}

export type {
  InputType,
  BaseInput,
  TextInput,
  SelectInput,
  FileUploadInput,
  FormElement,
  BaseFieldProps,
  SelectOption
}
