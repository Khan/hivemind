import React, { Component, PropTypes } from 'react';

import Entry from './Entry.jsx';

export default (props) => (
  <div className="entryList">
    {props.entries.map((entry) => (
      <Entry
        key={entry._id}
        entry={entry}
        onChange={props.onChangeEntry}
        onDelete={() => props.onDeleteEntry(entry._id)}
        onDropImage={(files, callback) => props.onDropImage(entry._id, files, callback) }
      />
    ))}
  </div>
);
