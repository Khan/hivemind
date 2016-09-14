import React, { Component, PropTypes } from 'react';
import Portal from 'react-portal';
import { browserHistory } from 'react-router';
import URLSearchParams from 'url-search-params';

import Entry from './Entry.jsx';
import EntryCell from './EntryCell.jsx';

export default (props) => {
  const clearFocusedEntry = (event) => {
    let newURL = new URL(document.location);
    const params = new URLSearchParams(newURL.search.slice(1));
    params.delete("entry");
    newURL.search = params.toString();
    browserHistory.replace(newURL.toString());
    event.preventDefault();
  };

  const { focusedEntry } = props;
  return <div className="entryList">
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
    <Portal closeOnEsc closeOnOutsideClick isOpened={!!focusedEntry} className="lightbox" onClose={clearFocusedEntry}>
      {focusedEntry ? <Entry
        key={focusedEntry._id}
        entry={focusedEntry}
        onChange={props.onChangeEntry}
        onDelete={() => props.onDeleteEntry(focusedEntry._id)}
        onDropImage={(files, callback) => props.onDropImage(focusedEntry._id, files, callback) }
        onChangeRecommending={(isNewlyRecommending) => props.onChangeRecommending(focusedEntry._id, isNewlyRecommending)}
        onChangeViewing={(isNewlyViewing) => props.onChangeViewing(focusedEntry._id, isNewlyViewing)}
        onChangeURL={(newURL) => props.onChangeURL(focusedEntry._id, newURL)}
        onStartDiscussionThread={() => {props.onStartDiscussionThread(focusedEntry._id)}}
        disabled={props.disabled}
      /> : "" }
    </Portal>
  </div>
};
