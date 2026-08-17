import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import {
  deleteFormApi,
  getFormsApi,
  getSubmissionsByFormIdApi,
} from "../api/form";
import type { Form } from "../types/Form";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusChip } from "../components/ui/StatusChip";
import { ChatPanel } from "../components/formBuilder/chat/ChatPanel";
import { clearSessionId } from "../components/formBuilder/chat/chatSessionStore";
import { useChatDock } from "../components/layout/useChatDock";
import { useFormChatAdapter } from "../hooks/useFormChatAdapter";
import {
  createEmptyForm,
  prepareFormProposal,
  summarizeFormChanges,
} from "../utils/form";

type SortOption = "title" | "questions" | "responses";
const OVERVIEW_ASSISTANT_SESSION_KEY = "forms-overview";

const publicFormUrl = (id: string) =>
  `${window.location.origin}/forms/${encodeURIComponent(id)}`;

export const LandingPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chatDock = useChatDock();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("title");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuForm, setMenuForm] = useState<Form | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Form | null>(null);
  const [notice, setNotice] = useState("");
  const [assistantProposal, setAssistantProposal] = useState<Form | null>(null);
  const [chatResetKey, setChatResetKey] = useState(0);
  const keepFormButtonRef = useRef<HTMLButtonElement>(null);
  const assistantBaseForm = useMemo(() => createEmptyForm(), []);

  const formsQuery = useQuery({
    queryKey: ["forms"],
    queryFn: getFormsApi,
  });

  const forms = useMemo(() => formsQuery.data ?? [], [formsQuery.data]);
  const submissionQueries = useQueries({
    queries: forms.map((form) => ({
      queryKey: ["form-submissions", form.id, "count"],
      queryFn: () => getSubmissionsByFormIdApi(form.id),
      staleTime: 60_000,
    })),
  });

  const responseCounts = useMemo(
    () =>
      new Map(
        forms.map((form, index) => [
          form.id,
          submissionQueries[index]?.data?.length ?? null,
        ])
      ),
    [forms, submissionQueries]
  );

  const visibleForms = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const filtered = forms.filter((form) => {
      if (!query) return true;
      return `${form.title} ${form.description}`
        .toLocaleLowerCase()
        .includes(query);
    });

    return [...filtered].sort((a, b) => {
      if (sort === "questions") {
        return (b.elements?.length ?? 0) - (a.elements?.length ?? 0);
      }
      if (sort === "responses") {
        return (
          (responseCounts.get(b.id) ?? -1) - (responseCounts.get(a.id) ?? -1)
        );
      }
      return (a.title || "Untitled form").localeCompare(
        b.title || "Untitled form"
      );
    });
  }, [forms, responseCounts, search, sort]);

  const deleteMutation = useMutation({
    mutationFn: deleteFormApi,
    onSuccess: async () => {
      setNotice("Form deleted.");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });

  const getAssistantForm = useCallback(
    () => assistantBaseForm,
    [assistantBaseForm]
  );
  const handleFormProposed = useCallback(
    (proposal: Form) => {
      setAssistantProposal(
        prepareFormProposal(proposal, assistantBaseForm)
      );
    },
    [assistantBaseForm]
  );
  const chatAdapter = useFormChatAdapter({
    getCurrentForm: getAssistantForm,
    onFormProposed: handleFormProposed,
    sessionKey: OVERVIEW_ASSISTANT_SESSION_KEY,
    resetKey: chatResetKey,
  });

  const handleResetChat = useCallback(() => {
    clearSessionId(OVERVIEW_ASSISTANT_SESSION_KEY);
    queryClient.removeQueries({ queryKey: ["chat-history"] });
    setAssistantProposal(null);
    setChatResetKey((key) => key + 1);
  }, [queryClient]);

  const proposalSummary = assistantProposal
    ? summarizeFormChanges(assistantBaseForm, assistantProposal)
    : [];

  const openAssistantDraft = useCallback(() => {
    if (!assistantProposal) return;

    navigate("/forms/new", {
      state: {
        assistantDraft: assistantProposal,
        assistantSessionKey: OVERVIEW_ASSISTANT_SESSION_KEY,
      },
    });
  }, [assistantProposal, navigate]);

  const openMenu = (event: React.MouseEvent<HTMLElement>, form: Form) => {
    setMenuAnchor(event.currentTarget);
    setMenuForm(form);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuForm(null);
  };

  const copyLink = async (form: Form) => {
    try {
      await navigator.clipboard.writeText(publicFormUrl(form.id));
      setNotice("Public link copied.");
    } catch {
      setNotice("Copy failed. Open the form and copy the address from your browser.");
    }
  };

  const totalResponses = [...responseCounts.values()].reduce<number | null>(
    (total, value) => (value === null || total === null ? null : total + value),
    0
  );

  return (
    <Box
      sx={{
        width: "100%",
        boxSizing: "border-box",
        pr: chatDock.isOpen
          ? 0
          : {
            xs: "56px",
            md: "64px",
          },
        transition: "padding-right 240ms cubic-bezier(0.2, 0, 0, 1)",
      }}
    >
      <Box
        component="section"
        aria-labelledby="forms-overview-title"
        sx={{
          mb: 3,
          px: { xs: 2, sm: 2.75, md: 3.25 },
          py: { xs: 2.25, sm: 2.75 },
          border: "1px solid rgba(30, 22, 80, 0.13)",
          borderRadius: "16px",
          background:
            "linear-gradient(135deg, rgba(30, 22, 80, 0.075) 0%, rgba(91, 80, 247, 0.035) 100%)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={{ xs: 1.75, sm: 2.25 }}
        >
          <Box
            aria-hidden="true"
            sx={{
              width: { xs: 44, sm: 50 },
              height: { xs: 44, sm: 50 },
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: "13px",
              bgcolor: "secondary.main",
              color: "common.white",
              boxShadow: "0 8px 20px rgba(30, 22, 80, 0.18)",
            }}
          >
            <DescriptionOutlinedIcon sx={{ fontSize: { xs: 23, sm: 26 } }} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: "0.62rem",
                lineHeight: 1.4,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "secondary.main",
              }}
            >
              Form workspace
            </Typography>
            <Typography
              id="forms-overview-title"
              component="h1"
              tabIndex={-1}
              sx={{
                mt: 0.25,
                fontSize: {
                  xs: "1.85rem",
                  sm: "2.2rem",
                  md: "2.45rem",
                },
                lineHeight: 1.08,
                fontWeight: 780,
                letterSpacing: "-0.045em",
                color: "secondary.main",
              }}
            >
              Forms
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mt: 0.55, maxWidth: "48ch" }}
            >
              Create, publish, and review your forms.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {!formsQuery.isLoading && !formsQuery.isError && forms.length > 0 && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Card sx={{ flex: 1, p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Live forms
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                fontFamily:
                  '"DM Sans Variable", "Segoe UI", sans-serif',
                fontSize: "1.5rem",
                fontWeight: 650,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {forms.length}
            </Typography>
          </Card>
          <Card sx={{ flex: 1, p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Responses
            </Typography>
            {totalResponses === null ? (
              <Skeleton width={52} height={36} />
            ) : (
              <Typography
                sx={{
                  mt: 0.5,
                  fontFamily:
                    '"DM Sans Variable", "Segoe UI", sans-serif',
                  fontSize: "1.5rem",
                  fontWeight: 650,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {totalResponses}
              </Typography>
            )}
          </Card>
          <Card sx={{ flex: 1, p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Questions
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                fontFamily:
                  '"DM Sans Variable", "Segoe UI", sans-serif',
                fontSize: "1.5rem",
                fontWeight: 650,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {forms.reduce((sum, form) => sum + (form.elements?.length ?? 0), 0)}
            </Typography>
          </Card>
        </Stack>
      )}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{
          position: { xs: "sticky", md: "static" },
          top: { xs: 56, md: "auto" },
          zIndex: { xs: 2, md: "auto" },
          py: 1.5,
          mb: 1,
          bgcolor: "background.default",
        }}
      >
        <TextField
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search forms"
          aria-label="Search forms"
          sx={{ width: { xs: "100%", md: 360, xl: 420 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography
            component="label"
            htmlFor="sort-forms"
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "nowrap" }}
          >
            Sort by
          </Typography>
          <Select
            native
            id="sort-forms"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            inputProps={{ "aria-label": "Sort forms" }}
            sx={{ minWidth: 168 }}
          >
            <option value="title">Title</option>
            <option value="questions">Most questions</option>
            <option value="responses">Most responses</option>
          </Select>
        </Stack>
      </Stack>

      {formsQuery.isLoading ? (
        <DashboardSkeleton />
      ) : formsQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => formsQuery.refetch()}>
              Retry
            </Button>
          }
          sx={{ mt: 2 }}
        >
          <Typography component="div" fontWeight={700}>
            Forms could not be loaded
          </Typography>
          Check your connection and try again.
        </Alert>
      ) : forms.length === 0 ? (
        <Card>
          <EmptyState
            icon={<TableRowsOutlinedIcon />}
            title="No forms yet"
            description="Create your first form to start collecting responses."
            actions={
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/forms/new")}
              >
                Create form
              </Button>
            }
          />
        </Card>
      ) : visibleForms.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchIcon />}
            title="No forms match your search"
            description="Try a different title or clear the search."
            actions={
              <Button variant="outlined" onClick={() => setSearch("")}>
                Clear search
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <TableContainer
            component={Card}
            sx={{ display: { xs: "none", md: "block" }, overflow: "hidden" }}
          >
            <Table aria-label="Forms" sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow>
                  <TableCell>Form</TableCell>
                  <TableCell sx={{ width: 116 }}>Status</TableCell>
                  <TableCell align="right" sx={{ width: 112 }}>
                    Questions
                  </TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>
                    Responses
                  </TableCell>
                  <TableCell align="center" sx={{ width: 64 }}>
                    <span className="sr-only">Actions</span>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleForms.map((form) => (
                  <TableRow
                    key={form.id}
                    hover
                    sx={{ "&:last-child td": { borderBottom: 0 } }}
                  >
                    <TableCell>
                      <Box
                        component={RouterLink}
                        to={`/forms/${form.id}/edit`}
                        sx={{
                          display: "block",
                          textDecoration: "none",
                          color: "inherit",
                          maxWidth: 620,
                          borderRadius: 1,
                          "&:focus-visible": {
                            outline: "3px solid",
                            outlineColor: "primary.main",
                            outlineOffset: 2,
                          },
                        }}
                      >
                        <Typography fontWeight={700} noWrap>
                          {form.title || "Untitled form"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ mt: 0.25 }}
                        >
                          {form.description || "No description"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <StatusChip status="Live" />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {form.elements?.length ?? 0}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {responseCounts.get(form.id) ?? "—"}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        aria-label={`More actions for ${form.title || "Untitled form"
                          }`}
                        onClick={(event) => openMenu(event, form)}
                      >
                        <MoreHorizIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
            {visibleForms.map((form) => (
              <Card key={form.id} sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        component={RouterLink}
                        to={`/forms/${form.id}/edit`}
                        fontWeight={700}
                        sx={{
                          display: "block",
                          color: "text.primary",
                          textDecoration: "none",
                          overflowWrap: "anywhere",
                          "&:focus-visible": {
                            outline: "3px solid",
                            outlineColor: "primary.main",
                            outlineOffset: 2,
                          },
                        }}
                      >
                        {form.title || "Untitled form"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {responseCounts.get(form.id) ?? "—"} responses ·{" "}
                        {form.elements?.length ?? 0} questions
                      </Typography>
                    </Box>
                    <StatusChip status="Live" />
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Button
                      component={RouterLink}
                      to={`/forms/${form.id}/edit`}
                      variant="outlined"
                      startIcon={<EditOutlinedIcon />}
                      sx={{ flex: 1 }}
                    >
                      Edit form
                    </Button>
                    <IconButton
                      aria-label={`More actions for ${form.title || "Untitled form"
                        }`}
                      onClick={(event) => openMenu(event, form)}
                    >
                      <MoreHorizIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        </>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor && menuForm)}
        onClose={closeMenu}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        <MenuItem
          onClick={() => {
            if (menuForm) navigate(`/forms/${menuForm.id}/edit`);
            closeMenu();
          }}
        >
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Edit form
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuForm) window.open(`/forms/${menuForm.id}`, "_blank", "noopener");
            closeMenu();
          }}
        >
          <OpenInNewOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
          View form
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuForm) navigate(`/forms/${menuForm.id}/results`);
            closeMenu();
          }}
        >
          <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
          View responses
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuForm) void copyLink(menuForm);
            closeMenu();
          }}
        >
          <ContentCopyOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Copy public link
        </MenuItem>
        <Divider />
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            setDeleteTarget(menuForm);
            closeMenu();
          }}
        >
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1.5 }} />
          Delete form
        </MenuItem>
      </Menu>

      {chatDock.isOpen &&
        chatDock.portalNode &&
        createPortal(
          <ChatPanel
            key={chatResetKey}
            onClose={chatDock.close}
            onReset={handleResetChat}
            adapter={chatAdapter}
            sessionKey={OVERVIEW_ASSISTANT_SESSION_KEY}
            formTitle="New form workspace"
            status="Ready"
            mode="overview"
            assistantDescription="Turns an idea into a form draft you can review"
            contextLabel="Workspace"
            proposalSummary={proposalSummary}
            proposalTitle="Draft ready"
            proposalDescription="Generated by AI · Open it in the editor before publishing"
            applyProposalLabel="Open draft"
            onApplyProposal={openAssistantDraft}
            onDismissProposal={() => setAssistantProposal(null)}
          />,
          chatDock.portalNode
        )}

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{
          transition: {
            onEntered: () => keepFormButtonRef.current?.focus(),
          },
        }}
      >
        <DialogTitle>Delete form?</DialogTitle>
        <DialogContent>
          <Typography>
            “{deleteTarget?.title || "Untitled form"}” and its public link will be
            removed. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            ref={keepFormButtonRef}
            autoFocus
            onClick={() => setDeleteTarget(null)}
            disabled={deleteMutation.isPending}
          >
            Keep form
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={!deleteTarget || deleteMutation.isPending}
            onClick={() => {
              if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
            }}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete form"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice("")}
        message={notice}
      />
    </Box>
  );
};

const DashboardSkeleton = () => (
  <Card sx={{ overflow: "hidden" }} aria-label="Loading forms">
    <Stack spacing={0}>
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <Stack
          key={row}
          direction="row"
          alignItems="center"
          spacing={3}
          sx={{ minHeight: 72, px: 2, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Box sx={{ flex: 1 }}>
            <Skeleton width="45%" />
            <Skeleton width="68%" />
          </Box>
          <Skeleton width={76} height={28} />
          <Skeleton width={44} />
          <Skeleton width={44} />
        </Stack>
      ))}
    </Stack>
  </Card>
);

export default LandingPage;
