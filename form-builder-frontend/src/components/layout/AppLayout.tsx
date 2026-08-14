import { useCallback, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";

import { ChatDock } from "./ChatDock";
import type { ChatDockContextValue } from "./useChatDock";
import { useChatPanel } from "../../hooks/useChatPanel";

const Logo = () => {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "1rem",
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
        }}
      >
        F
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          FormFlow
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
          Form Builder
        </Typography>
      </Box>
    </Stack>
  );
};

const NavButton = ({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active?: boolean;
}) => {
  return (
    <Button
      component={RouterLink}
      to={to}
      color={active ? "primary" : "inherit"}
      sx={{
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </Button>
  );
};

export const AppLayout = () => {
  const location = useLocation();
  const chat = useChatPanel();
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  const registerPortalNode = useCallback(
    (node: HTMLElement | null) => setPortalNode(node),
    []
  );

  const dockApi: ChatDockContextValue = useMemo(
    () => ({
      isOpen: chat.isOpen,
      open: chat.open,
      close: chat.close,
      toggle: chat.toggle,
      width: chat.width,
      portalNode,
    }),
    [chat.isOpen, chat.open, chat.close, chat.toggle, chat.width, portalNode]
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        pr: chat.isOpen ? { xs: 0, sm: `${chat.width}px` } : 0,
        transition: chat.isResizing
          ? "none"
          : "padding-right 225ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 0, sm: 1 } }}>
            <Box
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: "none",
                color: "inherit",
                flexGrow: 1,
              }}
            >
              <Logo />
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <NavButton
                to="/"
                label="Home"
                active={location.pathname === "/"}
              />
              <NavButton
                to="/forms/new"
                label="Create Form"
                active={location.pathname === "/forms/new"}
              />
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: "80rem",
            mx: "auto",
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3 },
          }}
        >
          <Outlet context={dockApi} />
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          mt: 6,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              py: 3,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} FormFlow
            </Typography>
          </Box>
        </Container>
      </Box>

      <ChatDock
        open={chat.isOpen}
        width={chat.width}
        isResizing={chat.isResizing}
        onWidthChange={chat.setWidth}
        onResizingChange={chat.setResizing}
        registerPortalNode={registerPortalNode}
      />
    </Box>
  );
};