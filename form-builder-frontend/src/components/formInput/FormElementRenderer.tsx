import type { Control } from 'react-hook-form';
import type { FormElement } from '../../types/FormInput';
import { FileUploadField } from './FileUploadField';
import { SelectInputField } from './SelectInputField';
import { TextInputField } from './TextInputField';

interface Props {
  element: FormElement;
  control?: Control<any>;
  name: string;
  preview: boolean;
}

export const FormElementRenderer = ({ element, control, name, preview }: Props) => {
  switch (element.type) {
    case 'text-input':
      return (
        <TextInputField
          name={name}
          control={control}
          label={element.title}
          required={element.required}
          disabled={preview}
        />
      );

    case 'select-input':
      return (
        <SelectInputField
          name={name}
          control={control}
          label={element.title}
          options={element.options}
          required={element.required}
          disabled={preview}
        />
      );

    case 'file-upload':
      return (
        <FileUploadField
          name={name}
          control={control}
          label={element.title}
          required={element.required}
          disabled={preview}
        />
      );

    default:
      return null;
  }
};