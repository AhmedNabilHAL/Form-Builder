import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AddIcon from "@mui/icons-material/Add";
import WifiOffOutlinedIcon from "@mui/icons-material/WifiOffOutlined";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";

import { BrandMark } from "../ui/BrandMark";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export const AppLayout = () => {
  const location = useLocation();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const online = useOnlineStatus();
  const isFormsHome = location.pathname === "/";
  const isEditorRoute =
    location.pathname === "/forms/new" ||
    /^\/forms\/[^/]+\/edit$/.test(location.pathname);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
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
          height: { xs: 56, md: 64 },
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
              }}
            >
              <BrandMark compact={mobile} />
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
                  borderBottomColor: isFormsHome ? "primary.main" : "transparent",
                  px: 1.5,
                }}
              >
                Forms
              </Button>
            )}

            <Box sx={{ flex: 1 }} />

            <Tooltip title="Help">
              <IconButton
                aria-label="Help"
                onClick={() =>
                  window.alert(
                    "FormFlow help is not connected yet. Use the form labels and inline guidance to complete each task."
                  )
                }
              >
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>

            <Button
              component={RouterLink}
              to="/forms/new"
              variant="contained"
              startIcon={!mobile ? <AddIcon /> : undefined}
              aria-label={mobile ? "Create new form" : undefined}
              sx={{
                minWidth: mobile ? 44 : undefined,
                px: mobile ? 1.25 : 2,
              }}
            >
              {mobile ? <AddIcon /> : "New form"}
            </Button>
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
          maxWidth: 1440,
          mx: "auto",
          px: { xs: 2, sm: 2.5, md: 3, lg: 4 },
          py: { xs: 3, md: 4 },
        }}
      >
        <Outlet />
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
    </Box>
  );
};
