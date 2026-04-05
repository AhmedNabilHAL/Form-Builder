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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
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
        <Outlet />
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

            <Stack direction="row" spacing={2}>
              <Button
                component={RouterLink}
                to="/"
                color="inherit"
                size="small"
              >
                Home
              </Button>
              <Button
                component={RouterLink}
                to="/forms/new"
                color="inherit"
                size="small"
              >
                New Form
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};