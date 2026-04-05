import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { FC, ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";

export const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#673ab7",
      light: "#7e57c2",
      dark: "#512da8",
      contrastText: "#ffffff",
    },

    secondary: {
      main: "#5f6368",
    },

    background: {
      default: "#f6f3fb",
      paper: "#ffffff",
    },

    text: {
      primary: "#202124",
      secondary: "#5f6368",
    },

    divider: "#e6e1ee",

    success: {
      main: "#34a853",
    },

    error: {
      main: "#d93025",
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: `'Roboto', 'Arial', sans-serif`,

    h3: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },

    h4: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },

    h5: {
      fontWeight: 600,
    },

    h6: {
      fontWeight: 600,
    },

    subtitle1: {
      fontWeight: 500,
    },

    body1: {
      fontSize: "0.98rem",
      lineHeight: 1.6,
    },

    body2: {
      lineHeight: 1.5,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
  },

  spacing: 8,

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          background:
            "linear-gradient(180deg, #efe7fb 0%, #f6f3fb 220px, #f6f3fb 100%)",
        },
        "#root": {
          minHeight: "100vh",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: "none",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid #e6e1ee",
          boxShadow: "0 1px 2px rgba(32,33,36,0.08)",
          backgroundImage: "none",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: "8px 18px",
        },
        containedPrimary: {
          boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          borderRadius: 12,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#7e57c2",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.9)",
          color: "#202124",
          boxShadow: "0 1px 2px rgba(32,33,36,0.08)",
          backdropFilter: "blur(10px)",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

interface AppThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider: FC<AppThemeProviderProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};