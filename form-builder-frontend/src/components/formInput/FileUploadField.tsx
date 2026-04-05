import { Controller } from "react-hook-form";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import type { BaseFieldProps } from "../../types/FormInput";

export const FileUploadField = ({
  name,
  control,
  label,
  required,
  disabled = false,
}: BaseFieldProps) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? "File is required" : false }}
      disabled={disabled}
      render={({ field, fieldState }) => {
        const file = field.value as File | null | undefined;

        return (
          <Box>
            <Stack spacing={1.25}>
              <Button
                variant="outlined"
                component="label"
                disabled={disabled}
                startIcon={<UploadFileOutlinedIcon />}
                sx={{
                  justifyContent: "flex-start",
                  minHeight: 48,
                  borderStyle: "dashed",
                }}
              >
                {file ? "Replace file" : label}
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] ?? null;
                    field.onChange(selectedFile);
                  }}
                  disabled={disabled}
                />
              </Button>

              <Box
                sx={{
                  minHeight: 40,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: fieldState.error ? "error.main" : "divider",
                  backgroundColor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    Selected file
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {file ? file.name : "No file selected"}
                  </Typography>
                </Box>

                {file && !disabled && (
                  <IconButton
                    size="small"
                    onClick={() => field.onChange(null)}
                    aria-label="Remove file"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {fieldState.error && (
                <Typography variant="body2" color="error.main">
                  {fieldState.error.message}
                </Typography>
              )}
            </Stack>
          </Box>
        );
      }}
    />
  );
};