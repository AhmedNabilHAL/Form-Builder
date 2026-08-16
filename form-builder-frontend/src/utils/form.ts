import type { Form } from "../types/Form";
import type { FormElement, InputType } from "../types/FormInput";

export interface FormValidationIssue {
  id: string;
  message: string;
  elementId?: string;
}

export const createEmptyForm = (): Form => ({
  id: "",
  title: "",
  description: "",
  elements: [],
});

export const createFormElement = (
  type: InputType,
  sortOrder: number
): FormElement => {
  const base = {
    id: crypto.randomUUID(),
    title: "",
    required: false,
    sortOrder,
  };

  if (type === "select-input") {
    return {
      ...base,
      type,
      options: [
        { id: crypto.randomUUID(), value: "" },
        { id: crypto.randomUUID(), value: "" },
      ],
    };
  }

  return {
    ...base,
    type,
  };
};

export const normalizeForm = (form: Form): Form => ({
  ...form,
  title: form.title?.trim() ?? "",
  description: form.description?.trim() ?? "",
  elements: [...(form.elements ?? [])].map((element, index) => ({
    ...element,
    title: element.title?.trim() ?? "",
    sortOrder: index,
    ...(element.type === "select-input"
      ? {
          options: element.options.map((option) => ({
            ...option,
            value: option.value?.trim() ?? "",
          })),
        }
      : {}),
  })),
});

export const validateForm = (form: Form): FormValidationIssue[] => {
  const issues: FormValidationIssue[] = [];

  if (!form.title?.trim()) {
    issues.push({
      id: "form-title",
      message: "Add a form title.",
    });
  }

  if (!form.elements?.length) {
    issues.push({
      id: "form-elements",
      message: "Add at least one question.",
    });
  }

  form.elements?.forEach((element, index) => {
    const questionNumber = index + 1;

    if (!element.title?.trim()) {
      issues.push({
        id: `question-${element.id}-title`,
        elementId: element.id,
        message: `Question ${questionNumber} needs a title.`,
      });
    }

    if (element.type === "select-input") {
      const values = element.options.map((option) => option.value.trim());
      const nonEmpty = values.filter(Boolean);
      const normalized = nonEmpty.map((value) => value.toLocaleLowerCase());

      if (nonEmpty.length < 2) {
        issues.push({
          id: `question-${element.id}-options`,
          elementId: element.id,
          message: `Question ${questionNumber} needs at least two options.`,
        });
      }

      if (nonEmpty.length !== new Set(normalized).size) {
        issues.push({
          id: `question-${element.id}-duplicates`,
          elementId: element.id,
          message: `Question ${questionNumber} has duplicate options.`,
        });
      }
    }
  });

  return issues;
};

export const inputTypeLabel = (type: InputType) => {
  switch (type) {
    case "text-input":
      return "Short answer";
    case "select-input":
      return "Multiple choice";
    case "file-upload":
      return "File upload";
    default:
      return "Question";
  }
};

export const formFingerprint = (form: Form) =>
  JSON.stringify(normalizeForm(form));

export const summarizeFormChanges = (current: Form, proposed: Form) => {
  const changes: string[] = [];

  if (current.title !== proposed.title) {
    changes.push("Updated the form title");
  }

  if (current.description !== proposed.description) {
    changes.push("Updated the description");
  }

  const delta = proposed.elements.length - current.elements.length;
  if (delta > 0) {
    changes.push(`Added ${delta} ${delta === 1 ? "question" : "questions"}`);
  } else if (delta < 0) {
    const count = Math.abs(delta);
    changes.push(`Removed ${count} ${count === 1 ? "question" : "questions"}`);
  }

  const changedQuestions = proposed.elements.filter((element, index) => {
    const existing = current.elements[index];
    return existing && JSON.stringify(existing) !== JSON.stringify(element);
  }).length;

  if (changedQuestions > 0) {
    changes.push(
      `Revised ${changedQuestions} ${
        changedQuestions === 1 ? "question" : "questions"
      }`
    );
  }

  return changes.length > 0 ? changes : ["Prepared a refreshed form draft"];
};

export const storedFileName = (value: string) => {
  const finalSegment = value.split(/[\\/]/).pop() || value;
  return finalSegment.replace(/^[0-9a-f-]{36}_/i, "");
};

