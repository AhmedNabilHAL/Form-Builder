import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import { Box, Card, Chip, Stack, Typography } from "@mui/material";

import type { FormElement } from "../types/FormInput";
import type { SubmissionValue } from "../types/Submission";
import { storedFileName } from "../utils/form";

interface SubmissionAnswerRendererProps {
  element: FormElement;
  value: SubmissionValue;
}

export const SubmissionAnswerRenderer = ({
  element,
  value,
}: SubmissionAnswerRendererProps) => {
  const answer = typeof value === "string" ? value.trim() : "";

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.5 }}
      >
        {element.title || "Untitled question"}
      </Typography>

      {element.type === "file-upload" ? (
        answer ? (
          <Card sx={{ p: 1.5, bgcolor: "#FAFBFC" }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <AttachFileOutlinedIcon color="action" />
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700} noWrap title={storedFileName(answer)}>
                  {storedFileName(answer)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Download is not available for this attachment.
                </Typography>
              </Box>
            </Stack>
          </Card>
        ) : (
          <Typography color="text.secondary">No file provided</Typography>
        )
      ) : element.type === "select-input" && answer ? (
        <Chip label={answer} size="small" />
      ) : (
        <Typography
          color={answer ? "text.primary" : "text.secondary"}
          sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
          dir="auto"
        >
          {answer || "No answer provided"}
        </Typography>
      )}
    </Box>
  );
};
