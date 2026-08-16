import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { FC, ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";

const focusRing = {
  outline: "3px solid #2354D8",
  outlineOffset: "2px",
};

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#2354D8",
      light: "#EAF0FF",
      dark: "#173EA4",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#0F766E",
      light: "#E7F6F4",
      dark: "#0A5B55",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F3F6F8",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#172033",
      secondary: "#58657A",
      disabled: "#7C8799",
    },
    divider: "#D7DEE7",
    success: {
      main: "#067647",
      light: "#ECFDF3",
      dark: "#055E39",
    },
    warning: {
      main: "#9A6700",
      light: "#FFF8E1",
      dark: "#724B00",
    },
    error: {
      main: "#B42318",
      light: "#FEF3F2",
      dark: "#8A1C13",
    },
    action: {
      hover: "rgba(35, 84, 216, 0.06)",
      selected: "rgba(35, 84, 216, 0.10)",
      disabledBackground: "#E7EBF0",
      disabled: "#667085",
    },
  },
  shape: {
    borderRadius: 10,
  },
  spacing: 8,
  typography: {
    fontFamily: '"Public Sans Variable", "Segoe UI", Roboto, Arial, sans-serif',
    h1: {
      fontFamily: '"Sora Variable", "Avenir Next", "Segoe UI", sans-serif',
      fontSize: "2rem",
      lineHeight: 1.25,
      fontWeight: 650,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontFamily: '"Sora Variable", "Avenir Next", "Segoe UI", sans-serif',
      fontSize: "1.5rem",
      lineHeight: 1.333,
      fontWeight: 650,
      letterSpacing: "-0.015em",
    },
    h3: {
      fontFamily: '"Sora Variable", "Avenir Next", "Segoe UI", sans-serif',
      fontSize: "1.25rem",
      lineHeight: 1.4,
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontFamily: '"Sora Variable", "Avenir Next", "Segoe UI", sans-serif',
      fontSize: "1.125rem",
      lineHeight: 1.444,
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Sora Variable", "Avenir Next", "Segoe UI", sans-serif',
      fontSize: "1rem",
      lineHeight: 1.5,
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Sora Variable", "Avenir Next", "Segoe UI", sans-serif',
      fontSize: "0.875rem",
      lineHeight: 1.428,
      fontWeight: 600,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.428,
    },
    subtitle1: {
      fontSize: "1rem",
      lineHeight: 1.5,
      fontWeight: 600,
    },
    subtitle2: {
      fontSize: "0.875rem",
      lineHeight: 1.428,
      fontWeight: 600,
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
      fontWeight: 500,
      letterSpacing: "0.01em",
    },
    button: {
      textTransform: "none",
      fontSize: "0.875rem",
      lineHeight: 1.428,
      fontWeight: 650,
      letterSpacing: 0,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F3F6F8",
          color: "#172033",
        },
        "h1, h2, h3, h4, h5, h6": {
          scrollMarginTop: "96px",
        },
        "::selection": {
          backgroundColor: "#DCE6FF",
          color: "#172033",
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableTouchRipple: false,
      },
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": focusRing,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 44,
          borderRadius: 10,
          padding: "10px 16px",
          whiteSpace: "nowrap",
          transition:
            "background-color 120ms cubic-bezier(0.2, 0, 0, 1), border-color 120ms cubic-bezier(0.2, 0, 0, 1), color 120ms cubic-bezier(0.2, 0, 0, 1)",
          "&:focus-visible": focusRing,
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#173EA4",
          },
        },
        outlined: {
          borderColor: "#7C8799",
          "&:hover": {
            borderColor: "#2354D8",
            backgroundColor: "#F5F8FF",
          },
        },
        text: {
          "&:hover": {
            backgroundColor: "#F5F8FF",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 44,
          height: 44,
          borderRadius: 10,
          "&:focus-visible": focusRing,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #D7DEE7",
          borderRadius: 14,
          backgroundImage: "none",
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        rounded: {
          borderRadius: 14,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 10,
          backgroundColor: "#FFFFFF",
          fontSize: "1rem",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#7C8799",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#58657A",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
            borderColor: "#2354D8",
          },
          "&.Mui-focused": focusRing,
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
            borderColor: "#B42318",
          },
          "@media (max-width: 767.95px)": {
            minHeight: 52,
          },
        },
        input: {
          padding: "12px 14px",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#58657A",
          "&.Mui-focused": {
            color: "#2354D8",
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginTop: 6,
          marginLeft: 0,
          marginRight: 0,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          minHeight: 28,
          borderRadius: 6,
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          alignItems: "center",
        },
        standardError: {
          backgroundColor: "#FEF3F2",
          color: "#7A271A",
        },
        standardWarning: {
          backgroundColor: "#FFF8E1",
          color: "#724B00",
        },
        standardSuccess: {
          backgroundColor: "#ECFDF3",
          color: "#055E39",
        },
        standardInfo: {
          backgroundColor: "#EAF0FF",
          color: "#173EA4",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: "0 20px 48px rgba(23, 32, 51, 0.16)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderLeft: "1px solid #D7DEE7",
          boxShadow: "0 8px 24px rgba(23, 32, 51, 0.10)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.75rem",
          lineHeight: 1.5,
          borderRadius: 6,
          backgroundColor: "#172033",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          height: 44,
          color: "#58657A",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          borderBottomColor: "#D7DEE7",
        },
        body: {
          height: 64,
          borderBottomColor: "#E7EBF0",
        },
      },
    },
  },
});

interface AppThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider: FC<AppThemeProviderProps> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
);
