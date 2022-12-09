import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Checkbox from '@mui/material/Checkbox';

const CaseNotes = (props) => {
  const notes = [
    {
      id: 1,
      author: 'John Doe',
      content: 'This is the first note.',
      priority: true,
      date: '01/01/2022',
    },
    {
      id: 2,
      author: 'Jane Doe',
      content: 'This is the second note.',
      priority: false,
      date: '02/01/2022',
    },
    {
      id: 3,
      author: 'John Doe',
      content: 'This is the third note.',
      priority: true,
      date: '03/01/2022',
    },
  ];
  return (
    <List>
      {notes.map((note) => (
        <ListItem key={note.id}>
          <ListItemText primary={`${note.author} - ${note.date}`} secondary={note.content} />
        </ListItem>
      ))}
    </List>
  );
};

export default CaseNotes;
