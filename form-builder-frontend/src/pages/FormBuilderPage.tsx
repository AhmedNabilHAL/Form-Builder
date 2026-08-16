import {
  type FocusEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import PreviewOutlinedIcon from "@mui/icons-material/PreviewOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link as RouterLink,
  useBlocker,
  useNavigate,
  useParams,
} from "react-router-dom";

import type { Form } from "../types/Form";
import type { FormElement, InputType } from "../types/FormInput";
import {
  getFormByIdApi,
  publishFormApi,
  updateFormApi,
} from "../api/form";
import { FormElementBuilder } from "../components/formBuilder/FormElementBuilder";
import { FormElementEditor } from "../components/formBuilder/FormElementEditor";
import { FormElementPreview } from "../components/formBuilder/FormBuilderPreview";
import { ChatPanel } from "../components/formBuilder/chat/ChatPanel";
import {
  clearSessionId,
  sessionKeyForForm,
} from "../components/formBuilder/chat/chatSessionStore";
import { useFormChatAdapter } from "../hooks/useFormChatAdapter";
import { StatusChip } from "../components/ui/StatusChip";
import {
  createEmptyForm,
  createFormElement,
  inputTypeLabel,
  normalizeForm,
  summarizeFormChanges,
  validateForm,
  type FormValidationIssue,
} from "../utils/form";

type PanelTab = "settings" | "assistant";

interface UndoSnapshot {
  form: Form;
  message: string;
}

const publicFormUrl = (id: string) =>
  `${window.location.origin}/forms/${encodeURIComponent(id)}`;

const prepareProposal = (proposal: Form, currentForm: Form): Form => {
  const seenIds = new Set<string>();

  return normalizeForm({
    ...proposal,
    id: currentForm.id,
    elements: (proposal.elements ?? []).map((element, index) => {
      let elementId = element.id?.trim();
      if (!elementId || seenIds.has(elementId)) {
        elementId = crypto.randomUUID();
      }
      seenIds.add(elementId);

      if (element.type === "select-input") {
        return {
          ...element,
          id: elementId,
          sortOrder: index,
          options: element.options.map((option) => ({
            ...option,
            id: option.id?.trim() || crypto.randomUUID(),
          })),
        };
      }

      return {
        ...element,
        id: elementId,
        sortOrder: index,
      };
    }),
  });
};

