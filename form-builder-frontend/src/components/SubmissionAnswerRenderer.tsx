import { Box, Chip, Typography } from "@mui/material";
import type { FormElement } from "../types/FormInput";
import type { SubmissionValue } from "../types/Submission";

interface SubmissionAnswerRendererProps {
  element: FormElement;
  value: SubmissionValue;
}

export const SubmissionAnswerRenderer = ({
  element,
  value,
}: SubmissionAnswerRendererProps) => {
  switch (element.type) {
    case "text-input":
      return (
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            {element.title}
          </Typography>
          <Typography variant="body1">
            {typeof value === "string" && value.trim() ? value : "—"}
          </Typography>
        </Box>
      );

    case "select-input":
      return (
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            {element.title}
          </Typography>
          {typeof value === "string" && value.trim() ? (
            <Chip label={value} size="small" />
          ) : (
            <Typography variant="body1">—</Typography>
          )}
        </Box>
      );

    case "file-upload":
      return (
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            {element.title}
          </Typography>
          {value instanceof File ? (
            <Typography variant="body1">{value.name}</Typography>
          ) : (
            <Typography variant="body1">No file uploaded</Typography>
          )}
        </Box>
      );

    default:
      return null;
  }
};