import { Controller } from "react-hook-form";
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";

import type { BaseFieldProps, SelectOption } from "../../types/FormInput";
import { QuestionLabel } from "./QuestionLabel";

interface SelectFieldProps extends BaseFieldProps {
  options: SelectOption[];
}

export const SelectInputField = ({
  name,
  control,
  label,
  options,
  required,
  disabled = false,
}: SelectFieldProps) => {
  const groupId = `field-${name}`;
  const errorId = `${groupId}-error`;
  const useRadios = options.length <= 7;

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? `Choose an answer for “${label}”.` : false,
      }}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <FormControl
          id={`question-${name}`}
          component="fieldset"
          fullWidth
          error={Boolean(fieldState.error)}
          tabIndex={-1}
          sx={{ scrollMarginTop: 112 }}
        >
          <FormLabel
            component="legend"
            id={`${groupId}-label`}
            sx={{ mb: 1 }}
          >
            <QuestionLabel label={label} required={required} />
          </FormLabel>

          {useRadios ? (
            <RadioGroup
              {...field}
              id={groupId}
              value={field.value ?? ""}
              aria-labelledby={`${groupId}-label`}
              aria-describedby={fieldState.error ? errorId : undefined}
              aria-invalid={Boolean(fieldState.error)}
              aria-required={Boolean(required)}
              sx={{ gap: 0.5 }}
            >
              {options.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.value}
                  disabled={disabled}
                  control={<Radio />}
                  label={option.value}
                  sx={{
                    minHeight: { xs: 48, md: 44 },
                    m: 0,
                    px: 1,
                    border: "1px solid",
                    borderColor:
                      field.value === option.value
                        ? "primary.main"
                        : "divider",
                    borderRadius: "10px",
                    bgcolor:
                      field.value === option.value
                        ? "primary.light"
                        : "background.paper",
                    "&:hover": {
                      borderColor: disabled ? "divider" : "primary.main",
                    },
                  }}
                />
              ))}
            </RadioGroup>
          ) : (
            <TextField
              select
              id={groupId}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              name={field.name}
              disabled={disabled}
              error={Boolean(fieldState.error)}
              SelectProps={{
                displayEmpty: true,
                inputProps: {
                  "aria-labelledby": `${groupId}-label`,
                  "aria-describedby": fieldState.error ? errorId : undefined,
                  "aria-required": Boolean(required),
                },
              }}
            >
              <MenuItem value="" disabled>
                Choose an option
              </MenuItem>
              {options.map((option) => (
                <MenuItem key={option.id} value={option.value}>
                  {option.value}
                </MenuItem>
              ))}
            </TextField>
          )}

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
