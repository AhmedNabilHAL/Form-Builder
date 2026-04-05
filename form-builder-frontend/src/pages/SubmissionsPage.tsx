import { Box, Card, CircularProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { getFormByIdApi, getSubmissionsByFormIdApi } from "../api/form";
import { SubmissionAnswerRenderer } from "../components/SubmissionAnswerRenderer";

export const SubmissionsPage = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: form,
    isLoading: isFormLoading,
    isError: isFormError,
    error: formError,
  } = useQuery({
    queryKey: ["form", id],
    queryFn: () => getFormByIdApi(id!),
    enabled: !!id,
  });

  const {
    data: submissions = [],
    isLoading: isSubmissionsLoading,
    isError: isSubmissionsError,
    error: submissionsError,
  } = useQuery({
    queryKey: ["form-submissions", id],
    queryFn: () => getSubmissionsByFormIdApi(id!),
    enabled: !!id,
  });

  if (isFormLoading || isSubmissionsLoading) {
    return (
      <Box
        sx={{
          maxWidth: 900,
          mx: "auto",
          p: 4,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isFormError || !form) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", p: 4 }}>
        <Card sx={{ p: 4 }}>
          <Typography variant="h6" color="error.main" gutterBottom>
            Failed to load form
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formError instanceof Error
              ? formError.message
              : "The form could not be loaded."}
          </Typography>
        </Card>
      </Box>
    );
  }

  if (isSubmissionsError) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", p: 4 }}>
        <Card sx={{ p: 4 }}>
          <Typography variant="h6" color="error.main" gutterBottom>
            Failed to load submissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {submissionsError instanceof Error
              ? submissionsError.message
              : "The submissions could not be loaded."}
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {form.title} — Submissions
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {submissions.length} submission{submissions.length === 1 ? "" : "s"}
      </Typography>

      {submissions.length === 0 ? (
        <Card sx={{ p: 3 }}>
          <Typography variant="body1">No submissions yet.</Typography>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {submissions.map((submission, submissionIndex) => (
            <Card key={submission.id} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Submission #{submissionIndex + 1}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Submitted at: {new Date(submission.submittedAt).toLocaleString()}
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {form.elements.map((element) => (
                  <SubmissionAnswerRenderer
                    key={element.id}
                    element={element}
                    value={submission.answers[element.id] ?? null}
                  />
                ))}
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};