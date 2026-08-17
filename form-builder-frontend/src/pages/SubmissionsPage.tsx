import { useMemo, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useParams } from "react-router-dom";

import { getFormByIdApi, getSubmissionsByFormIdApi } from "../api/form";
import { SubmissionAnswerRenderer } from "../components/SubmissionAnswerRenderer";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusChip } from "../components/ui/StatusChip";
import type { Form } from "../types/Form";
import type { FormElement } from "../types/FormInput";
import type { Submission } from "../types/Submission";
import { storedFileName } from "../utils/form";

type SortDirection = "desc" | "asc";

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const publicFormUrl = (id: string) =>
  `${window.location.origin}/forms/${encodeURIComponent(id)}`;

const answerText = (
  submission: Submission,
  element: FormElement
): string => {
  const value = submission.answers[element.id];
  if (typeof value !== "string") return "";
  return element.type === "file-upload" ? storedFileName(value) : value.trim();
};

const responseSummary = (submission: Submission, form: Form) => {
  const answers = form.elements
    .filter((element) => element.type !== "file-upload")
    .map((element) => answerText(submission, element))
    .filter(Boolean);

  return answers.slice(0, 2).join(" · ") || "No text answers";
};

const attachmentNames = (submission: Submission, form: Form) =>
  form.elements
    .filter((element) => element.type === "file-upload")
    .map((element) => answerText(submission, element))
    .filter(Boolean);

const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;

