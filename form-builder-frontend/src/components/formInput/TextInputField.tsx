import { Controller } from "react-hook-form";
import {
  FormControl,
  FormHelperText,
  FormLabel,
  TextField,
} from "@mui/material";

import type { BaseFieldProps } from "../../types/FormInput";
import { QuestionLabel } from "./QuestionLabel";

export const TextInputField = ({
  name,
  control,
  label,
  required,
  disabled = false,
}: BaseFieldProps) => {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `Answer “${label}”.` : false,
      }}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <FormControl
          id={`question-${name}`}
          fullWidth
          error={Boolean(fieldState.error)}
          tabIndex={-1}
          sx={{ scrollMarginTop: 112 }}
        >
          <FormLabel htmlFor={inputId} sx={{ mb: 1 }}>
            <QuestionLabel label={label} required={required} />
          </FormLabel>
          <TextField
            {...field}
            id={inputId}
            value={field.value ?? ""}
            disabled={disabled}
            error={Boolean(fieldState.error)}
            placeholder="Type your answer"
            slotProps={{
              htmlInput: {
                "aria-describedby": fieldState.error ? errorId : undefined,
                "aria-invalid": Boolean(fieldState.error),
                "aria-required": Boolean(required),
              },
            }}
          />
          {fieldState.error && (
            <FormHelperText id={errorId} role="alert">
              {fieldState.error.message}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};
