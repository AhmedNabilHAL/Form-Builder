import { useCallback, useEffect, useState } from "react";
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
import { createPortal } from "react-dom";

import { ChatPanel } from "../components/formBuilder/chat/ChatPanel";
import {
  clearSessionId,
  sessionKeyForForm,
} from "../components/formBuilder/chat/chatSessionStore";
import { ChatToggleButton } from "../components/formBuilder/chat/ChatToggleButton";
import { useChatDock } from "../components/layout/useChatDock";
import { useFormChatAdapter } from "../hooks/useFormChatAdapter";
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
  const [chatResetKey, setChatResetKey] = useState(0);

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

  const { control, handleSubmit, watch, reset, getValues } = useForm<Form>({
    defaultValues: emptyForm,
    mode: "onSubmit",
  });

  const { fields, append } = useFieldArray({
    control,
    name: "elements",
  });

  const dock = useChatDock();
  const closeDock = dock.close;

  // Close the dock when leaving the builder so it never lingers on other pages.
  useEffect(() => () => closeDock(), [closeDock]);

  const sessionKey = sessionKeyForForm(id);

  const getCurrentForm = useCallback(() => getValues(), [getValues]);

  const handleFormGenerated = useCallback(
    (generatedForm: Form) => {
      reset(generatedForm);
      setActiveElementId(generatedForm.elements[0]?.id ?? null);
    },
    [reset]
  );

  const chatAdapter = useFormChatAdapter({
    getCurrentForm,
    onFormGenerated: handleFormGenerated,
    sessionKey,
    resetKey: chatResetKey,
  });

  const handleResetChat = useCallback(() => {
    clearSessionId(sessionKey);
    queryClient.removeQueries({ queryKey: ["chat-history"] });
    setChatResetKey((key) => key + 1);
  }, [sessionKey, queryClient]);

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
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isEditMode && (isFormError || !fetchedForm)) {
    return (
      <Box sx={{ width: "100%" }}>
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
      sx={{ position: "relative", width: "100%" }}
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

      <FormBuilderToolbar
        onAddElement={handleAddElement}
        rightOffset={dock.isOpen ? dock.width + 32 : 32}
        chatOpen={dock.isOpen}
      />

      <ChatToggleButton onClick={dock.open} hidden={dock.isOpen} />

      {dock.isOpen && dock.portalNode
        ? createPortal(
          <ChatPanel
            key={chatResetKey}
            onClose={dock.close}
            onReset={handleResetChat}
            adapter={chatAdapter}
            sessionKey={sessionKey}
          />,
          dock.portalNode
        )
        : null}

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