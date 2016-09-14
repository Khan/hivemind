import React, { Component, PropTypes } from 'react';

import Entry from './Entry.jsx';
import EntryCell from './EntryCell.jsx';

export default (props) => (
  <div className="entryList">
    {props.entries.map((entry) => (
      <EntryCell
        key={entry._id}
        entry={entry}
        onChange={props.onChangeEntry}
        onDelete={() => props.onDeleteEntry(entry._id)}
        onDropImage={(files, callback) => props.onDropImage(entry._id, files, callback) }
        onChangeRecommending={(isNewlyRecommending) => props.onChangeRecommending(entry._id, isNewlyRecommending)}
        onChangeViewing={(isNewlyViewing) => props.onChangeViewing(entry._id, isNewlyViewing)}
        onChangeURL={(newURL) => props.onChangeURL(entry._id, newURL)}
        onStartDiscussionThread={() => {props.onStartDiscussionThread(entry._id)}}
        disabled={props.disabled}
      />
    ))}
  </div>
);
