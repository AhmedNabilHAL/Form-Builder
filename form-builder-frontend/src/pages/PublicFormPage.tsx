import { Box, Button, Card, CircularProgress, Typography } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import type { SubmissionValue } from "../types/Submission";
import { FormElementRenderer } from "../components/formInput/FormElementRenderer";
import { createSubmissionApi, getFormByIdApi } from "../api/form";

type PublicFormValues = Record<string, SubmissionValue>;

export const PublicFormPage = () => {
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

  const defaultValues = useMemo<PublicFormValues>(() => {
    if (!form) return {};

    return form.elements.reduce<PublicFormValues>((acc, element) => {
      acc[element.id] = null;
      return acc;
    }, {});
  }, [form]);

  const { control, handleSubmit, reset } = useForm<PublicFormValues>({
    defaultValues: {},
  });

  useEffect(() => {
    if (form) {
      reset(defaultValues);
    }
  }, [form, defaultValues, reset]);

  const submitMutation = useMutation({
    mutationFn: createSubmissionApi,
  });

  const onSubmit = async (values: PublicFormValues) => {
    if (!form) return;

    await submitMutation.mutateAsync({
      formId: form.id,
      answers: values,
    });
  };

  if (isFormLoading) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isFormError || !form) {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 4 }}>
        <Card sx={{ p: 4 }}>
          <Typography variant="h6" color="error.main" gutterBottom>
            Failed to load form
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formError instanceof Error ? formError.message : "The form could not be loaded."}
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 4 }}>
      <Card sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {form.title}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {form.description}
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          {form.elements.map((element) => (
            <FormElementRenderer
              key={element.id}
              element={element}
              control={control}
              name={element.id}
              preview={false}
            />
          ))}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </Box>

          {submitMutation.isSuccess && (
            <Typography variant="body2" color="success.main">
              Form submitted successfully.
            </Typography>
          )}

          {submitMutation.isError && (
            <Typography variant="body2" color="error.main">
              {submitMutation.error instanceof Error
                ? submitMutation.error.message
                : "Failed to submit the form."}
            </Typography>
          )}
        </Box>
      </Card>
    </Box>
  );
};