import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import React, { useState, useEffect } from 'react';
//import List, ListItem and ListItemText from mui

const CaseEvents = ({ caseId }) => {
  const dummyData = [
    {
      id: 1,
      event_type: 'Court hearing',
      event_date: '2022-12-10',
      event_location: 'San Francisco, CA',
    },
    {
      id: 2,
      event_type: 'Meeting with lawyer',
      event_date: '2022-12-12',
      event_location: 'San Francisco, CA',
    },
    {
      id: 3,
      event_type: 'Mediation',
      event_date: '2022-12-15',
      event_location: 'San Francisco, CA',
    },
  ];
  const [events, setEvents] = useState(dummyData);
  // useEffect(() => {
  //   // Fetch all of the events for the given case
  //   fetch(`/api/cases/${caseId}/events`)
  //     .then((response) => response.json())
  //     .then((data) => setEvents(data));
  // }, [caseId]);

  return (
    <List>
      {events.map((event) => (
        <ListItem key={event.id}>
          <ListItemText primary={event.event_type} secondary={`${event.event_date} - ${event.event_location}`} />
        </ListItem>
      ))}
    </List>
  );
};

export default CaseEvents;
