import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { FC, ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";

const focusRing = {
  outline: "3px solid #5B50F7",
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
      main: "#5B50F7",
      light: "#F0EEFF",
      dark: "#4338CA",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#1E1650",
      light: "#F4F2FF",
      dark: "#120B3A",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#ECEAFF",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0E0B1F",
      secondary: "#5F5979",
      disabled: "#7C7697",
    },
    divider: "#E0DEFA",
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
      hover: "rgba(91, 80, 247, 0.07)",
      selected: "rgba(91, 80, 247, 0.12)",
      disabledBackground: "#E7E4F5",
      disabled: "#716B8C",
    },
  },
  shape: {
    borderRadius: 10,
  },
  spacing: 8,
  typography: {
    fontFamily: '"DM Sans Variable", "Segoe UI", Roboto, Arial, sans-serif',
    h1: {
      fontFamily: '"DM Sans Variable", "Segoe UI", sans-serif',
      fontSize: "2.125rem",
      lineHeight: 1.15,
      fontWeight: 760,
      letterSpacing: "-0.03em",
    },
    h2: {
      fontFamily: '"DM Sans Variable", "Segoe UI", sans-serif',
      fontSize: "1.625rem",
      lineHeight: 1.2,
      fontWeight: 740,
      letterSpacing: "-0.025em",
    },
    h3: {
      fontFamily: '"DM Sans Variable", "Segoe UI", sans-serif',
      fontSize: "1.25rem",
      lineHeight: 1.3,
      fontWeight: 720,
      letterSpacing: "-0.018em",
    },
    h4: {
      fontFamily: '"DM Sans Variable", "Segoe UI", sans-serif',
      fontSize: "1.125rem",
      lineHeight: 1.4,
      fontWeight: 700,
      letterSpacing: "-0.012em",
    },
    h5: {
      fontSize: "1rem",
      lineHeight: 1.5,
      fontWeight: 700,
    },
    h6: {
      fontSize: "0.875rem",
      lineHeight: 1.428,
      fontWeight: 700,
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
          backgroundColor: "#ECEAFF",
          color: "#0E0B1F",
        },
        "h1, h2, h3, h4, h5, h6": {
          scrollMarginTop: "96px",
        },
        "::selection": {
          backgroundColor: "#DAD6FF",
          color: "#0E0B1F",
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
          borderRadius: 7,
          padding: "10px 16px",
          whiteSpace: "nowrap",
          transition:
            "background-color 120ms cubic-bezier(0.2, 0, 0, 1), border-color 120ms cubic-bezier(0.2, 0, 0, 1), color 120ms cubic-bezier(0.2, 0, 0, 1)",
          "&:focus-visible": focusRing,
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#4338CA",
          },
        },
        outlined: {
          borderColor: "#8F88AE",
          "&:hover": {
            borderColor: "#5B50F7",
            backgroundColor: "#F7F6FF",
          },
        },
        text: {
          "&:hover": {
            backgroundColor: "#F7F6FF",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 44,
          height: 44,
          borderRadius: 7,
          "&:focus-visible": focusRing,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E0DEFA",
          borderRadius: 12,
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
          borderRadius: 12,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 7,
          backgroundColor: "#FFFFFF",
          fontSize: "1rem",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#8F88AE",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#5F5979",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
            borderColor: "#5B50F7",
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
          color: "#5F5979",
          "&.Mui-focused": {
            color: "#5B50F7",
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
          borderRadius: 4,
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 7,
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
          backgroundColor: "#F0EEFF",
          color: "#4338CA",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: "0 20px 56px rgba(30, 22, 80, 0.20)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderLeft: "1px solid #E0DEFA",
          boxShadow: "-10px 0 36px rgba(30, 22, 80, 0.14)",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.75rem",
          lineHeight: 1.5,
          borderRadius: 4,
          backgroundColor: "#1E1650",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          height: 44,
          color: "#5F5979",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          borderBottomColor: "#E0DEFA",
        },
        body: {
          height: 64,
          borderBottomColor: "#EFEDFB",
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
