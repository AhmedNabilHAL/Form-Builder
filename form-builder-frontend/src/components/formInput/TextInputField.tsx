import { Controller } from 'react-hook-form';
import { TextField } from '@mui/material';
import type { BaseFieldProps } from '../../types/FormInput';

export const TextInputField = ({
  name,
  control,
  label,
  required,
  disabled = false
}: BaseFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? 'This field is required' : false }}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          disabled={disabled}
        />
      )}
    />
  );
};