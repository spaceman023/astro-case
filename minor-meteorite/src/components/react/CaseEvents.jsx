import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';

export default function CaseEvents({ evs }) {
  const [events, setEvents] = React.useState([]);
  React.useEffect(() => {
    const events = [];
    evs.forEach((e) => {
      events.push({
        id: e.id,
        eventId: e.id,
        eventName: e.name,
        eventType: e.type,
        eventDate: e.date,
        eventDescription: e.description,
        eventStatus: e.status,
      });
    });
    setEvents(events);
  }, []);

  const cols = [
    { field: 'eventId', headerName: 'ID', flex: 1 },
    { field: 'eventName', headerName: 'Name', flex: 1 },
    { field: 'eventType', headerName: 'Type', flex: 1 },
    { field: 'eventDate', headerName: 'Date', flex: 1 },
    { field: 'eventDescription', headerName: 'Description', flex: 1 },
    { field: 'eventStatus', headerName: 'Status', flex: 1 },
  ];
  return <DataGrid rows={events} columns={cols} pageSize={5} checkboxSelection />;
}
