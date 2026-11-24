import { createTheme } from '@mui/material/styles';

export const taantiraTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#641B32',
      dark: '#3D1023',
      light: '#A83F5E',
      contrastText: '#FFF9F2',
    },
    secondary: {
      main: '#C39A52',
      light: '#D9A0A9',
      contrastText: '#3D1023',
    },
    background: {
      default: '#FFF9F2',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3D1023',
      secondary: '#641B32',
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  shape: {
    borderRadius: 10,
  },
});
