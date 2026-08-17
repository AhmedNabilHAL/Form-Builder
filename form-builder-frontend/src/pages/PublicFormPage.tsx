import { useEffect, useMemo } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import type { SubmissionValue } from "../types/Submission";
import { FormElementRenderer } from "../components/formInput/FormElementRenderer";
import { BrandMark } from "../components/ui/BrandMark";
import { createSubmissionApi, getFormByIdApi } from "../api/form";

type PublicFormValues = Record<string, SubmissionValue>;

export const PublicFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const formQuery = useQuery({
    queryKey: ["form", id],
    queryFn: () => getFormByIdApi(id!),
    enabled: Boolean(id),
  });

  const form = formQuery.data;
  const defaultValues = useMemo<PublicFormValues>(() => {
    if (!form) return {};
    return Object.fromEntries(
      form.elements.map((element) => [
        element.id,
        element.type === "file-upload" ? null : "",
      ])
    );
  }, [form]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PublicFormValues>({
    defaultValues: {},
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (form) reset(defaultValues);
  }, [defaultValues, form, reset]);

  const submitMutation = useMutation({
    mutationFn: createSubmissionApi,
  });

  const onSubmit = async (values: PublicFormValues) => {
    if (!form || submitMutation.isPending || submitMutation.isSuccess) return;
    await submitMutation.mutateAsync({
      formId: form.id,
      answers: values,
    });
  };

  const onInvalid = () => {
    window.requestAnimationFrame(() =>
      document.getElementById("public-form-error-summary")?.focus()
    );
  };

  const errorItems = form
    ? form.elements.filter((element) => Boolean(errors[element.id]))
    : [];

  const focusQuestion = (elementId: string) => {
    const namedControl = document.querySelector<HTMLElement>(
      `[name="${CSS.escape(elementId)}"]:not([type="hidden"])`
    );
    if (namedControl && namedControl.getAttribute("type") !== "file") {
      namedControl.focus();
      return;
    }
    const uploadButton = document.getElementById(`field-${elementId}-button`);
    if (uploadButton) {
      uploadButton.focus();
      return;
    }
    document.getElementById(`question-${elementId}`)?.focus();
  };

  if (formQuery.isLoading) {
    return (
      <PublicShell>
        <Typography component="h1" className="sr-only" tabIndex={-1}>
          Loading form
        </Typography>
        <Card sx={{ maxWidth: 720, mx: "auto", p: { xs: 2, md: 5 } }}>
          <Stack spacing={2.5}>
            <Skeleton width="64%" height={52} />
            <Skeleton width="88%" />
            <Skeleton variant="rounded" height={92} />
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={92} />
          </Stack>
        </Card>
      </PublicShell>
    );
  }

  if (formQuery.isError || !form) {
    return (
      <PublicShell>
        <Card sx={{ maxWidth: 720, mx: "auto", p: { xs: 2.5, md: 5 } }}>
          <Typography component="h1" variant="h1" tabIndex={-1}>
            Form not found
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>
            The link may be incorrect or the form may have been removed.
          </Typography>
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => formQuery.refetch()}>
                Try again
              </Button>
            }
            sx={{ mt: 3 }}
          >
            {formQuery.error instanceof Error
              ? formQuery.error.message
              : "The form could not be loaded."}
          </Alert>
        </Card>
      </PublicShell>
    );
  }

  if (submitMutation.isSuccess) {
    const submittedAt =
      submitMutation.data.submittedAt || new Date().toISOString();
    const submittedLabel = new Intl.DateTimeFormat(undefined, {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(submittedAt));

    return (
      <PublicShell>
        <Card
          sx={{
            maxWidth: 720,
            mx: "auto",
            p: { xs: 3, md: 6 },
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              display: "grid",
              placeItems: "center",
              mx: "auto",
              borderRadius: "50%",
              bgcolor: "success.light",
              color: "success.main",
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography component="h1" variant="h1" tabIndex={-1} sx={{ mt: 2.5 }}>
            Response submitted
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>
            Your response was received on {submittedLabel}.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => window.close()}
            sx={{ mt: 3 }}
          >
            Close
          </Button>
        </Card>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <Card
        sx={{
          maxWidth: 720,
          mx: "auto",
          p: { xs: "20px 16px", sm: 3, md: 5 },
          borderRadius: { xs: "14px", md: "20px" },
          boxShadow: "0 1px 2px rgba(30, 22, 80, 0.08)",
        }}
      >
        <Typography
          component="h1"
          tabIndex={-1}
          sx={{
            fontFamily:
              '"DM Sans Variable", "Segoe UI", sans-serif',
            fontSize: { xs: "1.75rem", md: "2.5rem" },
            lineHeight: { xs: 1.285, md: 1.2 },
            fontWeight: 650,
            letterSpacing: "-0.03em",
            overflowWrap: "anywhere",
          }}
        >
          {form.title}
        </Typography>
        {form.description && (
          <Typography
            sx={{
              mt: 1.5,
              maxWidth: "60ch",
              color: "text.secondary",
              fontSize: { xs: "1rem", md: "1.125rem" },
              lineHeight: { xs: 1.5, md: 1.555 },
              whiteSpace: "pre-wrap",
            }}
          >
            {form.description}
          </Typography>
        )}
        {form.elements.some((element) => element.required) && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Fields marked Required must be completed.
          </Typography>
        )}

        <Divider sx={{ my: { xs: 3, md: 4 } }} />

        {errorItems.length > 0 && (
          <Alert
            id="public-form-error-summary"
            tabIndex={-1}
            severity="error"
            role="alert"
            sx={{ mb: 3, alignItems: "flex-start" }}
          >
            <Typography fontWeight={700}>
              Fix {errorItems.length}{" "}
              {errorItems.length === 1 ? "answer" : "answers"} before submitting
            </Typography>
            <List dense disablePadding sx={{ mt: 0.5 }}>
              {errorItems.map((element) => (
                <ListItemButton
                  key={element.id}
                  onClick={() => focusQuestion(element.id)}
                  sx={{ px: 0, py: 0.25, minHeight: 36 }}
                >
                  <ListItemIcon sx={{ minWidth: 28, color: "error.main" }}>
                    <ErrorOutlineIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      errors[element.id]?.message?.toString() ||
                      `Check “${element.title}”.`
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Alert>
        )}

        {submitMutation.isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => submitMutation.reset()}>
                Dismiss
              </Button>
            }
            sx={{ mb: 3 }}
          >
            <Typography fontWeight={700}>Response was not submitted</Typography>
            Your answers are still here. Check your connection and try again.
          </Alert>
        )}

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit, onInvalid)}
        >
          <Stack spacing={3.5}>
            {form.elements.map((element) => (
              <FormElementRenderer
                key={element.id}
                element={element}
                control={control}
                name={element.id}
                preview={false}
              />
            ))}
          </Stack>

          <Divider sx={{ my: { xs: 3, md: 4 } }} />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary">
              Review your answers before submitting.
            </Typography>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitMutation.isPending}
              sx={{ minWidth: { sm: 176 }, minHeight: 52 }}
              startIcon={
                submitMutation.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : undefined
              }
            >
              {submitMutation.isPending
                ? "Submitting…"
                : "Submit response"}
            </Button>
          </Stack>
        </Box>
      </Card>
    </PublicShell>
  );
};

const PublicShell = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      bgcolor: "background.default",
    }}
  >
    <a className="skip-link" href="#public-form-content">
      Skip to form
    </a>
    <Box component="header" sx={{ py: 2.5 }}>
      <Container maxWidth="md">
        <BrandMark />
      </Container>
    </Box>
    <Box
      component="main"
      id="public-form-content"
      sx={{
        flex: 1,
        px: { xs: 2, sm: 2.5, md: 3 },
        py: { xs: 1, md: 3 },
      }}
    >
      {children}
    </Box>
    <Box component="footer" sx={{ py: 3, px: 2, textAlign: "center" }}>
      <Typography variant="caption" color="text.secondary">
        Powered by FormFlow
      </Typography>
    </Box>
  </Box>
);
