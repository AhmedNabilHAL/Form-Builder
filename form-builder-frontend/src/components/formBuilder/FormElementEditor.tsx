import {
  Alert,
  Box,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import type { Form } from "../../types/Form";
import type { InputType } from "../../types/FormInput";
import { SelectOptionsEditor } from "./SelectOptionsEditor";

interface FormElementEditorProps {
  index: number;
  issues?: string[];
}

export const FormElementEditor = ({
  index,
  issues = [],
}: FormElementEditorProps) => {
  const { control, getValues, setValue } = useFormContext<Form>();
  const type = useWatch({
    control,
    name: `elements.${index}.type`,
  });

  const changeType = (nextType: InputType) => {
    const current = getValues(`elements.${index}`);

    if (nextType === "select-input") {
      setValue(
        `elements.${index}`,
        {
          ...current,
          type: nextType,
          options:
            current.type === "select-input" && current.options.length >= 2
              ? current.options
              : [
                  { id: crypto.randomUUID(), value: "" },
                  { id: crypto.randomUUID(), value: "" },
                ],
        },
        { shouldDirty: true, shouldTouch: true }
      );
      return;
    }

    setValue(
      `elements.${index}`,
      {
        id: current.id,
        title: current.title,
        required: current.required,
        sortOrder: current.sortOrder,
        type: nextType,
      },
      { shouldDirty: true, shouldTouch: true }
    );
  };

  return (
    <Stack spacing={2.5}>
      {issues.length > 0 && (
        <Alert severity="error" role="alert">
          <Typography fontWeight={700}>This question needs attention</Typography>
          {issues.map((issue) => (
            <Typography key={issue} variant="body2">
              {issue}
            </Typography>
          ))}
        </Alert>
      )}

      <Controller
        name={`elements.${index}.title`}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Question"
            placeholder="Enter a question"
            autoComplete="off"
            error={issues.some((issue) => issue.includes("title"))}
          />
        )}
      />

      <TextField
        select
        label="Answer type"
        value={type}
        onChange={(event) => changeType(event.target.value as InputType)}
      >
        <MenuItem value="text-input">Short answer</MenuItem>
        <MenuItem value="select-input">Multiple choice</MenuItem>
        <MenuItem value="file-upload">File upload</MenuItem>
      </TextField>

      {type === "select-input" && <SelectOptionsEditor index={index} />}

      <Controller
        name={`elements.${index}.required`}
        control={control}
        render={({ field }) => (
          <Box
            component="label"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              minHeight: 64,
              p: 1.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            <Box>
              <Typography variant="subtitle2">Required</Typography>
              <Typography variant="body2" color="text.secondary">
                Respondents must answer before submitting.
              </Typography>
            </Box>
            <FormControlLabel
              sx={{ m: 0 }}
              label=""
              control={
                <Switch
                  checked={Boolean(field.value)}
                  onChange={(_, checked) => field.onChange(checked)}
                  inputProps={{
                    "aria-label": "Required question",
                  }}
                />
              }
            />
          </Box>
        )}
      />
    </Stack>
  );
};
