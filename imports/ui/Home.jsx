import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import { Entries } from '../api/entries.js';
import EntryList from './EntryList.jsx';

// Represents the standard UI
class Home extends Component {
  constructor(props) {
    super(props)

    this.onDropImage = (entry, files, callback) => {
      S3.upload({
        files: files,
        path: "entryImages"
      }, (error, result) => {
        if (error) {
          console.error(error);
        } else {
          this.onChangeEntry({...entry, imageURL: result.secure_url})
          console.log(`Uploaded to ${result.secure_url}`);
        }
        callback();
      });
    }

    this.onChangeEntry = (newEntry) => {
      const serializedEntry = {
        title: newEntry.title,
        author: newEntry.author,
        URL: newEntry.URL,
        tags: newEntry.tags,
        imageURL: newEntry.imageURL,
        // The description is fancy--can't store it directly.
        description: newEntry.description,
      };

      Entries.update(newEntry._id, {$set: serializedEntry});
    };

    this.onDeleteEntry = (entry) => {
      Entries.remove(entry._id)
    }
  }

  addEntry() {
    Entries.insert({
      createdAt: new Date()
    });
  }

  render() {
    return (
      <div className="home">
        <button onClick={this.addEntry}>Add Entry</button>
        <EntryList
          entries={this.props.entries}
          onChangeEntry={this.onChangeEntry}
          onDeleteEntry={this.onDeleteEntry}
          onDropImage={this.onDropImage}
        />
      </div>
    );
  }
}

export default createContainer(() => {
  return {
    entries: Entries.find({}, {sort: [["createdAt", "desc"]]}).fetch(), // TODO: remove eagerness?
  };
}, Home);
