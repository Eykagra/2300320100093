import { createTheme } from "@mui/material/styles";

// A clean, premium theme inspired by modern product UIs (Linear / Vercel):
// a restrained neutral palette, crisp typography, soft shadows, and generous
// rounded corners. Built entirely on Material UI as required.
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#5b5bd6", dark: "#4a4ac4", light: "#7b7be0" },
    secondary: { main: "#0ea5e9" },
    success: { main: "#16a34a" },
    warning: { main: "#f59e0b" },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
    text: {
      primary: "#18181b",
      secondary: "#71717a",
    },
    divider: "rgba(0, 0, 0, 0.06)",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:
            "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});

export default theme;
