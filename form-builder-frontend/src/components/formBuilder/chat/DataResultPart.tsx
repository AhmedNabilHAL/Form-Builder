import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import type { ChatPartRendererProps } from "@mui/x-chat-headless";

import type { DataResult, FormSummary, SubmissionRow } from "../../../types/Chat";

/**
 * Renders a DATA reply's structured payload as MUI cards inside the chat bubble.
 * Registered on {@link ChatBox} via `partRenderers["data-result"]`.
 */
export const DataResultPart = ({ part }: ChatPartRendererProps) => {
  // Custom data part: type is "data-result" and `data` carries our payload.
  const data = (part as { data?: unknown }).data as DataResult | undefined;

  if (!data || typeof data !== "object") {
    return null;
  }

  if (data.kind === "forms") {
    return <FormsCard forms={data.forms ?? []} />;
  }

  if (data.kind === "submissions") {
    return <SubmissionsCard count={data.count ?? 0} submissions={data.submissions ?? []} />;
  }

  return null;
};

const FormsCard = ({ forms }: { forms: FormSummary[] }) => (
  <Card variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
    <CardContent sx={{ "&:last-child": { pb: 2 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <DescriptionOutlinedIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2">
          Forms ({forms.length})
        </Typography>
      </Box>

      {forms.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No forms found.
        </Typography>
      ) : (
        <List dense disablePadding>
          {forms.map((form) => (
            <ListItem key={form.id} disableGutters sx={{ py: 0.25 }}>
              <ListItemText
                primary={form.title || "Untitled"}
                secondary={form.description || undefined}
                slotProps={{
                  primary: { variant: "body2", fontWeight: 600 },
                  secondary: { variant: "caption" },
                }}
              />
              <Chip
                size="small"
                label={`${form.fieldCount ?? 0} ${(form.fieldCount ?? 0) === 1 ? "field" : "fields"
                  }`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </CardContent>
  </Card>
);

const SubmissionsCard = ({
  count,
  submissions,
}: {
  count: number;
  submissions: SubmissionRow[];
}) => (
  <Card variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
    <CardContent sx={{ "&:last-child": { pb: 2 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <InboxOutlinedIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2">
          {count} {count === 1 ? "submission" : "submissions"}
        </Typography>
      </Box>

      {submissions.length > 0 && (
        <List dense disablePadding>
          {submissions.slice(0, 5).map((submission, index) => (
            <Box key={submission.submissionId}>
              {index > 0 && <Divider component="li" />}
              <ListItem disableGutters sx={{ py: 0.5, alignItems: "flex-start" }}>
                <ListItemText
                  primary={formatAnswers(submission.answers)}
                  secondary={
                    submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleString()
                      : undefined
                  }
                  slotProps={{
                    primary: { variant: "body2" },
                    secondary: { variant: "caption" },
                  }}
                />
              </ListItem>
            </Box>
          ))}
        </List>
      )}

      {submissions.length > 5 && (
        <Typography variant="caption" color="text.secondary">
          …and {submissions.length - 5} more
        </Typography>
      )}
    </CardContent>
  </Card>
);

const formatAnswers = (answers: Record<string, string>): string => {
  const values = Object.values(answers ?? {}).filter(Boolean);
  if (values.length === 0) {
    return "(no answers)";
  }
  return values.join(" • ");
};
