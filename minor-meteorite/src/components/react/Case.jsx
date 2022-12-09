import React from 'react';
import CaseInfo from './CaseInfo';
import CaseCharges from './CaseCharges';
import CaseEvents from './CaseEvents';
import CaseNotes from './CaseNotes';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// const theme = createTheme({
//   palette: {
//     background: {
//       default: '#451017',
//     },
//     text: {
//       primary: '#fff',
//       secondary: 'rgba(255, 255, 255, 0.7)',
//     },
//     primary: {
//       light: '#f3585f',
//       main: '#bb2035',
//       dark: '#840010',
//       contrastText: '#fff',
//     },
//     secondary: {
//       light: '#ffc374',
//       main: '#69246',
//       dark: '#be6316',
//       contrastText: '#000',
//     },
//   },
// });

const Case = ({ id }) => {
  return (
    // <ThemeProvider theme={theme}>
    //   <CssBaseline />
    <div className="container">
      <h2>Case</h2>
      <CaseInfo />
      <h2>Charges</h2>
      <CaseCharges caseId={id} />
      <h2>Events</h2>
      <CaseEvents caseId={id} />
      <h2>Notes</h2>
      <CaseNotes caseId={id} />
    </div>
    // </ThemeProvider>
  );
};

export default Case;
