import { Controller } from 'react-hook-form';
import { TextField, MenuItem } from '@mui/material';
import type { BaseFieldProps, SelectOption } from '../../types/FormInput';

interface SelectFieldProps extends BaseFieldProps {
  options: SelectOption[];
}

export const SelectInputField = ({
  name,
  control,
  label,
  options,
  required,
  disabled = false
}: SelectFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? 'This field is required' : false }}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          select
          label={label}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          disabled={disabled}
        >
          {options.map((option) => (
            <MenuItem key={option.id} value={option.value}>
              {option.value}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
};