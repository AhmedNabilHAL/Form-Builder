import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { Box, Button, Card, Chip, Stack, Typography } from "@mui/material";

import { getSubmissionFileUrl } from "../api/form";
import type { FormElement } from "../types/FormInput";
import type { SubmissionValue } from "../types/Submission";
import { storedFileName } from "../utils/form";

interface SubmissionAnswerRendererProps {
  element: FormElement;
  value: SubmissionValue;
  formId: string;
  submissionId: string;
}

export const SubmissionAnswerRenderer = ({
  element,
  value,
  formId,
  submissionId,
}: SubmissionAnswerRendererProps) => {
  const answer = typeof value === "string" ? value.trim() : "";
  const fileName = answer ? storedFileName(answer) : "";

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
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={700} noWrap title={fileName}>
                  {fileName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stored securely with this response
                </Typography>
              </Box>
              <Button
                component="a"
                href={getSubmissionFileUrl(formId, submissionId, element.id)}
                variant="outlined"
                size="small"
                startIcon={<DownloadOutlinedIcon />}
                aria-label={`Download ${fileName}`}
                sx={{ flexShrink: 0 }}
              >
                Download
              </Button>
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