export const SubmissionsPage = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const desktopDetail = useMediaQuery(theme.breakpoints.up("xl"));
  const [search, setSearch] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [notice, setNotice] = useState("");

  const formQuery = useQuery({
    queryKey: ["form", id],
    queryFn: () => getFormByIdApi(id!),
    enabled: Boolean(id),
  });

  const submissionsQuery = useQuery({
    queryKey: ["form-submissions", id],
    queryFn: () => getSubmissionsByFormIdApi(id!),
    enabled: Boolean(id),
  });

  const form = formQuery.data;
  const submissions = useMemo(
    () => submissionsQuery.data ?? [],
    [submissionsQuery.data]
  );
  const visibleSubmissions = useMemo(() => {
    if (!form) return [];
    const query = search.trim().toLocaleLowerCase();
    const filtered = submissions.filter((submission) => {
      if (!query) return true;
      const searchable = [
        submission.id,
        submission.submittedAt,
        ...form.elements.map((element) => answerText(submission, element)),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return searchable.includes(query);
    });

    return [...filtered].sort((a, b) => {
      const delta =
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      return sortDirection === "asc" ? delta : -delta;
    });
  }, [form, search, sortDirection, submissions]);

  const copyPublicLink = async () => {
    if (!form) return;
    try {
      await navigator.clipboard.writeText(publicFormUrl(form.id));
      setNotice("Public link copied.");
    } catch {
      setNotice("Copy failed. Open the form and copy the browser address.");
    }
  };

  const exportCsv = () => {
    if (!form || visibleSubmissions.length === 0) return;
    const headers = [
      "Response ID",
      "Submitted at",
      ...form.elements.map((element) => element.title || "Untitled question"),
    ];
    const rows = visibleSubmissions.map((submission) => [
      submission.id,
      submission.submittedAt,
      ...form.elements.map((element) => answerText(submission, element)),
    ]);
    const content = [headers, ...rows]
      .map((row) => row.map((value) => csvCell(String(value))).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${content}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(form.title || "form")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLocaleLowerCase()}-responses.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice(
      `Exported ${visibleSubmissions.length} ${
        visibleSubmissions.length === 1 ? "response" : "responses"
      }.`
    );
  };

  if (formQuery.isLoading || submissionsQuery.isLoading) {
    return (
      <Box sx={{ width: "100%" }}>
        <Typography component="h1" className="sr-only" tabIndex={-1}>
          Loading responses
        </Typography>
        <Stack spacing={3}>
          <Skeleton width="42%" height={52} />
          <Stack direction="row" spacing={2}>
            <Skeleton variant="rounded" height={96} sx={{ flex: 1 }} />
            <Skeleton variant="rounded" height={96} sx={{ flex: 1 }} />
          </Stack>
          <Card sx={{ p: 2 }}>
            {[0, 1, 2, 3, 4].map((row) => (
              <Skeleton key={row} height={64} />
            ))}
          </Card>
        </Stack>
      </Box>
    );
  }

  if (formQuery.isError || !form) {
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
      </Box>
    );
  }

  if (submissionsQuery.isError) {
    return (
      <Box sx={{ maxWidth: 760 }}>
        <Typography component="h1" variant="h1" tabIndex={-1}>
          Responses could not be loaded
        </Typography>
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => submissionsQuery.refetch()}>
              Retry
            </Button>
          }
          sx={{ mt: 2 }}
        >
          {submissionsQuery.error instanceof Error
            ? submissionsQuery.error.message
            : "Check your connection and try again."}
        </Alert>
      </Box>
    );
  }

  const lastResponse = submissions[0]?.submittedAt
    ? dateTime.format(new Date(submissions[0].submittedAt))
    : "No responses yet";

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Button
        component={RouterLink}
        to="/"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 1 }}
      >
        Forms
      </Button>

      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "flex-start" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Typography component="h1" variant="h1" tabIndex={-1}>
              {form.title || "Untitled form"}
            </Typography>
            <StatusChip status="Live" />
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {submissions.length}{" "}
            {submissions.length === 1 ? "response" : "responses"}
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="outlined"
            startIcon={<OpenInNewOutlinedIcon />}
            onClick={() =>
              window.open(`/forms/${form.id}`, "_blank", "noopener,noreferrer")
            }
          >
            Open form
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            disabled={visibleSubmissions.length === 0}
            onClick={exportCsv}
          >
            Export CSV
          </Button>
        </Stack>
      </Stack>

      {submissions.length > 0 && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Card sx={{ flex: 1, p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Total responses
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
              {submissions.length}
            </Typography>
          </Card>
          <Card sx={{ flex: 1, p: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Last response
            </Typography>
            <Typography fontWeight={700} sx={{ mt: 0.75 }}>
              {lastResponse}
            </Typography>
          </Card>
        </Stack>
      )}

      {submissions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<VisibilityOutlinedIcon />}
            title="No responses yet"
            description="Share the public link to start collecting responses."
            actions={
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<ContentCopyOutlinedIcon />}
                  onClick={() => void copyPublicLink()}
                >
                  Copy public link
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<OpenInNewOutlinedIcon />}
                  onClick={() =>
                    window.open(
                      `/forms/${form.id}`,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  Open form
                </Button>
              </Stack>
            }
          />
        </Card>
      ) : (
        <>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            spacing={1.5}
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
              placeholder="Search responses"
              aria-label="Search responses"
              sx={{ width: { xs: "100%", md: 360 } }}
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
            <Typography
              variant="body2"
              color="text.secondary"
              aria-live="polite"
            >
              Showing {visibleSubmissions.length} of {submissions.length}
            </Typography>
          </Stack>

          {visibleSubmissions.length === 0 ? (
            <Card>
              <EmptyState
                icon={<SearchIcon />}
                title="No responses match this search"
                description="Try a different word or clear the search."
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
                <Table aria-label="Form responses">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ width: 200 }}
                        sortDirection={sortDirection}
                      >
                        <TableSortLabel
                          active
                          direction={sortDirection}
                          onClick={() =>
                            setSortDirection((current) =>
                              current === "desc" ? "asc" : "desc"
                            )
                          }
                        >
                          Submitted
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Response summary</TableCell>
                      <TableCell sx={{ width: 184 }}>Attachments</TableCell>
                      <TableCell align="right" sx={{ width: 112 }}>
                        <span className="sr-only">Actions</span>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleSubmissions.map((submission) => {
                      const attachments = attachmentNames(submission, form);
                      return (
                        <TableRow
                          key={submission.id}
                          hover
                          sx={{ "&:last-child td": { borderBottom: 0 } }}
                        >
                          <TableCell>
                            <Typography fontWeight={700}>
                              {dateTime.format(new Date(submission.submittedAt))}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "block",
                                maxWidth: 176,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              ID {submission.id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              dir="auto"
                              sx={{
                                maxWidth: 620,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {responseSummary(submission, form)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {attachments.length > 0 ? (
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <AttachFileOutlinedIcon
                                  color="action"
                                  sx={{ fontSize: 18 }}
                                />
                                <Typography variant="body2">
                                  {attachments.length}{" "}
                                  {attachments.length === 1
                                    ? "attachment"
                                    : "attachments"}
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                None
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              variant="text"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
                {visibleSubmissions.map((submission) => {
                  const attachments = attachmentNames(submission, form);
                  return (
                    <Card key={submission.id} sx={{ p: 2 }}>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography fontWeight={700}>
                            {dateTime.format(new Date(submission.submittedAt))}
                          </Typography>
                          <Typography
                            color="text.secondary"
                            dir="auto"
                            sx={{
                              mt: 0.75,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {responseSummary(submission, form)}
                          </Typography>
                        </Box>
                        {attachments.length > 0 && (
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <AttachFileOutlinedIcon
                              color="action"
                              sx={{ fontSize: 18 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {attachments.length}{" "}
                              {attachments.length === 1
                                ? "attachment"
                                : "attachments"}
                            </Typography>
                          </Stack>
                        )}
                        <Divider />
                        <Button
                          variant="outlined"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          View response
                        </Button>
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            </>
          )}
        </>
      )}

      <Drawer
        anchor="right"
        open={Boolean(selectedSubmission)}
        onClose={() => setSelectedSubmission(null)}
        slotProps={{
          paper: {
            sx: {
              width: desktopDetail ? 420 : "100%",
              maxWidth: "100%",
            },
          },
        }}
      >
        {selectedSubmission && (
          <ResponseDetail
            form={form}
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        )}
      </Drawer>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice("")}
        message={notice}
      />
    </Box>
  );
};

const ResponseDetail = ({
  form,
  submission,
  onClose,
}: {
  form: Form;
  submission: Submission;
  onClose: () => void;
}) => (
  <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        minHeight: 64,
        px: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="h2" variant="h3">
          Response detail
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {dateTime.format(new Date(submission.submittedAt))}
        </Typography>
      </Box>
      <IconButton aria-label="Close response detail" onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Stack>

    <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 2.5 } }}>
      <Stack spacing={3}>
        <Card sx={{ p: 2, bgcolor: "#FAFBFC" }}>
          <Typography variant="caption" color="text.secondary">
            Response ID
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "0.75rem",
              overflowWrap: "anywhere",
            }}
          >
            {submission.id}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            Submitted
          </Typography>
          <Typography fontWeight={700}>
            {dateTime.format(new Date(submission.submittedAt))}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Time zone: {timeZone}
          </Typography>
        </Card>

        {form.elements.map((element) => (
          <SubmissionAnswerRenderer
            key={element.id}
            element={element}
            value={submission.answers[element.id] ?? null}
          />
        ))}
      </Stack>
    </Box>
  </Box>
);
