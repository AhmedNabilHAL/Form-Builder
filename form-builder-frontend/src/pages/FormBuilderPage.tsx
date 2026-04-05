import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import type { Form } from "../types/Form";
import type { FormElement } from "../types/FormInput";
import { FormBuilderToolbar } from "../components/formBuilder/FormBuilderToolbar";
import { FormElementBuilder } from "../components/formBuilder/FormElementBuilder";
import {
  getFormByIdApi,
  publishFormApi,
  updateFormApi,
  type PublishFormResponse,
} from "../api/form";

const emptyForm: Form = {
  id: "",
  title: "Untitled form",
  description: "Form Description",
  elements: [],
};

export const FormBuilderPage = () => {
  const [activeElementId, setActiveElementId] = useState<string | null>(null);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = !!id;

  const {
    data: fetchedForm,
    isLoading: isFormLoading,
    isError: isFormError,
    error: formError,
  } = useQuery({
    queryKey: ["form", id],
    queryFn: () => getFormByIdApi(id!),
    enabled: isEditMode,
  });

  const { control, handleSubmit, watch, reset } = useForm<Form>({
    defaultValues: emptyForm,
    mode: "onSubmit",
  });

  const { fields, append } = useFieldArray({
    control,
    name: "elements",
  });

  useEffect(() => {
    if (fetchedForm) {
      reset(fetchedForm);
      setActiveElementId(fetchedForm.elements[0]?.id ?? null);
    }
  }, [fetchedForm, reset]);

  const saveMutation = useMutation({
    mutationFn: async (form: Form) => {
      if (isEditMode && id) {
        return updateFormApi(id, form);
      }

      return publishFormApi(form);
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["forms"] });

      if (isEditMode && id) {
        await queryClient.invalidateQueries({ queryKey: ["form", id] });
      }

      const publishFormResponse = result as PublishFormResponse;

      if (!isEditMode && publishFormResponse?.formId) {
        navigate(`/forms/${publishFormResponse.formId}/edit`);
      }
    },
  });

  const form = watch();

  const handleAddElement = () => {
    const newIndex = fields.length;

    const newElement: FormElement = {
      id: crypto.randomUUID(),
      title: "field title",
      required: false,
      type: "text-input",
      sortOrder: newIndex,
    };

    append(newElement);
    setActiveElementId(newElement.id);
  };

  const onSubmit = async (data: Form) => {
    if (!data.title?.trim()) {
      return;
    }

    await saveMutation.mutateAsync(data);
  };

  if (isEditMode && isFormLoading) {
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

  if (isEditMode && (isFormError || !fetchedForm)) {
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

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ position: "relative", p: 4, maxWidth: 1200, mx: "auto", width: "100%" }}
    >
      <Card
        sx={{
          mb: 3,
          p: 3,
          borderTop: "8px solid",
          borderTopColor: "primary.main",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Form Title"
                placeholder="Untitled form"
                fullWidth
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Form Description"
                placeholder="Form Description"
                fullWidth
                multiline
                minRows={2}
              />
            )}
          />
        </Box>
      </Card>

      {fields.map((element, index) => (
        <FormElementBuilder
          key={element.id}
          index={index}
          isActive={activeElementId === element.id}
          onFocus={() => setActiveElementId(element.id)}
          control={control}
        />
      ))}

      <FormBuilderToolbar onAddElement={handleAddElement} />

      <Box
        sx={{
          mt: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 1,
        }}
      >
        <Button
          type="submit"
          variant="contained"
          disabled={saveMutation.isPending || !form.title?.trim() || form.elements.length === 0}
        >
          {saveMutation.isPending ? (
            <>
              <CircularProgress size={18} sx={{ mr: 1, color: "inherit" }} />
              {isEditMode ? "Saving..." : "Publishing..."}
            </>
          ) : isEditMode ? (
            "Save Form"
          ) : (
            "Publish Form"
          )}
        </Button>

        {saveMutation.isSuccess && (
          <Typography variant="body2" color="success.main">
            {isEditMode
              ? "Form updated successfully."
              : "Form published successfully."}
          </Typography>
        )}

        {saveMutation.isError && (
          <Typography variant="body2" color="error.main">
            {saveMutation.error instanceof Error
              ? saveMutation.error.message
              : isEditMode
                ? "Failed to update form."
                : "Failed to publish form."}
          </Typography>
        )}

        {!form.title?.trim() && (
          <Typography variant="body2" color="warning.main">
            Form title is required before publishing.
          </Typography>
        )}
      </Box>
    </Box>
  );
};