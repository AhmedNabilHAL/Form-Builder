import { Box, Button, TextField } from "@mui/material";
import { Controller, useFieldArray, type Control } from "react-hook-form";
import type { Form } from "../../types/Form";

interface SelectOptionsEditorProps {
  control: Control<Form>;
  index: number;
}

export const SelectOptionsEditor = ({
  control,
  index,
}: SelectOptionsEditorProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `elements.${index}.options`,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {fields.map((field, optionIndex) => (
        <Box
          key={field.id}
          sx={{ display: "flex", gap: 1, alignItems: "center" }}
        >
          <Controller
            name={`elements.${index}.options.${optionIndex}.value`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={`Option ${optionIndex + 1}`}
                fullWidth
              />
            )}
          />

          <Button
            type="button"
            color="error"
            onClick={() => remove(optionIndex)}
          >
            Remove
          </Button>
        </Box>
      ))}

      <Button
        type="button"
        variant="outlined"
        onClick={() =>
          append({
            id: crypto.randomUUID(),
            value: "",
          })
        }
      >
        Add Option
      </Button>
    </Box>
  );
};