export const FormBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const wide = useMediaQuery(theme.breakpoints.up("xl"));
  const [draftId] = useState(() => crypto.randomUUID());
  const isEditMode = Boolean(id);

  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("settings");
  const [panelOpen, setPanelOpen] = useState(false);
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishedFormId, setPublishedFormId] = useState<string | null>(
    id ?? null
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const [notice, setNotice] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [assistantProposal, setAssistantProposal] = useState<Form | null>(null);
  const [proposalReviewOpen, setProposalReviewOpen] = useState(false);
  const [chatResetKey, setChatResetKey] = useState(0);
  const [mobileQuestionBaseline, setMobileQuestionBaseline] =
    useState<FormElement | null>(null);
  const [discardQuestionOpen, setDiscardQuestionOpen] = useState(false);
  const allowNavigationRef = useRef(false);
  const keepQuestionButtonRef = useRef<HTMLButtonElement>(null);
  const keepEditingButtonRef = useRef<HTMLButtonElement>(null);
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  const formQuery = useQuery({
    queryKey: ["form", id],
    queryFn: () => getFormByIdApi(id!),
    enabled: isEditMode,
  });

  const methods = useForm<Form>({
    defaultValues: createEmptyForm(),
    mode: "onChange",
  });
  const {
    control,
    getValues,
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty },
  } = methods;

  const {
    append,
    insert,
    move,
    remove,
    replace,
  } = useFieldArray<Form, "elements", "fieldKey">({
    control,
    name: "elements",
    keyName: "fieldKey",
  });

  const form = useWatch({ control }) as Form;
  const elements = useWatch({ control, name: "elements" }) ?? [];
  const validationIssues = useMemo(
    () => (showValidation ? validateForm(form) : []),
    [form, showValidation]
  );
  const resolvedActiveElementId =
    activeElementId ?? elements[0]?.id ?? null;
  const activeIndex = elements.findIndex(
    (element) => element.id === resolvedActiveElementId
  );
  const activeElement = activeIndex >= 0 ? elements[activeIndex] : null;

  const keepMobileFocusVisible = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const target = event.target;
      if (
        !mobile ||
        !(target instanceof HTMLElement) ||
        target.closest("#editor-command-bar, #mobile-editor-actions")
      ) {
        return;
      }

      window.requestAnimationFrame(() => {
        const actionBar = document.getElementById("mobile-editor-actions");
        const commandBar = document.getElementById("editor-command-bar");
        if (!actionBar) return;

        const targetRect = target.getBoundingClientRect();
        const bottomLimit = actionBar.getBoundingClientRect().top - 16;
        const topLimit =
          (commandBar?.getBoundingClientRect().bottom ?? 0) + 16;

        if (targetRect.bottom > bottomLimit) {
          window.scrollBy({
            top: targetRect.bottom - bottomLimit,
            behavior: "instant",
          });
        } else if (targetRect.top < topLimit) {
          window.scrollBy({
            top: targetRect.top - topLimit,
            behavior: "instant",
          });
        }
      });
    },
    [mobile]
  );

  useEffect(() => {
    if (!formQuery.data) return;

    const loadedForm = normalizeForm(formQuery.data);
    reset(loadedForm);
  }, [formQuery.data, reset]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const navigationBlocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !allowNavigationRef.current &&
      isDirty &&
      currentLocation.pathname !== nextLocation.pathname
  );

  const saveMutation = useMutation({
    mutationFn: async (draft: Form): Promise<Form> => {
      const normalized = normalizeForm(draft);

      if (isEditMode && id) {
        return updateFormApi(id, { ...normalized, id });
      }

      const result = await publishFormApi(normalized);
      if (!result.formId) {
        throw new Error("The form was saved, but no public form ID was returned.");
      }

      return { ...normalized, id: result.formId };
    },
    onSuccess: async (savedForm) => {
      reset(savedForm);
      setPublishedFormId(savedForm.id);
      setShowValidation(false);
      setLastSavedAt(new Date());
      setNotice(isEditMode ? "Changes saved." : "Published. The form is ready to share.");
      await queryClient.invalidateQueries({ queryKey: ["forms"] });
      await queryClient.invalidateQueries({
        queryKey: ["form", savedForm.id],
      });

      if (!isEditMode) {
        allowNavigationRef.current = true;
        setShareOpen(true);
        navigate(`/forms/${savedForm.id}/edit`, { replace: true });
        window.setTimeout(() => {
          allowNavigationRef.current = false;
        }, 0);
      }
    },
  });

  const issuesByElement = useMemo(() => {
    const map = new Map<string, string[]>();
    validationIssues.forEach((issue) => {
      if (!issue.elementId) return;
      const existing = map.get(issue.elementId) ?? [];
      map.set(issue.elementId, [...existing, issue.message]);
    });
    return map;
  }, [validationIssues]);

  const getCurrentForm = useCallback(() => getValues(), [getValues]);
  const handleFormProposed = useCallback(
    (proposal: Form) => {
      setAssistantProposal(prepareProposal(proposal, getValues()));
    },
    [getValues]
  );
  const sessionKey = useMemo(
    () => sessionKeyForForm(id, draftId),
    [draftId, id]
  );
  const chatAdapter = useFormChatAdapter({
    getCurrentForm,
    onFormProposed: handleFormProposed,
    sessionKey,
    resetKey: chatResetKey,
  });

  const handleResetChat = useCallback(() => {
    clearSessionId(sessionKey);
    queryClient.removeQueries({ queryKey: ["chat-history"] });
    setAssistantProposal(null);
    setChatResetKey((key) => key + 1);
  }, [queryClient, sessionKey]);

  const openQuestionEditor = (elementId: string) => {
    const element = getValues("elements").find((item) => item.id === elementId);
    setActiveElementId(elementId);
    setPanelTab("settings");
    setPanelOpen(!wide);
    setMobileQuestionBaseline(
      mobile && element ? structuredClone(element) : null
    );
  };

  const openAssistant = () => {
    setPanelTab("assistant");
    setPanelOpen(!wide);
    setMobileQuestionBaseline(null);
  };

  const addElement = (type: InputType) => {
    const element = createFormElement(type, elements.length);
    append(element);
    setAddMenuAnchor(null);
    openQuestionEditor(element.id);
    window.setTimeout(() => {
      document
        .querySelector<HTMLInputElement>(
          `[name="elements.${elements.length}.title"]`
        )
        ?.focus();
    }, 80);
  };

  const snapshotForUndo = (message: string) => {
    setUndoSnapshot({
      form: structuredClone(getValues()),
      message,
    });
  };

  const moveElement = (from: number, to: number) => {
    if (to < 0 || to >= elements.length) return;
    snapshotForUndo("Question moved.");
    move(from, to);
  };

  const duplicateElement = (index: number) => {
    const source = getValues(`elements.${index}`);
    const duplicate: FormElement =
      source.type === "select-input"
        ? {
            ...structuredClone(source),
            id: crypto.randomUUID(),
            title: source.title ? `${source.title} copy` : "",
            sortOrder: index + 1,
            options: source.options.map((option) => ({
              ...option,
              id: crypto.randomUUID(),
            })),
          }
        : {
            ...structuredClone(source),
            id: crypto.randomUUID(),
            title: source.title ? `${source.title} copy` : "",
            sortOrder: index + 1,
          };

    insert(index + 1, duplicate);
    openQuestionEditor(duplicate.id);
    setNotice("Question duplicated.");
  };

  const deleteElement = (elementId: string) => {
    const index = getValues("elements").findIndex(
      (element) => element.id === elementId
    );
    if (index < 0) return;

    snapshotForUndo("Question deleted.");
    remove(index);
    const remaining = getValues("elements");
    setActiveElementId(
      remaining[Math.min(index, remaining.length - 1)]?.id ?? null
    );
    setPanelOpen(false);
    setDeleteTargetId(null);
  };

  const requestDeleteElement = (elementId: string) => {
    const element = getValues("elements").find((item) => item.id === elementId);
    if (!element) return;

    const hasContent =
      Boolean(element.title.trim()) ||
      element.required ||
      (element.type === "select-input" &&
        element.options.some((option) => option.value.trim()));

    if (hasContent) {
      setDeleteTargetId(elementId);
    } else {
      deleteElement(elementId);
    }
  };

  const undoLastChange = () => {
    if (!undoSnapshot) return;
    reset(undoSnapshot.form, { keepDefaultValues: true });
    replace(undoSnapshot.form.elements);
    setActiveElementId(undoSnapshot.form.elements[0]?.id ?? null);
    setUndoSnapshot(null);
    setNotice("Change undone.");
  };

  const focusIssue = (issue: FormValidationIssue) => {
    if (issue.id === "form-title") {
      document.getElementById("form-title")?.focus();
      return;
    }

    if (!issue.elementId) {
      document.getElementById("add-question-button")?.focus();
      return;
    }

    const index = getValues("elements").findIndex(
      (element) => element.id === issue.elementId
    );
    if (index < 0) return;

    openQuestionEditor(issue.elementId);
    window.setTimeout(() => {
      const selector = issue.id.includes("options")
        ? `[name="elements.${index}.options.0.value"]`
        : `[name="elements.${index}.title"]`;
      document.querySelector<HTMLInputElement>(selector)?.focus();
    }, 100);
  };

  const validateAndSave = handleSubmit(async (draft) => {
    const issues = validateForm(draft);
    setShowValidation(issues.length > 0);

    if (issues.length > 0) {
      window.requestAnimationFrame(() =>
        document.getElementById("editor-validation-summary")?.focus()
      );
      return;
    }

    await saveMutation.mutateAsync(draft);
  });

  const applyAssistantProposal = () => {
    if (!assistantProposal) return;
    snapshotForUndo("Assistant changes applied.");
    reset(assistantProposal, { keepDefaultValues: true });
    replace(assistantProposal.elements);
    setActiveElementId(assistantProposal.elements[0]?.id ?? null);
    setAssistantProposal(null);
    setProposalReviewOpen(false);
  };

  const closeOverlayPanel = (commitQuestion: boolean) => {
    if (
      mobile &&
      panelTab === "settings" &&
      mobileQuestionBaseline &&
      activeElement &&
      !commitQuestion &&
      JSON.stringify(mobileQuestionBaseline) !== JSON.stringify(activeElement)
    ) {
      setDiscardQuestionOpen(true);
      return;
    }

    setPanelOpen(false);
    setMobileQuestionBaseline(null);
  };

  const discardMobileQuestionChanges = () => {
    if (mobileQuestionBaseline && activeIndex >= 0) {
      setValue(
        `elements.${activeIndex}`,
        structuredClone(mobileQuestionBaseline),
        { shouldDirty: true }
      );
    }
    setDiscardQuestionOpen(false);
    setPanelOpen(false);
    setMobileQuestionBaseline(null);
  };

  const copyPublicLink = async () => {
    if (!publishedFormId) return;
    try {
      await navigator.clipboard.writeText(publicFormUrl(publishedFormId));
      setNotice("Public link copied.");
    } catch {
      setNotice("Copy failed. Open the form and copy the browser address.");
    }
  };

  const saveStatus = (() => {
    if (saveMutation.isPending) {
      return isEditMode ? "Saving…" : "Publishing…";
    }
    if (saveMutation.isError) return "Save failed";
    if (isDirty) return "Unsaved changes";
    if (lastSavedAt) {
      return `Saved at ${new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(lastSavedAt)}`;
    }
    return isEditMode ? "Saved" : "Draft not published";
  })();

  const proposalSummary = assistantProposal
    ? summarizeFormChanges(getValues(), assistantProposal)
    : [];

  const renderContextPanel = (overlay: boolean) => (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      {overlay && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            minHeight: 56,
            px: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <IconButton
            aria-label={
              panelTab === "settings" ? "Back to questions" : "Close assistant"
            }
            onClick={() => closeOverlayPanel(false)}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography component="h2" variant="h4" sx={{ flex: 1 }} noWrap>
            {panelTab === "assistant"
              ? "Assistant"
              : activeIndex >= 0
                ? `Question ${activeIndex + 1}`
                : "Question settings"}
          </Typography>
          {panelTab === "settings" && (
            <Button onClick={() => closeOverlayPanel(true)}>Done</Button>
          )}
        </Stack>
      )}

      <Tabs
        value={panelTab}
        onChange={(_, value: PanelTab) => setPanelTab(value)}
        aria-label="Editor tools"
        variant="fullWidth"
        sx={{ borderBottom: "1px solid", borderColor: "divider", flex: "0 0 auto" }}
      >
        <Tab value="settings" label="Settings" />
        <Tab
          value="assistant"
          label="Assistant"
          icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
          iconPosition="start"
        />
      </Tabs>

      {panelTab === "settings" ? (
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 2.5 }}>
          {activeIndex >= 0 && activeElement ? (
            <Stack spacing={3}>
              <Box>
                <Typography component="h2" variant="h3">
                  Edit question
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Changes stay in this draft until you save or publish.
                </Typography>
              </Box>
              <FormElementEditor
                index={activeIndex}
                issues={issuesByElement.get(activeElement.id) ?? []}
              />
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="error.main">
                  Remove question
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
                  You can undo a deletion for eight seconds.
                </Typography>
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={() => requestDeleteElement(activeElement.id)}
                >
                  Delete question
                </Button>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={1.5} alignItems="flex-start" sx={{ py: 3 }}>
              <EditOutlinedIcon color="primary" />
              <Typography component="h2" variant="h3">
                Select a question
              </Typography>
              <Typography color="text.secondary">
                Choose a question from the outline or form canvas to edit its
                wording, type, choices, and required state.
              </Typography>
              <Button
                type="button"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={(event) => setAddMenuAnchor(event.currentTarget)}
              >
                Add question
              </Button>
            </Stack>
          )}
        </Box>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <ChatPanel
            key={chatResetKey}
            onClose={() => setPanelOpen(false)}
            onReset={handleResetChat}
            adapter={chatAdapter}
            sessionKey={sessionKey}
            formTitle={form.title}
            status={isEditMode ? "Live" : "Draft"}
            proposalSummary={proposalSummary}
            onReviewProposal={() => setProposalReviewOpen(true)}
            onApplyProposal={applyAssistantProposal}
            onDismissProposal={() => setAssistantProposal(null)}
            showClose={false}
          />
        </Box>
      )}
    </Box>
  );

  if (isEditMode && formQuery.isLoading) {
    return (
      <Box sx={{ width: "100%" }}>
        <Typography component="h1" className="sr-only" tabIndex={-1}>
          Loading form
        </Typography>
        <Card sx={{ p: { xs: 2, md: 3 } }} aria-label="Loading form editor">
          <Stack spacing={2}>
            <Skeleton width="42%" height={42} />
            <Skeleton width="68%" />
            <Skeleton variant="rounded" height={132} />
            <Skeleton variant="rounded" height={180} />
          </Stack>
        </Card>
      </Box>
    );
  }

  if (isEditMode && (formQuery.isError || !formQuery.data)) {
    return (
      <Box sx={{ maxWidth: 760 }}>
        <Typography component="h1" variant="h1" tabIndex={-1}>
          Form could not be loaded
        </Typography>
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => formQuery.refetch()}>
              Retry
            </Button>
          }
          sx={{ mt: 2 }}
        >
          {formQuery.error instanceof Error
            ? formQuery.error.message
            : "Check your connection and try again."}
        </Alert>
        <Button
          component={RouterLink}
          to="/"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to forms
        </Button>
      </Box>
    );
  }

  return (
    <FormProvider {...methods}>
      <Box
        onFocusCapture={keepMobileFocusVisible}
        sx={{
          width: "100%",
          minWidth: 0,
          pb: { xs: "152px", md: 0 },
          "& :is(a, button, input, textarea, select, [tabindex]):not([tabindex='-1'])":
            {
              scrollMarginBlockStart: { xs: "136px", md: "96px" },
              scrollMarginBlockEnd: { xs: "168px", md: "24px" },
            },
        }}
      >
        <Card
          id="editor-command-bar"
          component="header"
          sx={{
            position: "sticky",
            top: { xs: 64, md: 72 },
            zIndex: 5,
            borderRadius: 0,
            boxShadow: "0 1px 2px rgba(23, 32, 51, 0.08)",
            mb: 3,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ minHeight: 64, px: { xs: 1, sm: 2 } }}
          >
            <Tooltip title="Back to forms">
              <IconButton
                component={RouterLink}
                to="/"
                aria-label="Back to forms"
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="h1" variant="h4" noWrap tabIndex={-1}>
                {form.title.trim() ||
                  (isEditMode ? "Edit form" : "Create a form")}
              </Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                aria-live="polite"
              >
                {saveMutation.isError ? (
                  <ErrorOutlineIcon color="error" sx={{ fontSize: 16 }} />
                ) : !isDirty && isEditMode ? (
                  <CheckCircleOutlineIcon color="success" sx={{ fontSize: 16 }} />
                ) : null}
                <Typography
                  variant="caption"
                  color={saveMutation.isError ? "error.main" : "text.secondary"}
                  noWrap
                >
                  {saveStatus}
                </Typography>
              </Stack>
            </Box>

            <StatusChip status={isEditMode ? "Live" : "Draft"} />

            <Stack
              direction="row"
              spacing={1}
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              <Button
                type="button"
                variant="outlined"
                startIcon={<PreviewOutlinedIcon />}
                onClick={() => setPreviewOpen(true)}
              >
                Preview
              </Button>
              <Button
                type="button"
                variant="outlined"
                startIcon={<AutoAwesomeOutlinedIcon />}
                onClick={openAssistant}
              >
                Assistant
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<ShareOutlinedIcon />}
                  onClick={() => setShareOpen(true)}
                >
                  Share
                </Button>
              )}
              <Button
                type="button"
                variant="contained"
                startIcon={
                  saveMutation.isPending ? (
                    <CircularProgress size={17} color="inherit" />
                  ) : isEditMode ? (
                    <SaveOutlinedIcon />
                  ) : (
                    <PublishOutlinedIcon />
                  )
                }
                disabled={saveMutation.isPending || (isEditMode && !isDirty)}
                onClick={() => void validateAndSave()}
              >
                {saveMutation.isPending
                  ? isEditMode
                    ? "Saving…"
                    : "Publishing…"
                  : isEditMode
                    ? "Save changes"
                    : "Publish"}
              </Button>
            </Stack>
          </Stack>
        </Card>

        {saveMutation.isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void validateAndSave()}>
                Retry
              </Button>
            }
            sx={{ mb: 3 }}
          >
            <Typography fontWeight={700}>Save failed</Typography>
            Your changes are still in this browser. Check your connection and try
            again.
          </Alert>
        )}

        {validationIssues.length > 0 && (
          <Alert
            severity="error"
            id="editor-validation-summary"
            tabIndex={-1}
            role="alert"
            sx={{ mb: 3, alignItems: "flex-start" }}
          >
            <Typography fontWeight={700}>
              Fix {validationIssues.length}{" "}
              {validationIssues.length === 1 ? "item" : "items"} before{" "}
              {isEditMode ? "saving" : "publishing"}
            </Typography>
            <List dense disablePadding sx={{ mt: 0.5 }}>
              {validationIssues.map((issue) => (
                <ListItemButton
                  key={issue.id}
                  onClick={() => focusIssue(issue)}
                  sx={{ py: 0.25, px: 0, minHeight: 36 }}
                >
                  <ListItemIcon sx={{ minWidth: 28, color: "error.main" }}>
                    <ReportProblemOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={issue.message} />
                </ListItemButton>
              ))}
            </List>
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              lg: "200px minmax(0, 1fr)",
              xl: "224px minmax(560px, 1fr) 336px",
            },
            gap: { xs: 2, lg: 3 },
            alignItems: "start",
          }}
        >
          <Card
            component="nav"
            aria-label="Form questions"
            sx={{
              display: { xs: "none", lg: "block" },
              position: "sticky",
              top: 160,
              maxHeight: "calc(100vh - 184px)",
              overflowY: "auto",
              p: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ px: 1, py: 0.75 }}>
              Questions
            </Typography>
            {elements.length > 0 ? (
              <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0 }}>
                {elements.map((element, index) => {
                  const active = element.id === resolvedActiveElementId;
                  const invalid = issuesByElement.has(element.id);
                  return (
                    <Box component="li" key={element.id}>
                      <ListItemButton
                        data-question-outline-button="true"
                        selected={active}
                        onClick={() => openQuestionEditor(element.id)}
                        onKeyDown={(event) => {
                          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                            return;
                          }
                          event.preventDefault();
                          const nextIndex =
                            event.key === "ArrowDown"
                              ? Math.min(index + 1, elements.length - 1)
                              : Math.max(index - 1, 0);
                          const nextId = elements[nextIndex]?.id;
                          if (!nextId) return;

                          const nextButton = event.currentTarget
                            .closest("ol")
                            ?.querySelectorAll<HTMLElement>(
                              '[data-question-outline-button="true"]'
                            )[nextIndex];

                          openQuestionEditor(nextId);
                          nextButton?.focus();
                        }}
                        sx={{
                          minHeight: 44,
                          borderRadius: 1,
                          borderInlineStart: "2px solid",
                          borderInlineStartColor: active
                            ? "primary.main"
                            : "transparent",
                        }}
                      >
                        <Typography
                          aria-hidden="true"
                          sx={{
                            width: 32,
                            flex: "0 0 32px",
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: "0.75rem",
                            color: invalid ? "error.main" : "text.secondary",
                          }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </Typography>
                        <ListItemText
                          primary={element.title.trim() || "Untitled question"}
                          slotProps={{
                            primary: {
                              noWrap: true,
                              title:
                                element.title.trim() || "Untitled question",
                              variant: "body2",
                              fontWeight: active ? 700 : 500,
                            },
                          }}
                        />
                        {invalid && (
                          <ReportProblemOutlinedIcon
                            aria-label="Needs attention"
                            color="error"
                            sx={{ fontSize: 18, ml: 0.5 }}
                          />
                        )}
                      </ListItemButton>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 2 }}>
                Add your first question.
              </Typography>
            )}
            <Button
              id="add-question-button"
              type="button"
              variant="text"
              startIcon={<AddIcon />}
              onClick={(event) => setAddMenuAnchor(event.currentTarget)}
              fullWidth
              sx={{ justifyContent: "flex-start", mt: 1 }}
            >
              Add question
            </Button>
          </Card>

          <Box
            component="form"
            id="form-editor"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void validateAndSave();
            }}
            sx={{
              minWidth: 0,
              pb: { xs: 2, md: 4 },
            }}
          >
            <Card sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography component="h2" variant="h2">
                    Form details
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Give respondents a clear title and a short explanation.
                  </Typography>
                </Box>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="form-title"
                      label="Form title"
                      placeholder="Enter a form title"
                      error={validationIssues.some(
                        (issue) => issue.id === "form-title"
                      )}
                      autoComplete="off"
                    />
                  )}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description (optional)"
                      placeholder="Explain what this form is for"
                      multiline
                      minRows={3}
                    />
                  )}
                />
              </Stack>
            </Card>

            {mobile ? (
              <Stack spacing={1.5}>
                {elements.length === 0 ? (
                  <Card sx={{ p: 3, textAlign: "center" }}>
                    <Typography component="h2" variant="h3">
                      Add your first question
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                      Start with a short answer, multiple choice, or file upload.
                    </Typography>
                    <Button
                      type="button"
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={(event) => setAddMenuAnchor(event.currentTarget)}
                    >
                      Add question
                    </Button>
                  </Card>
                ) : (
                  elements.map((element, index) => (
                    <Card key={element.id} sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          aria-hidden="true"
                          sx={{
                            width: 32,
                            height: 32,
                            flex: "0 0 auto",
                            display: "grid",
                            placeItems: "center",
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: issuesByElement.has(element.id)
                              ? "error.main"
                              : "primary.main",
                            color: issuesByElement.has(element.id)
                              ? "error.main"
                              : "primary.main",
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: "0.75rem",
                          }}
                        >
                          {issuesByElement.has(element.id) ? (
                            <ReportProblemOutlinedIcon sx={{ fontSize: 17 }} />
                          ) : (
                            index + 1
                          )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={700} sx={{ overflowWrap: "anywhere" }}>
                            {element.title.trim() || "Untitled question"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {inputTypeLabel(element.type)}
                            {element.required ? " · Required" : ""}
                          </Typography>
                        </Box>
                        <Button
                          type="button"
                          variant="text"
                          onClick={() => openQuestionEditor(element.id)}
                        >
                          Edit
                        </Button>
                      </Stack>
                    </Card>
                  ))
                )}
              </Stack>
            ) : (
              <Stack spacing={0}>
                {elements.map((element, index) => (
                  <FormElementBuilder
                    key={element.id}
                    index={index}
                    isActive={resolvedActiveElementId === element.id}
                    issues={issuesByElement.get(element.id)}
                    onEdit={() => openQuestionEditor(element.id)}
                    onDuplicate={() => duplicateElement(index)}
                    onMoveUp={() => moveElement(index, index - 1)}
                    onMoveDown={() => moveElement(index, index + 1)}
                    onDelete={() => requestDeleteElement(element.id)}
                    canMoveUp={index > 0}
                    canMoveDown={index < elements.length - 1}
                    isLast={index === elements.length - 1}
                  />
                ))}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "28px minmax(0, 1fr)",
                    gap: 2,
                    mt: elements.length > 0 ? 2 : 0,
                  }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 32,
                      height: 32,
                      ml: "-2px",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "50%",
                      border: "1px solid",
                      borderColor: "border.control",
                      bgcolor: "background.paper",
                      color: "primary.main",
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </Box>
                  <Button
                    id="add-question-button"
                    type="button"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={(event) => setAddMenuAnchor(event.currentTarget)}
                    sx={{ justifySelf: "start" }}
                  >
                    Add question
                  </Button>
                </Box>
              </Stack>
            )}
          </Box>

          {wide && (
            <Card
              component="aside"
              aria-label="Question settings and assistant"
              sx={{
                position: "sticky",
                top: 160,
                height: "calc(100vh - 184px)",
                minHeight: 520,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(23, 32, 51, 0.10)",
              }}
            >
              {renderContextPanel(false)}
            </Card>
          )}
        </Box>

        <Card
          id="mobile-editor-actions"
          sx={{
            display: { xs: "block", md: "none" },
            position: "fixed",
            insetInline: 0,
            bottom: 0,
            zIndex: (muiTheme) => muiTheme.zIndex.appBar + 2,
            p: 1.5,
            pb: "calc(12px + env(safe-area-inset-bottom))",
            borderRadius: 0,
            borderInline: 0,
            borderBottom: 0,
            boxShadow: "0 -4px 18px rgba(23, 32, 51, 0.10)",
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={(event) => setAddMenuAnchor(event.currentTarget)}
                sx={{ flex: 1, minWidth: 0 }}
              >
                Add question
              </Button>
              <Button
                type="button"
                variant="outlined"
                startIcon={<PreviewOutlinedIcon />}
                onClick={() => setPreviewOpen(true)}
                sx={{ flex: 1, minWidth: 0 }}
              >
                Preview
              </Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<AutoAwesomeOutlinedIcon />}
                onClick={openAssistant}
                sx={{ flex: 1, minWidth: 0 }}
              >
                Assistant
              </Button>
              <Button
                type="button"
                variant="contained"
                startIcon={
                  saveMutation.isPending ? (
                    <CircularProgress size={17} color="inherit" />
                  ) : isEditMode ? (
                    <SaveOutlinedIcon />
                  ) : (
                    <PublishOutlinedIcon />
                  )
                }
                disabled={saveMutation.isPending || (isEditMode && !isDirty)}
                onClick={() => void validateAndSave()}
                sx={{ flex: 1, minWidth: 0 }}
              >
                {saveMutation.isPending
                  ? isEditMode
                    ? "Saving…"
                    : "Publishing…"
                  : isEditMode
                    ? "Save changes"
                    : "Publish"}
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Menu
          anchorEl={addMenuAnchor}
          open={Boolean(addMenuAnchor)}
          onClose={() => setAddMenuAnchor(null)}
          slotProps={{ paper: { sx: { minWidth: 236 } } }}
        >
          <MenuItem onClick={() => addElement("text-input")}>
            <ListItemText
              primary="Short answer"
              secondary="A single line of text"
            />
          </MenuItem>
          <MenuItem onClick={() => addElement("select-input")}>
            <ListItemText
              primary="Multiple choice"
              secondary="One answer from visible options"
            />
          </MenuItem>
          <MenuItem onClick={() => addElement("file-upload")}>
            <ListItemText
              primary="File upload"
              secondary="PNG, JPG, or PDF up to 10 MB"
            />
          </MenuItem>
        </Menu>

        {!wide && (
          <Drawer
            anchor="right"
            open={panelOpen}
            onClose={() => closeOverlayPanel(false)}
            slotProps={{
              paper: {
                sx: {
                  width: mobile ? "100%" : 420,
                  maxWidth: "100%",
                },
              },
            }}
          >
            {renderContextPanel(true)}
          </Drawer>
        )}

        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fullScreen={mobile}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle sx={{ pr: 7 }}>
            Preview
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Responses entered here will not be saved.
            </Typography>
            <IconButton
              aria-label="Close preview"
              onClick={() => setPreviewOpen(false)}
              sx={{ position: "absolute", top: 12, right: 12 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: "background.default" }}>
            <Card sx={{ maxWidth: 720, mx: "auto", p: { xs: 2, md: 4 } }}>
              <Typography component="h2" variant="h1">
                {form.title.trim() || "Untitled form"}
              </Typography>
              {form.description.trim() && (
                <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
                  {form.description}
                </Typography>
              )}
              <Stack spacing={3.5} sx={{ mt: 4 }}>
                {elements.map((element, index) => (
                  <Box key={element.id}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="baseline"
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mb: 1 }}
                    >
                      <Typography fontWeight={700}>
                        {element.title.trim() || `Question ${index + 1}`}
                      </Typography>
                      {element.required && (
                        <Typography variant="caption" color="error.main">
                          Required
                        </Typography>
                      )}
                    </Stack>
                    <FormElementPreview index={index} control={control} />
                  </Box>
                ))}
              </Stack>
            </Card>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Back to editor</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          fullScreen={mobile}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Publish and share</DialogTitle>
          <DialogContent>
            {publishedFormId ? (
              <Stack spacing={3}>
                <Alert severity="success">
                  <Typography fontWeight={700}>Form is live</Typography>
                  Anyone with the public link can open it and submit a response.
                </Alert>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Public link
                  </Typography>
                  <TextField
                    value={publicFormUrl(publishedFormId)}
                    fullWidth
                    slotProps={{ input: { readOnly: true } }}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      variant="contained"
                      startIcon={<ContentCopyOutlinedIcon />}
                      onClick={() => void copyPublicLink()}
                    >
                      Copy link
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<OpenInNewOutlinedIcon />}
                      onClick={() =>
                        window.open(
                          `/forms/${publishedFormId}`,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      Open form
                    </Button>
                  </Stack>
                </Box>
                <Divider />
                <Stack spacing={1.5}>
                  <Typography component="h3" variant="h4">
                    Current sharing behavior
                  </Typography>
                  <CapabilityRow
                    title="Who can open it"
                    detail="Anyone with the link"
                  />
                  <CapabilityRow
                    title="Accepting responses"
                    detail="Yes"
                  />
                  <CapabilityRow title="Sign-in required" detail="No" />
                  <CapabilityRow
                    title="Another response"
                    detail="Allowed"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Closing responses, sign-in rules, and repeat-response limits
                    are not available yet.
                  </Typography>
                </Stack>
              </Stack>
            ) : (
              <Alert severity="info">
                Publish this draft before copying a public link.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareOpen(false)}>Done</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={proposalReviewOpen && Boolean(assistantProposal)}
          onClose={() => setProposalReviewOpen(false)}
          fullScreen={mobile}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Review suggested changes</DialogTitle>
          <DialogContent dividers>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="stretch"
            >
              <ProposalColumn title="Current draft" form={getValues()} />
              <ProposalColumn
                title="Assistant proposal"
                form={assistantProposal ?? getValues()}
                assistant
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProposalReviewOpen(false)}>
              Keep reviewing
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={applyAssistantProposal}
            >
              Apply changes
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={Boolean(deleteTargetId)}
          onClose={() => setDeleteTargetId(null)}
          fullWidth
          maxWidth="sm"
          slotProps={{
            transition: {
              onEntered: () => keepQuestionButtonRef.current?.focus(),
            },
          }}
        >
          <DialogTitle>Delete this question?</DialogTitle>
          <DialogContent>
            <Typography>
              The question and its current settings will be removed from this
              draft. You can undo immediately after deleting it.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              ref={keepQuestionButtonRef}
              autoFocus
              onClick={() => setDeleteTargetId(null)}
            >
              Keep question
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (deleteTargetId) deleteElement(deleteTargetId);
              }}
            >
              Delete question
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={discardQuestionOpen}
          onClose={() => setDiscardQuestionOpen(false)}
          fullWidth
          maxWidth="sm"
          slotProps={{
            transition: {
              onEntered: () => keepEditingButtonRef.current?.focus(),
            },
          }}
        >
          <DialogTitle>Discard question changes?</DialogTitle>
          <DialogContent>
            <Typography>
              Changes made since you opened this question will be removed.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              ref={keepEditingButtonRef}
              autoFocus
              onClick={() => setDiscardQuestionOpen(false)}
            >
              Keep editing
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={discardMobileQuestionChanges}
            >
              Discard changes
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={navigationBlocker.state === "blocked"}
          onClose={() => navigationBlocker.reset?.()}
          fullWidth
          maxWidth="sm"
          slotProps={{
            transition: {
              onEntered: () => stayButtonRef.current?.focus(),
            },
          }}
        >
          <DialogTitle>Leave without saving?</DialogTitle>
          <DialogContent>
            <Typography>Your latest changes have not been saved.</Typography>
          </DialogContent>
          <DialogActions>
            <Button
              ref={stayButtonRef}
              autoFocus
              onClick={() => navigationBlocker.reset?.()}
            >
              Stay
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                allowNavigationRef.current = true;
                navigationBlocker.proceed?.();
              }}
            >
              Leave without saving
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(undoSnapshot)}
          autoHideDuration={8000}
          onClose={(_, reason) => {
            if (reason !== "clickaway") setUndoSnapshot(null);
          }}
          message={undoSnapshot?.message}
          action={
            <>
              <Button color="inherit" onClick={undoLastChange}>
                Undo
              </Button>
              <IconButton
                color="inherit"
                aria-label="Dismiss"
                onClick={() => setUndoSnapshot(null)}
              >
                <CloseIcon />
              </IconButton>
            </>
          }
        />
        <Snackbar
          open={Boolean(notice)}
          autoHideDuration={5000}
          onClose={() => setNotice("")}
          message={notice}
        />
      </Box>
    </FormProvider>
  );
};

