import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import type { Form } from "../../types/Form";

interface SelectOptionsEditorProps {
  index: number;
}

export const SelectOptionsEditor = ({ index }: SelectOptionsEditorProps) => {
  const { control } = useFormContext<Form>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `elements.${index}.options`,
  });
  const options =
    useWatch({ control, name: `elements.${index}.options` }) ?? [];

  const normalized = options
    .map((option) => option.value.trim().toLocaleLowerCase())
    .filter(Boolean);
  const hasDuplicates = normalized.length !== new Set(normalized).size;
  return (
    <Box>
      <Typography
        component="h3"
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "0.58rem",
          fontWeight: 600,
          letterSpacing: "0.11em",
          color: "text.secondary",
          textTransform: "uppercase",
        }}
      >
        Choices
      </Typography>

      <Stack spacing={0.75} sx={{ mt: 0.85 }}>
        {fields.map((field, optionIndex) => (
          <Stack
            key={field.id}
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 16,
                height: 16,
                flex: "0 0 16px",
                borderRadius: "50%",
                border: "2px solid",
                borderColor: "divider",
              }}
            />
            <Controller
              name={`elements.${index}.options.${optionIndex}.value`}
              control={control}
              render={({ field: optionField }) => (
                <TextField
                  {...optionField}
                  size="small"
                  placeholder={`Option ${optionIndex + 1}`}
                  inputProps={{
                    "aria-label": `Choice ${optionIndex + 1}`,
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    "& .MuiOutlinedInput-root": {
                      minHeight: 38,
                      bgcolor: "#F9F8FF",
                    },
                  }}
                />
              )}
            />
            <IconButton
              type="button"
              size="small"
              aria-label={`Delete choice ${optionIndex + 1}`}
              onClick={() => remove(optionIndex)}
              sx={{ width: 28, height: 28, color: "text.secondary" }}
            >
              <CloseRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      {hasDuplicates && (
        <Typography color="error.main" variant="body2" role="alert" sx={{ mt: 1 }}>
          Each choice must be unique.
        </Typography>
      )}

      <Button
        type="button"
        variant="text"
        onClick={() =>
          append({
            id: crypto.randomUUID(),
            value: "",
          })
        }
        sx={{
          mt: 0.75,
          px: 0,
          minWidth: 0,
          minHeight: 28,
          fontSize: "0.75rem",
          "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
        }}
      >
        + Add option
      </Button>
    </Box>
  );
};
