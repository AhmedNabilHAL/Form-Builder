import { useEffect, useState } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import WifiOffOutlinedIcon from "@mui/icons-material/WifiOffOutlined";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";

import { BrandMark } from "../ui/BrandMark";
import { getFormByIdApi } from "../../api/form";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useChatPanel } from "../../hooks/useChatPanel";
import { ChatDock } from "./ChatDock";

export const AppLayout = () => {
  const location = useLocation();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const online = useOnlineStatus();
  const chatPanel = useChatPanel();
  const closeChatPanel = chatPanel.close;
  const [chatPortalNode, setChatPortalNode] = useState<HTMLElement | null>(null);
  const isFormsHome = location.pathname === "/";
  const isNewForm = location.pathname === "/forms/new";
  const editorMatch = location.pathname.match(/^\/forms\/([^/]+)\/edit$/);
  const resultsMatch = location.pathname.match(/^\/forms\/([^/]+)\/results$/);
  const routeFormId = editorMatch?.[1] ?? resultsMatch?.[1] ?? "";
  const isEditorRoute = isNewForm || Boolean(editorMatch);
  const hasWorkspaceBreadcrumb =
    isEditorRoute || Boolean(resultsMatch);
  const assistantAvailable = isFormsHome || isEditorRoute;
  const locationState = location.state as
    | { assistantDraft?: { title?: string } }
    | null;
  const formTitleQuery = useQuery({
    queryKey: ["form", routeFormId],
    queryFn: () => getFormByIdApi(routeFormId),
    enabled: Boolean(routeFormId),
  });
  const breadcrumbTitle = isNewForm
    ? locationState?.assistantDraft?.title?.trim() || "New form"
    : formTitleQuery.data?.title?.trim() ||
      (formTitleQuery.isLoading ? "Loading form…" : "Untitled form");

  useEffect(() => {
    if (!assistantAvailable) {
      closeChatPanel();
    }
  }, [assistantAvailable, closeChatPanel]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        pr: chatPanel.isOpen
          ? { xs: 0, lg: `${chatPanel.width}px` }
          : 0,
        transition: chatPanel.isResizing
          ? "none"
          : "padding-right 240ms cubic-bezier(0.2, 0, 0, 1)",
      }}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <AppBar
        position="sticky"
        elevation={0}
        color="inherit"
        sx={{
          height: { xs: 56, md: isEditorRoute ? 58 : 64 },
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(12px)",
          color: "text.primary",
          zIndex: (muiTheme) => muiTheme.zIndex.appBar + 1,
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 1440, height: "100%" }}>
          <Toolbar disableGutters sx={{ minHeight: "100% !important", gap: 2 }}>
            <Box
              component={RouterLink}
              to="/"
              aria-label="FormFlow forms"
              sx={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
              }}
            >
              <BrandMark />
            </Box>

            {!mobile && (
              <Button
                component={RouterLink}
                to="/"
                color="inherit"
                sx={{
                  alignSelf: "stretch",
                  borderRadius: 0,
                  borderBottom: "2px solid",
                  borderBottomColor: isFormsHome
                    ? "secondary.main"
                    : "transparent",
                  px: 1.5,
                }}
              >
                Forms
              </Button>
            )}

            {hasWorkspaceBreadcrumb && (
              <Box
                component="nav"
                aria-label="Breadcrumb"
                sx={{
                  display: { xs: "none", md: "flex" },
                  alignItems: "center",
                  gap: 0.75,
                  minWidth: 0,
                  maxWidth: { md: 340, lg: 480 },
                }}
              >
                <Typography
                  aria-hidden="true"
                  sx={{
                    color: "divider",
                    fontSize: "0.8125rem",
                    flexShrink: 0,
                  }}
                >
                  /
                </Typography>
                <Typography
                  component={RouterLink}
                  to="/"
                  sx={{
                    color: "text.disabled",
                    fontSize: "0.78125rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    flexShrink: 0,
                    borderRadius: 1,
                    "&:hover": { color: "secondary.main" },
                    "&:focus-visible": {
                      outline: "3px solid",
                      outlineColor: "primary.main",
                      outlineOffset: 2,
                    },
                  }}
                >
                  Workspace
                </Typography>
                <Typography
                  aria-hidden="true"
                  sx={{
                    color: "divider",
                    fontSize: "0.8125rem",
                    flexShrink: 0,
                  }}
                >
                  /
                </Typography>
                <Typography
                  noWrap
                  title={breadcrumbTitle}
                  aria-current="page"
                  sx={{
                    minWidth: 0,
                    color: "text.secondary",
                    fontSize: "0.78125rem",
                    fontWeight: 650,
                  }}
                >
                  {breadcrumbTitle}
                </Typography>
              </Box>
            )}

            <Box sx={{ flex: 1 }} />

            {!isNewForm && (
              <Button
                component={RouterLink}
                to="/forms/new"
                variant="outlined"
                color="secondary"
                sx={{
                  px: { xs: 1.5, sm: 2 },
                  borderWidth: "1.5px",
                  borderColor: "secondary.main",
                  color: "secondary.main",
                  bgcolor: "transparent",
                  "&:hover": {
                    borderWidth: "1.5px",
                    borderColor: "secondary.main",
                    bgcolor: "secondary.main",
                    color: "common.white",
                  },
                }}
              >
                New form
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {!online && (
        <Alert
          icon={<WifiOffOutlinedIcon />}
          severity="warning"
          square
          role="status"
          sx={{
            borderRadius: 0,
            justifyContent: "center",
            borderBottom: "1px solid",
            borderColor: "warning.main",
          }}
        >
          You’re offline. Saved data may be out of date, and changes will remain
          on this device until you reconnect.
        </Alert>
      )}

      <Box
        component="main"
        id="main-content"
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: isEditorRoute ? "none" : 1440,
          mx: "auto",
          px: isEditorRoute ? 0 : { xs: 2, sm: 2.5, md: 3, lg: 4 },
          py: isEditorRoute ? 0 : { xs: 3, md: 4 },
        }}
      >
        <Outlet
          context={{
            isOpen: chatPanel.isOpen,
            open: chatPanel.open,
            close: chatPanel.close,
            toggle: chatPanel.toggle,
            width: chatPanel.width,
            portalNode: chatPortalNode,
          }}
        />
      </Box>

      {!isEditorRoute && (
        <Box
          component="footer"
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              gap={1}
              sx={{ py: 2.5 }}
            >
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} FormFlow
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Clear forms. Confident responses.
              </Typography>
            </Stack>
          </Container>
        </Box>
      )}

      {assistantAvailable && !chatPanel.isOpen && (
        <Button
          type="button"
          variant="contained"
          color="secondary"
          aria-label="Open AI Assistant"
          aria-controls="form-assistant-panel"
          aria-expanded={false}
          onClick={chatPanel.open}
          sx={{
            position: "fixed",
            insetInlineEnd: 0,
            insetBlockStart: "50%",
            zIndex: (muiTheme) => muiTheme.zIndex.appBar + 1,
            width: 48,
            minWidth: 48,
            minHeight: 156,
            px: 0,
            py: 1.5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.25,
            border: "1px solid rgba(255, 255, 255, 0.16)",
            borderInlineEnd: 0,
            borderRadius: "12px 0 0 12px",
            transform: "translateY(-50%)",
            bgcolor: "secondary.main",
            color: "common.white",
            boxShadow: "0 10px 28px rgba(30, 22, 80, 0.24)",
            touchAction: "manipulation",
            "&:hover": {
              bgcolor: "secondary.dark",
              boxShadow: "0 12px 32px rgba(30, 22, 80, 0.3)",
            },
            "&:focus-visible": {
              outline: "3px solid",
              outlineColor: "primary.main",
              outlineOffset: -4,
            },
          }}
        >
          <AutoAwesomeRoundedIcon
            aria-hidden="true"
            sx={{ flexShrink: 0, fontSize: 19 }}
          />
          <Typography
            component="span"
            aria-hidden="true"
            sx={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              whiteSpace: "nowrap",
              fontSize: "0.72rem",
              lineHeight: 1,
              fontWeight: 750,
              letterSpacing: "0.045em",
            }}
          >
            AI Assistant
          </Typography>
        </Button>
      )}

      <ChatDock
        open={chatPanel.isOpen}
        width={chatPanel.width}
        isResizing={chatPanel.isResizing}
        onWidthChange={chatPanel.setWidth}
        onResizingChange={chatPanel.setResizing}
        registerPortalNode={setChatPortalNode}
      />
    </Box>
  );
};