const CapabilityRow = ({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) => (
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Typography color="text.secondary">{title}</Typography>
    <Typography fontWeight={700} textAlign="right">
      {detail}
    </Typography>
  </Stack>
);

const ProposalColumn = ({
  title,
  form,
  assistant = false,
}: {
  title: string;
  form: Form;
  assistant?: boolean;
}) => (
  <Card
    sx={{
      flex: 1,
      p: 2,
      bgcolor: assistant ? "secondary.light" : "background.paper",
      borderColor: assistant ? "secondary.main" : "divider",
    }}
  >
    <Typography component="h3" variant="h4">
      {title}
    </Typography>
    {assistant && (
      <Typography variant="caption" color="secondary.dark">
        Generated by AI
      </Typography>
    )}
    <Typography fontWeight={700} sx={{ mt: 2 }}>
      {form.title.trim() || "Untitled form"}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
      {form.description.trim() || "No description"}
    </Typography>
    <List component="ol" sx={{ pl: 2.5, mt: 1.5 }}>
      {form.elements.map((element) => (
        <Box component="li" key={element.id} sx={{ pl: 0.5, mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {element.title.trim() || "Untitled question"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {inputTypeLabel(element.type)}
            {element.required ? " · Required" : ""}
          </Typography>
        </Box>
      ))}
    </List>
  </Card>
);
