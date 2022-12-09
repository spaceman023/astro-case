import React, { useState, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import { TextField, Typography } from '@mui/material';
const CaseCharges = ({ caseId }) => {
  caseId = `1`;
  const dummyData = [
    {
      id: 1,
      case_id: caseId,
      charge_name: 'Assault',
      charge_date: '2022-12-01',
      disposition: 'guilty',
      defendant: {
        id: 1,
        name: 'John Doe',
        dob: '1995-01-01',
        address: '123 Main St',
      },
    },
    {
      id: 2,
      case_id: caseId,
      charge_name: 'Burglary',
      charge_date: '2022-12-03',
      disposition: 'guilty',
      defendant: {
        id: 1,
        name: 'John Doe',
        dob: '1995-01-01',
        address: '123 Main St',
      },
    },
    {
      id: 3,
      case_id: caseId,
      charge_name: 'Robbery',
      charge_date: '2022-12-05',
      disposition: 'not guilty',
      defendant: {
        id: 2,
        name: 'Jane Smith',
        dob: '1990-05-15',
        address: '456 Park Ave',
      },
    },
  ];
  const [charges, setCharges] = useState(dummyData);

  // Handle changes to the data in the table
  const handleChange = (chargeId, field, value) => {
    // Find the charge with the specified ID in the charges array
    const chargeIndex = charges.findIndex((charge) => charge.id === chargeId);
    // Create a copy of the charges array
    const newCharges = [...charges];
    // Update the value of the specified field in the charge
    newCharges[chargeIndex][field] = value;
    // Set the updated charges array as the new value of the charges state variable
    setCharges(newCharges);
  };
  // useEffect(() => {
  //   // Fetch all of the events for the given case
  //   fetch(`/api/cases/${caseId}/events`)
  //     .then((response) => response.json())
  //     .then((data) => setEvents(data));
  // }, [caseId]);
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Charge Name</TableCell>
          <TableCell>Charge Date</TableCell>
          <TableCell>Disposition</TableCell>
          <TableCell>Defendant</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {charges.map((charge) => (
          <TableRow key={charge.id}>
            <TableCell>
              <TextField value={charge.charge_name} onChange={(e) => handleChange(charge.id, 'charge_name', e.target.value)} />
            </TableCell>
            <TableCell>
              <TextField value={charge.charge_date} onChange={(e) => handleChange(charge.id, 'charge_date', e.target.value)} />
            </TableCell>
            <TableCell>
              <TextField value={charge.disposition} onChange={(e) => handleChange(charge.id, 'disposition', e.target.value)} />
            </TableCell>
            <TableCell>
              <Typography>{charge.defendant.name}</Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CaseCharges;
