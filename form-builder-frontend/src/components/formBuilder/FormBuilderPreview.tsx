import { Box, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useWatch, type Control } from "react-hook-form";
import type { Form } from "../../types/Form";

interface FormElementPreviewProps {
  index: number;
  control: Control<Form>;
}

export const FormElementPreview = ({
  index,
  control,
}: FormElementPreviewProps) => {
  const element = useWatch({
    control,
    name: `elements.${index}`,
  });

  if (!element) return null;

  switch (element.type) {
    case "text-input":
      return (
        <TextField
          label={element.title}
          fullWidth
          disabled
          placeholder="User answer"
        />
      );

    case "select-input":
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <TextField
            select
            label={element.title}
            fullWidth
            disabled
            value=""
          >
            <MenuItem value="" disabled>
              Select an option
            </MenuItem>

            {element.options.map((opt) => (
              <MenuItem key={opt.id} value={opt.value}>
                {opt.value}
              </MenuItem>
            ))}
          </TextField>

          {element.options.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {element.options.map((opt) => (
                <Chip
                  key={opt.id}
                  label={opt.value || "Untitled option"}
                  size="medium"
                  variant="outlined"
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No options added yet.
            </Typography>
          )}
        </Box>
      );

    case "file-upload":
      return (
        <Box>
          <Typography variant="body1">{element.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            File upload
          </Typography>
        </Box>
      );

    default:
      return null;
  }
};