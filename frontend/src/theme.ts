// src/theme.ts
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors'; // Example import for error color

// Create a theme instance.
const theme = createTheme({
  palette: {
    // mode: 'light', // or 'dark'
    primary: {
      // main: '#556cd6', // Default MUI Blue
       main: '#3f51b5', // Indigo - Professional & Calm
       // main: '#4CAF50', // Green - Growth & Positivity
       // main: '#0288d1', // Light Blue - Clean & Modern
    },
    secondary: {
      // main: '#19857b', // Default MUI Teal
       main: '#ffc107', // Amber - Contrasting Accent
       // main: '#f44336', // Red - Use sparingly for emphasis?
    },
    error: {
      main: red.A400, // Standard Material error red
    },
    // background: {
    //   default: '#f4f6f8', // Slightly off-white background
    //   paper: '#ffffff',
    // },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', // Default
    // Example: Customize heading font weight
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    // Example: Customize button text
    // button: {
    //   textTransform: 'none', // Less ALL CAPS
    //   fontWeight: 600,
    // }
  },
  shape: {
    borderRadius: 8, // Slightly rounder corners than default 4
  },
  // Example: Override default props for components globally
  components: {
    MuiButton: {
        defaultProps: {
            // disableElevation: true, // Flatter buttons
        },
        styleOverrides: {
            root: {
               textTransform: 'none', // Use normal case for buttons
               // borderRadius: 20, // More rounded buttons?
            }
        }
    },
     MuiCard: {
         styleOverrides: {
             root: {
                 // Add subtle shadow or border transitions on hover
                 transition: 'box-shadow 0.2s ease-in-out',
                 '&:hover': {
                    // boxShadow: '0 5px 15px rgba(0,0,0,0.1)' // Example hover shadow
                 }
             }
         }
     },
     MuiPaper: {
         defaultProps: {
             // elevation: 2, // Default elevation for Paper
         }
     },
     MuiTooltip: { // Make tooltips slightly nicer maybe
        styleOverrides: {
            tooltip: {
                // backgroundColor: 'rgba(0, 0, 0, 0.8)',
                // fontSize: '0.8rem',
            }
        }
     }
     // Add more component overrides as needed
  }
});

export default theme;