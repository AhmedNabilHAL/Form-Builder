import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
          aria-label={`Preview of ${element.title || "short answer question"}`}
          fullWidth
          disabled
          placeholder="Short answer"
          sx={{ maxWidth: 560 }}
        />
      );

    case "select-input":
      return (
        <FormControl disabled sx={{ width: "100%" }}>
          {element.options.length > 0 ? (
            <RadioGroup aria-label="Multiple choice preview">
              {element.options.slice(0, 4).map((option, optionIndex) => (
                <FormControlLabel
                  key={option.id}
                  value={option.value}
                  control={<Radio size="small" />}
                  label={option.value || `Option ${optionIndex + 1}`}
                  sx={{
                    minHeight: 40,
                    mx: 0,
                    "& .MuiFormControlLabel-label.Mui-disabled": {
                      color: "text.secondary",
                    },
                  }}
                />
              ))}
            </RadioGroup>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Add at least two choices.
            </Typography>
          )}
        </FormControl>
      );

    case "file-upload":
      return (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            minHeight: 56,
            px: 2,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: "10px",
            color: "text.secondary",
            bgcolor: "#FAFBFC",
          }}
        >
          <AttachFileOutlinedIcon fontSize="small" />
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Choose a file
            </Typography>
            <Typography variant="caption">PNG, JPG, or PDF · Up to 10 MB</Typography>
          </Box>
        </Stack>
      );

    default:
      return null;
  }
};
