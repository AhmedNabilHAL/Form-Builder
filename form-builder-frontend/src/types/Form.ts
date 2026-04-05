import type { FormElement } from "./FormInput";

interface Form {
  id: string;
  title: string;
  description: string;
  elements: FormElement[];
}

export type {
  Form
}