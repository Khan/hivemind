import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Entries = new Mongo.Collection('entries');

Meteor.methods({
  "entry.update"({entryID, newEntry}) {
    const filteredEntry = {
      title: newEntry.title,
      author: newEntry.author,
      URL: newEntry.URL,
      tags: newEntry.tags,
      imageURL: newEntry.imageURL,
      description: newEntry.description,
    };

    Entries.update(entryID, {$set: filteredEntry});
  },

  "entry.setImage"({entryID, imageURL}) {
    Entries.update(entryID, {$set: {imageURL}});
  },

  "entry.remove"({entryID}) {
    Entries.remove(entryID);
  },
});
