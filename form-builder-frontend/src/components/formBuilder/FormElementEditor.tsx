import { Box, TextField, MenuItem, Switch, FormControlLabel } from "@mui/material";
import { Controller, useWatch, type Control } from "react-hook-form";
import type { Form } from "../../types/Form";
import { SelectOptionsEditor } from "./SelectOptionsEditor";

interface FormElementEditorProps {
  index: number;
  control: Control<Form>;
}

export const FormElementEditor = ({
  index,
  control,
}: FormElementEditorProps) => {
  const type = useWatch({
    control,
    name: `elements.${index}.type`,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Controller
        name={`elements.${index}.type`}
        control={control}
        render={({ field }) => (
          <TextField {...field} select label="Type" fullWidth>
            <MenuItem value="text-input">Text</MenuItem>
            <MenuItem value="select-input">Select</MenuItem>
            <MenuItem value="file-upload">File Upload</MenuItem>
          </TextField>
        )}
      />

      <Controller
        name={`elements.${index}.title`}
        control={control}
        render={({ field }) => (
          <TextField {...field} label="Question Title" fullWidth />
        )}
      />

      <Controller
        name={`elements.${index}.required`}
        control={control}
        render={({ field }) => (
          <FormControlLabel
            label="Required"
            control={
              <Switch
                checked={!!field.value}
                onChange={(_, checked) => field.onChange(checked)}
              />
            }
          />
        )}
      />

      {type === "select-input" && (
        <SelectOptionsEditor control={control} index={index} />
      )}
    </Box>
  );
};