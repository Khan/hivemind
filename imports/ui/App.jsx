import Immutable from 'immutable'
import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import {EJSON} from 'meteor/ejson'

import { Entries } from '../api/entries.js';
import Entry from './Entry.jsx';

// App component - represents the whole app
class App extends Component {
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
          this.handleEntryChange({...entry, imageURL: result.secure_url})
          console.log(`Uploaded to ${result.secure_url}`);
        }
        callback();
      });
    }
  }

  handleEntryChange(newEntry) {
    const serializedEntry = {
      title: newEntry.title,
      author: newEntry.author,
      URL: newEntry.URL,
      tags: newEntry.tags,
      imageURL: newEntry.imageURL,
      // The description is fancy--can't store it directly.
      description: EJSON.stringify(newEntry.description),
    };

    Entries.update(newEntry._id, {$set: serializedEntry});
  }

  addEntry() {
    Entries.insert({
      createdAt: new Date()
    });
  }

  deleteEntry(entry) {
    Entries.remove(entry._id)
  }

  renderEntries() {
    return this.props.entries.map((entry) => (
      <Entry
        key={entry._id}
        entry={entry}
        onChange={this.handleEntryChange}
        onDelete={() => this.deleteEntry(entry)}
        onDropImage={(files, callback) => this.onDropImage(entry, files, callback) }
      />
    ));
  }

  render() {
    return (
      <div className="container">
        <header>
          <h1>Entries</h1>
          <p>{this.props.tags.map((tag) => <span>#{tag}&nbsp;</span>)}</p> {/* TODO EXTRACT */}
        </header>
        <button onClick={this.addEntry}>Add Entry</button>
        {this.renderEntries()}
      </div>
    );
  }
}

App.propTypes = {
  entries: PropTypes.array.isRequired,
};

export default createContainer(() => {
  return {
    entries: Entries.find({}, {sort: [["createdAt", "desc"]]})
      .fetch() // A shame this can't stay lazy...
      // Deserialize the fancy description.
      .map((entry) => {
        const description = entry.description ? EJSON.parse(entry.description) : undefined
        return {...entry, description: description}
      }),
    tags: fetchAllTags(),
  };
}, App);

function fetchAllTags() {
  // TODO: Optimize. :)
  const allTagLists = Entries.find({}, {fields: {tags: 1}})
    .fetch()
    .map((entry) => Immutable.Iterable(entry.tags));
  const tags = new Set(Immutable.Iterable(allTagLists).flatten().toSet());
  return new Array(...tags).sort();
}
