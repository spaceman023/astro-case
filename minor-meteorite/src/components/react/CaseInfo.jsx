import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

import React, { useState, useEffect } from 'react';
const CaseInfo = (props) => {
  const dummyData = {
    caseNumber: '12345',
    title: 'Case Title',
    description: 'Case description',
    assignedTo: 'John Doe',
  };
  const [caseData, setCaseData] = useState(dummyData);
  const handleChange = (event) => {
    // Update the state with the new value for the field
  };

  return (
    <div>
      <List>
        <ListItem>
          <TextField type="text" label="Case Number" value={caseData.caseNumber} onChange={handleChange} />
        </ListItem>
        <ListItem>
          <TextField type="text" label="Title" defaultValue={caseData.title} onChange={handleChange} />
        </ListItem>
        <ListItem>
          <TextField type="text" label="Description" value={caseData.description} onChange={handleChange} />
        </ListItem>
        <ListItem>
          <TextField type="text" label="Assigned To" value={caseData.assignedTo} onChange={handleChange} />
        </ListItem>
      </List>
    </div>
  );
};

export default CaseInfo;
