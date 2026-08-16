import { useRef, useState, type DragEvent } from "react";
import { Controller } from "react-hook-form";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import type { BaseFieldProps } from "../../types/FormInput";
import { QuestionLabel } from "./QuestionLabel";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "application/pdf",
]);

const validateFile = (
  value: unknown,
  required: boolean,
  label: string
): true | string => {
  if (!(value instanceof File)) {
    return required ? `Choose a file for “${label}”.` : true;
  }
  if (value.size > MAX_FILE_SIZE) {
    return "This file is over 10 MB. Choose a smaller file.";
  }
  if (!ACCEPTED_TYPES.has(value.type)) {
    return "Choose a PNG, JPG, or PDF file.";
  }
  return true;
};

const fileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileUploadField = ({
  name,
  control,
  label,
  required = false,
  disabled = false,
}: BaseFieldProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: (value) => validateFile(value, required, label),
      }}
      disabled={disabled}
      render={({ field, fieldState }) => {
        const file = field.value instanceof File ? field.value : null;

        const selectFile = (nextFile: File | null) => {
          field.onChange(nextFile);
          field.onBlur();
        };

        const onDrop = (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          selectFile(event.dataTransfer.files?.[0] ?? null);
        };

        return (
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

            <Box
              onDragEnter={(event) => {
                event.preventDefault();
                if (!disabled) setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              sx={{
                minHeight: { xs: 88, md: 112 },
                p: 2,
                display: "grid",
                placeItems: "center",
                border: "1px dashed",
                borderColor: fieldState.error
                  ? "error.main"
                  : dragging
                    ? "primary.main"
                    : "border.control",
                borderRadius: "10px",
                bgcolor: dragging ? "primary.light" : "#FAFBFC",
                textAlign: "center",
                transition:
                  "background-color 120ms cubic-bezier(0.2, 0, 0, 1), border-color 120ms cubic-bezier(0.2, 0, 0, 1)",
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <UploadFileOutlinedIcon color="primary" />
                <Button
                  id={`${inputId}-button`}
                  type="button"
                  variant="outlined"
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                >
                  {file ? "Replace file" : "Choose file"}
                </Button>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: { xs: "none", md: "block" } }}
                >
                  or drag it here
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PNG, JPG, or PDF · Up to 10 MB
                </Typography>
                <input
                  id={inputId}
                  ref={(node) => {
                    inputRef.current = node;
                    field.ref(node);
                  }}
                  name={field.name}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                  hidden
                  disabled={disabled}
                  aria-describedby={fieldState.error ? errorId : undefined}
                  aria-invalid={Boolean(fieldState.error)}
                  aria-required={Boolean(required)}
                  onChange={(event) =>
                    selectFile(event.target.files?.[0] ?? null)
                  }
                />
              </Stack>
            </Box>

            {file && (
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "10px",
                  bgcolor: "background.paper",
                }}
              >
                <AttachFileOutlinedIcon color="action" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700} noWrap title={file.name}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {file.type || "File"} · {fileSize(file.size)} · Ready to
                    submit
                  </Typography>
                </Box>
                {!disabled && (
                  <IconButton
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => selectFile(null)}
                  >
                    <CloseIcon />
                  </IconButton>
                )}
              </Stack>
            )}

            {fieldState.error && (
              <FormHelperText id={errorId} role="alert">
                {fieldState.error.message}
              </FormHelperText>
            )}
          </FormControl>
        );
      }}
    />
  );
};
