import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import type { Form } from "../../types/Form";

interface SelectOptionsEditorProps {
  index: number;
}

export const SelectOptionsEditor = ({ index }: SelectOptionsEditorProps) => {
  const { control } = useFormContext<Form>();
  const { fields, append, remove, move } = useFieldArray({
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
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography variant="subtitle2">Choices</Typography>
        <Typography variant="caption" color="text.secondary">
          At least two
        </Typography>
      </Stack>

      <Stack spacing={1} sx={{ mt: 1 }}>
        {fields.map((field, optionIndex) => (
          <Stack
            key={field.id}
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <DragIndicatorIcon
              aria-hidden="true"
              sx={{ color: "text.disabled", flex: "0 0 auto" }}
            />
            <Controller
              name={`elements.${index}.options.${optionIndex}.value`}
              control={control}
              render={({ field: optionField }) => (
                <TextField
                  {...optionField}
                  placeholder={`Option ${optionIndex + 1}`}
                  inputProps={{
                    "aria-label": `Choice ${optionIndex + 1}`,
                  }}
                  sx={{ flex: 1, minWidth: 0 }}
                />
              )}
            />
            <Tooltip title="Move choice up">
              <span>
                <IconButton
                  type="button"
                  size="small"
                  disabled={optionIndex === 0}
                  aria-label={`Move choice ${optionIndex + 1} up`}
                  onClick={() => move(optionIndex, optionIndex - 1)}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move choice down">
              <span>
                <IconButton
                  type="button"
                  size="small"
                  disabled={optionIndex === fields.length - 1}
                  aria-label={`Move choice ${optionIndex + 1} down`}
                  onClick={() => move(optionIndex, optionIndex + 1)}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete choice">
              <IconButton
                type="button"
                size="small"
                color="error"
                aria-label={`Delete choice ${optionIndex + 1}`}
                onClick={() => remove(optionIndex)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() =>
          append({
            id: crypto.randomUUID(),
            value: "",
          })
        }
        sx={{ mt: 1.5 }}
      >
        Add choice
      </Button>
    </Box>
  );
};
