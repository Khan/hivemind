import React, { Component, PropTypes } from 'react';
import Portal from 'react-portal';
import { browserHistory } from 'react-router';
import URLSearchParams from 'url-search-params';

import Entry from './Entry.jsx';
import EntryCell from './EntryCell.jsx';

export default class EntryList extends React.Component {
  render() {
    const props = this.props;

    const clearFocusedEntry = (event) => {
      let newURL = new URL(document.location);
      const params = new URLSearchParams(newURL.search.slice(1));
      params.delete("entry");
      newURL.search = params.toString();
      browserHistory.replace(newURL.toString());

      if (event) {
        event.preventDefault();
      }
    };

    const propsForEntry = (entry) => {
      return {
        key: entry._id,
        entry,
        onChange: props.onChangeEntry,
        onDelete: () => {
          clearFocusedEntry();
          props.onDeleteEntry(entry._id);
        },
        onDropImage: (files, callback) => props.onDropImage(entry._id, files, callback),
        onChangeRecommending: (isNewlyRecommending) => props.onChangeRecommending(entry._id, isNewlyRecommending),
        onChangeViewing: (isNewlyViewing) => props.onChangeViewing(entry._id, isNewlyViewing),
        onChangeURL: (newURL) => props.onChangeURL(entry._id, newURL),
        onStartDiscussionThread: () => {props.onStartDiscussionThread(entry._id)},
        disabled: props.disabled,
      };
    };

    const { focusedEntry } = props;
    return <div className="entryList">
      {props.entries.map((entry) => (
        <EntryCell
          {...propsForEntry(entry)}
        />
      ))}
      <Portal closeOnEsc isOpened={!!focusedEntry} onClose={clearFocusedEntry} ref="lightbox">
        <div className="lightbox" onClick={(event) => {
            if (event.target === this.refs.lightboxBackground) {
              this.refs.lightbox.closePortal();
              event.stopPropagation();
            }
        }} ref="lightboxBackground">
          {focusedEntry ? (<Entry
            {...propsForEntry(focusedEntry)}
            allTags={this.props.tags}
          />) : "" }
        </div>
      </Portal>
    </div>;
  }
};
