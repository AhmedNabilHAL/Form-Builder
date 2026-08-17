import {
  type FocusEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
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
  useLocation,
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
import { FormElementPreview } from "../components/formBuilder/FormBuilderPreview";
import { ChatPanel } from "../components/formBuilder/chat/ChatPanel";
import {
  clearSessionId,
  sessionKeyForForm,
} from "../components/formBuilder/chat/chatSessionStore";
import { useFormChatAdapter } from "../hooks/useFormChatAdapter";
import { StatusChip } from "../components/ui/StatusChip";
import { useChatDock } from "../components/layout/useChatDock";
import {
  createEmptyForm,
  createFormElement,
  inputTypeLabel,
  normalizeForm,
  prepareFormProposal,
  summarizeFormChanges,
  validateForm,
  type FormValidationIssue,
} from "../utils/form";

interface UndoSnapshot {
  form: Form;
  message: string;
}

interface FormBuilderLocationState {
  assistantDraft?: Form;
  assistantSessionKey?: string;
}

const publicFormUrl = (id: string) =>
  `${window.location.origin}/forms/${encodeURIComponent(id)}`;

export const FormBuilderPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const chatDock = useChatDock();
  const assistantMode = chatDock.isOpen;
  const isEditMode = Boolean(id);
  const routeState = location.state as FormBuilderLocationState | null;
  const [inheritedAssistantSessionKey] = useState(
    () => routeState?.assistantSessionKey
  );
  const [draftId] = useState(() => crypto.randomUUID());
  const [initialForm] = useState<Form>(() =>
    !isEditMode && routeState?.assistantDraft
      ? prepareFormProposal(routeState.assistantDraft, createEmptyForm())
      : createEmptyForm()
  );

  const [activeElementId, setActiveElementId] = useState<string | null>(
    initialForm.elements[0]?.id ?? null
  );
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [addMenuAnchor, setAddMenuAnchor] = useState<HTMLElement | null>(null);
  const [toolsMenuAnchor, setToolsMenuAnchor] = useState<HTMLElement | null>(
    null
  );
  const [showValidation, setShowValidation] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishedFormId, setPublishedFormId] = useState<string | null>(
    id ?? null
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const [notice, setNotice] = useState(
    !isEditMode && routeState?.assistantDraft
      ? "Assistant draft opened. Review it before publishing."
      : ""
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [assistantProposal, setAssistantProposal] = useState<Form | null>(null);
  const [proposalReviewOpen, setProposalReviewOpen] = useState(false);
  const [chatResetKey, setChatResetKey] = useState(0);
  const allowNavigationRef = useRef(false);
  const questionCardRefs = useRef(new Map<string, HTMLDivElement>());
  const keepQuestionButtonRef = useRef<HTMLButtonElement>(null);
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  const formQuery = useQuery({
    queryKey: ["form", id],
    queryFn: () => getFormByIdApi(id!),
    enabled: isEditMode,
  });

  const methods = useForm<Form>({
    defaultValues: initialForm,
    mode: "onChange",
  });
  const {
    control,
    getValues,
    handleSubmit,
    reset,
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
  const watchedElements = useWatch({ control, name: "elements" });
  const elements = useMemo(() => watchedElements ?? [], [watchedElements]);
  const elementIds = useMemo(
    () => elements.map((element) => element.id).join("|"),
    [elements]
  );
  const validationIssues = useMemo(
    () => (showValidation ? validateForm(form) : []),
    [form, showValidation]
  );
  const resolvedActiveElementId =
    activeElementId ?? elements[0]?.id ?? null;

  const registerQuestionCard = useCallback(
    (elementId: string, node: HTMLDivElement | null) => {
      if (node) {
        questionCardRefs.current.set(elementId, node);
      } else {
        questionCardRefs.current.delete(elementId);
      }
    },
    []
  );

  const scrollToQuestion = useCallback((elementId: string) => {
    setActiveElementId(elementId);
    questionCardRefs.current.get(elementId)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

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
    if (typeof IntersectionObserver === "undefined" || !elementIds) return;

    const updateActiveQuestion = () => {
      const anchorY = Math.min(window.innerHeight * 0.42, 360);
      let bestId: string | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      questionCardRefs.current.forEach((node, elementId) => {
        const rect = node.getBoundingClientRect();
        if (rect.bottom <= 102 || rect.top >= window.innerHeight) return;

        const distance =
          rect.top <= anchorY && rect.bottom >= anchorY
            ? 0
            : Math.min(
                Math.abs(rect.top - anchorY),
                Math.abs(rect.bottom - anchorY)
              );

        if (distance < bestDistance) {
          bestId = elementId;
          bestDistance = distance;
        }
      });

      if (bestId) {
        setActiveElementId(bestId);
      }
    };

    const observer = new IntersectionObserver(
      updateActiveQuestion,
      {
        root: null,
        rootMargin: "-102px 0px -12% 0px",
        threshold: [0, 0.2, 0.5, 0.8, 1],
      }
    );

    questionCardRefs.current.forEach((node) => observer.observe(node));
    updateActiveQuestion();
    return () => observer.disconnect();
  }, [editingElementId, elementIds]);

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
      setAssistantProposal(prepareFormProposal(proposal, getValues()));
    },
    [getValues]
  );
  const sessionKey = useMemo(
    () =>
      inheritedAssistantSessionKey?.trim() ||
      sessionKeyForForm(id, draftId),
    [draftId, id, inheritedAssistantSessionKey]
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
    setActiveElementId(elementId);
    setEditingElementId(elementId);
    window.requestAnimationFrame(() => scrollToQuestion(elementId));
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
    if (editingElementId === elementId) {
      setEditingElementId(null);
    }
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
    setEditingElementId(null);
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
    setEditingElementId(null);
    setAssistantProposal(null);
    setProposalReviewOpen(false);
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
          pb: { xs: "88px", md: 0 },
          "& :is(a, button, input, textarea, select, [tabindex]):not([tabindex='-1'])":
            {
              scrollMarginBlockStart: { xs: "132px", md: "96px" },
              scrollMarginBlockEnd: { xs: "120px", md: "24px" },
            },
        }}
      >
        <Card
          id="editor-command-bar"
          component="header"
          sx={{
            position: "sticky",
            top: { xs: 56, md: 58 },
            zIndex: 5,
            border: 0,
            borderRadius: 0,
            bgcolor: "rgba(30,22,80,0.92)",
            backdropFilter: "blur(18px)",
            color: "common.white",
            boxShadow: "0 2px 16px rgba(30,22,80,0.24)",
            overflow: "hidden",
            mb: 0,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              minHeight: { xs: 58, md: 44 },
              px: { xs: 0.75, sm: 1.5 },
            }}
          >
            <Tooltip title="Back to forms">
              <IconButton
                component={RouterLink}
                to="/"
                aria-label="Back to forms"
                sx={{
                  width: { xs: 44, md: 30 },
                  height: { xs: 44, md: 30 },
                  color: "common.white",
                  border: "1px solid rgba(255,255,255,0.14)",
                  bgcolor: "rgba(255,255,255,0.08)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                component="h1"
                noWrap
                tabIndex={-1}
                sx={{
                  color: "#F5F3FF",
                  fontSize: { xs: "0.82rem", md: "0.77rem" },
                  lineHeight: 1.35,
                  fontWeight: 650,
                  letterSpacing: "-0.01em",
                }}
              >
                {form.title.trim() ||
                  (isEditMode ? "Edit form" : "Create a form")}
              </Typography>
            </Box>

            <Box
              sx={{
                display: assistantMode
                  ? "none"
                  : { xs: "none", sm: "block" },
              }}
            >
              <StatusChip status={isEditMode ? "Live" : "Draft"} />
            </Box>

            <Typography
              sx={{
                display: assistantMode
                  ? "none"
                  : { xs: "none", md: "block" },
                px: 0.75,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: "0.55rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.76)",
                whiteSpace: "nowrap",
              }}
            >
              {elements.length} {elements.length === 1 ? "question" : "questions"}
            </Typography>

            <Typography
              aria-live="polite"
              sx={{
                display: assistantMode
                  ? "none"
                  : { xs: "none", lg: "block" },
                px: 0.75,
                color: saveMutation.isError
                  ? "#FFB4AD"
                  : "rgba(255,255,255,0.7)",
                fontSize: "0.66rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {saveStatus}
            </Typography>

            <Button
              type="button"
              variant="text"
              onClick={(event) => setToolsMenuAnchor(event.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={toolsMenuAnchor ? "true" : undefined}
              sx={{
                display: assistantMode
                  ? "inline-flex"
                  : { xs: "inline-flex", md: "none" },
                minWidth: 0,
                minHeight: { xs: 44, md: 32 },
                px: 1.25,
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.86)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
              }}
            >
              Tools
            </Button>

            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                display: assistantMode
                  ? "none"
                  : { xs: "none", md: "flex" },
              }}
            >
              <Button
                type="button"
                variant="text"
                onClick={() => setPreviewOpen(true)}
                sx={{
                  minHeight: 32,
                  px: 1.25,
                  fontSize: "0.72rem",
                  color: "rgba(255,255,255,0.82)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                Preview
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  variant="text"
                  onClick={() => setShareOpen(true)}
                  sx={{
                    minHeight: 32,
                    px: 1.25,
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.82)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                  }}
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
                  ) : undefined
                }
                disabled={saveMutation.isPending || (isEditMode && !isDirty)}
                onClick={() => void validateAndSave()}
                sx={{
                  minHeight: 32,
                  px: 1.4,
                  fontSize: "0.72rem",
                  bgcolor: "primary.main",
                  "&.Mui-disabled": {
                    bgcolor: "rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.46)",
                  },
                }}
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

            {assistantMode && (
              <Button
                type="button"
                variant="contained"
                startIcon={
                  saveMutation.isPending ? (
                    <CircularProgress size={17} color="inherit" />
                  ) : undefined
                }
                disabled={saveMutation.isPending || (isEditMode && !isDirty)}
                onClick={() => void validateAndSave()}
                sx={{
                  display: { xs: "none", lg: "inline-flex" },
                  minHeight: 32,
                  px: 1.4,
                  fontSize: "0.72rem",
                  bgcolor: "primary.main",
                  "&.Mui-disabled": {
                    bgcolor: "rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.46)",
                  },
                }}
              >
                {saveMutation.isPending
                  ? isEditMode
                    ? "Saving…"
                    : "Publishing…"
                  : isEditMode
                    ? "Save"
                    : "Publish"}
              </Button>
            )}
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
            gridTemplateColumns: "minmax(0, 580px)",
            justifyContent: "center",
            alignItems: "start",
            minHeight: {
              xs: "calc(100vh - 58px)",
              md: "calc(100vh - 102px)",
            },
            paddingInlineStart: { xs: 1.5, sm: 2.5, md: 4 },
            paddingInlineEnd: assistantMode
              ? { xs: 1.5, sm: 2.5, md: 4 }
              : { xs: "60px", sm: 2.5, md: 4 },
            py: { xs: 2, md: 4 },
          }}
        >
          <Card
            component="nav"
            aria-label="Form questions"
            sx={{
              display: assistantMode
                ? "none"
                : { xs: "none", lg: "block" },
              position: "fixed",
              insetInlineStart: 16,
              top: 118,
              zIndex: 3,
              width: 192,
              maxHeight: "calc(100vh - 136px)",
              overflowY: "auto",
              p: "14px 10px",
              border: "1px solid rgba(255,255,255,0.84)",
              borderRadius: "14px",
              bgcolor: "rgba(255,255,255,0.64)",
              backdropFilter: "blur(20px)",
              boxShadow:
                "0 2px 20px rgba(91,80,247,0.08), 0 1px 4px rgba(30,22,80,0.05)",
            }}
          >
            <Typography
              sx={{
                display: "block",
                px: 0.75,
                pb: 1.25,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: "0.53rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              Questions · {String(elements.length).padStart(2, "0")}
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
                        aria-current={active ? "location" : undefined}
                        onClick={() => scrollToQuestion(element.id)}
                        onKeyDown={(event) => {
                          if (
                            event.key !== "ArrowDown" &&
                            event.key !== "ArrowUp"
                          ) {
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

                          scrollToQuestion(nextId);
                          nextButton?.focus();
                        }}
                        sx={{
                          minHeight: 36,
                          mb: 0.25,
                          px: 0.9,
                          py: 0.6,
                          gap: 0.75,
                          border: "1px solid transparent",
                          borderRadius: "9px",
                          "&.Mui-selected": {
                            bgcolor: "rgba(91,80,247,0.12)",
                            borderColor: "#CCC8F8",
                          },
                          "&.Mui-selected:hover": {
                            bgcolor: "rgba(91,80,247,0.16)",
                          },
                        }}
                      >
                        <Typography
                          aria-hidden="true"
                          sx={{
                            width: 19,
                            flex: "0 0 19px",
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: "0.55rem",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            color: invalid
                              ? "error.main"
                              : active
                                ? "primary.main"
                                : "text.secondary",
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
                              sx: {
                                fontSize: "0.72rem",
                                lineHeight: 1.35,
                                fontWeight: active ? 650 : 450,
                                color: active
                                  ? "text.primary"
                                  : "text.secondary",
                              },
                            },
                          }}
                          sx={{ minWidth: 0, my: 0 }}
                        />
                        {invalid ? (
                          <ReportProblemOutlinedIcon
                            aria-label="Needs attention"
                            color="error"
                            sx={{ fontSize: 14 }}
                          />
                        ) : active ? (
                          <Box
                            aria-hidden="true"
                            sx={{
                              width: 5,
                              height: 5,
                              flex: "0 0 5px",
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                            }}
                          />
                        ) : null}
                      </ListItemButton>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography
                sx={{
                  px: 0.75,
                  py: 0.5,
                  color: "text.secondary",
                  fontSize: "0.72rem",
                  lineHeight: 1.45,
                }}
              >
                Questions will appear here.
              </Typography>
            )}
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
              width: "100%",
              maxWidth: 580,
              minWidth: 0,
              justifySelf: "center",
              pb: { xs: 2, md: 6 },
            }}
          >
            <Card
              sx={{
                overflow: "hidden",
                border: "1.5px solid #E0DEFA",
                borderRadius: "14px",
                boxShadow: "0 2px 16px rgba(91,80,247,0.06)",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                sx={{
                  minHeight: 42,
                  px: { xs: 2, sm: 2.5 },
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: "#F7F6FF",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.1}>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 20,
                      px: 1,
                      borderRadius: "5px",
                      bgcolor: "#1E1650",
                      color: "common.white",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: "0.52rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Form
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: "0.54rem",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "primary.main",
                    }}
                  >
                    Form opening
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: "0.53rem",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                  }}
                >
                  {String(elements.length).padStart(2, "0")}{" "}
                  {elements.length === 1 ? "question" : "questions"}
                </Typography>
              </Stack>

              <Stack
                spacing={2.25}
                sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2.5, sm: 3 } }}
              >
                <Box>
                  <Typography
                    component="h2"
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: "0.62rem",
                      lineHeight: 1.4,
                      fontWeight: 600,
                      letterSpacing: "0.11em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                    }}
                  >
                    Set the context
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.45,
                      maxWidth: "56ch",
                      color: "text.secondary",
                      fontSize: "0.82rem",
                      lineHeight: 1.5,
                    }}
                  >
                    Give respondents a clear reason to complete this form.
                  </Typography>
                </Box>

                <Stack spacing={0.65}>
                  <Typography
                    component="label"
                    htmlFor="form-title"
                    sx={{
                      color: "text.primary",
                      fontSize: "0.72rem",
                      lineHeight: 1.4,
                      fontWeight: 650,
                    }}
                  >
                    Form title
                  </Typography>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        id="form-title"
                        size="small"
                        placeholder="Enter a form title"
                        error={validationIssues.some(
                          (issue) => issue.id === "form-title"
                        )}
                        autoComplete="off"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            minHeight: 46,
                            borderRadius: "9px",
                          },
                          "& .MuiInputBase-input": {
                            py: 1.15,
                            fontSize: "0.94rem",
                            lineHeight: 1.35,
                            fontWeight: 650,
                            letterSpacing: "-0.012em",
                          },
                        }}
                      />
                    )}
                  />
                </Stack>

                <Stack spacing={0.65}>
                  <Typography
                    component="label"
                    htmlFor="form-description"
                    sx={{
                      color: "text.primary",
                      fontSize: "0.72rem",
                      lineHeight: 1.4,
                      fontWeight: 650,
                    }}
                  >
                    Description{" "}
                    <Box
                      component="span"
                      sx={{ color: "text.secondary", fontWeight: 400 }}
                    >
                      (optional)
                    </Box>
                  </Typography>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        id="form-description"
                        size="small"
                        placeholder="Explain what this form is for"
                        multiline
                        minRows={3}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            alignItems: "flex-start",
                            borderRadius: "9px",
                          },
                          "& .MuiInputBase-inputMultiline": {
                            fontSize: "0.84rem",
                            lineHeight: 1.55,
                          },
                        }}
                      />
                    )}
                  />
                </Stack>
              </Stack>
            </Card>

            <Typography
              id="question-list-title"
              component="h2"
              className="sr-only"
            >
              Questions
            </Typography>

            <Box
              component="section"
              aria-labelledby="question-list-title"
              sx={{
                position: "relative",
                mt: 3,
                "&::before": elements.length
                  ? {
                      content: '""',
                      position: "absolute",
                      zIndex: 0,
                      display: { xs: "none", sm: "block" },
                      insetInlineStart: 14,
                      insetBlockStart: 0,
                      insetBlockEnd: 38,
                      width: "1.5px",
                      borderRadius: 999,
                      background:
                        "linear-gradient(to bottom, #CCC8F8 82%, rgba(204,200,248,0))",
                    }
                  : undefined,
              }}
            >
              {elements.map((element, index) => (
                <FormElementBuilder
                  key={element.id}
                  index={index}
                  isActive={resolvedActiveElementId === element.id}
                  isEditing={editingElementId === element.id}
                  issues={issuesByElement.get(element.id)}
                  cardRef={(node) => registerQuestionCard(element.id, node)}
                  onActivate={() => setActiveElementId(element.id)}
                  onEdit={() => openQuestionEditor(element.id)}
                  onFinishEditing={() => setEditingElementId(null)}
                  onDuplicate={() => duplicateElement(index)}
                  onMoveUp={() => moveElement(index, index - 1)}
                  onMoveDown={() => moveElement(index, index + 1)}
                  onDelete={() => requestDeleteElement(element.id)}
                  canMoveUp={index > 0}
                  canMoveDown={index < elements.length - 1}
                />
              ))}

              <Box sx={{ ml: { xs: 0, sm: "42px" } }}>
                <Button
                  id="add-question-button"
                  type="button"
                  variant="text"
                  fullWidth
                  aria-haspopup="menu"
                  aria-expanded={addMenuAnchor ? "true" : undefined}
                  onClick={(event) => setAddMenuAnchor(event.currentTarget)}
                  sx={{
                    minHeight: 76,
                    justifyContent: "flex-start",
                    px: { xs: 2, sm: 2.5 },
                    py: 1.75,
                    border: "1.5px dashed #BDB8F2",
                    borderRadius: "13px",
                    bgcolor: "rgba(255,255,255,0.56)",
                    color: "text.primary",
                    textAlign: "start",
                    backdropFilter: "blur(8px)",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "rgba(91,80,247,0.08)",
                    },
                  }}
                >
                  <Box>
                    <Typography
                      component="span"
                      sx={{
                        display: "block",
                        color: "primary.main",
                        fontSize: "0.84rem",
                        lineHeight: 1.35,
                        fontWeight: 700,
                      }}
                    >
                      Add question
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        display: "block",
                        mt: 0.25,
                        color: "text.secondary",
                        fontSize: "0.72rem",
                        lineHeight: 1.4,
                        fontWeight: 450,
                      }}
                    >
                      {elements.length === 0
                        ? "Choose the response type for your first question"
                        : "Short answer, multiple choice, or file upload"}
                    </Typography>
                  </Box>
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        {mobile && (
          <Card
            id="mobile-editor-actions"
            sx={{
              position: "fixed",
              insetInline: 0,
              bottom: 0,
              zIndex: (muiTheme) => muiTheme.zIndex.appBar + 2,
              p: 1.5,
              pb: "calc(12px + env(safe-area-inset-bottom))",
              borderRadius: 0,
              borderInline: 0,
              borderBottom: 0,
              boxShadow: "0 -8px 28px rgba(30, 22, 80, 0.14)",
            }}
          >
            <Button
              type="button"
              variant="contained"
              fullWidth
              startIcon={
                saveMutation.isPending ? (
                  <CircularProgress size={17} color="inherit" />
                ) : undefined
              }
              disabled={saveMutation.isPending || (isEditMode && !isDirty)}
              onClick={() => void validateAndSave()}
              sx={{ minHeight: 52 }}
            >
              {saveMutation.isPending
                ? isEditMode
                  ? "Saving…"
                  : "Publishing…"
                : isEditMode
                  ? "Save changes"
                  : "Publish"}
            </Button>
          </Card>
        )}

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

        <Menu
          anchorEl={toolsMenuAnchor}
          open={Boolean(toolsMenuAnchor)}
          onClose={() => setToolsMenuAnchor(null)}
          slotProps={{ paper: { sx: { minWidth: 196 } } }}
        >
          <MenuItem
            onClick={() => {
              setToolsMenuAnchor(null);
              setPreviewOpen(true);
            }}
          >
            Preview form
          </MenuItem>
          {isEditMode && (
            <MenuItem
              onClick={() => {
                setToolsMenuAnchor(null);
                setShareOpen(true);
              }}
            >
              Share form
            </MenuItem>
          )}
        </Menu>

        {chatDock.isOpen &&
          chatDock.portalNode &&
          createPortal(
            <ChatPanel
              key={chatResetKey}
              onClose={chatDock.close}
              onReset={handleResetChat}
              adapter={chatAdapter}
              sessionKey={sessionKey}
              formTitle={form.title}
              status={isEditMode ? "Live" : "Draft"}
              proposalSummary={proposalSummary}
              onReviewProposal={() => setProposalReviewOpen(true)}
              onApplyProposal={applyAssistantProposal}
              onDismissProposal={() => setAssistantProposal(null)}
            />,
            chatDock.portalNode
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
