import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { EasySearch } from 'meteor/easy:search';

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

export const EntriesIndex = new EasySearch.Index({
  collection: Entries,
  fields: ['title', 'author', 'description', 'tags'],
  engine: new EasySearch.Minimongo({
    selectorPerField: (field, string) => {
      if (field === "tags") {
        let regexp = /(?:#"(.+?)"|#(.+?)(?:\s|$))/g;
        let result;
        let tags = []
        while ((result = regexp.exec(string)) !== null) {
          tags.push(result[1] || result[2]);
        }
        return {tags: {$all: tags}};
      } else {
        let selector = {};
        // TODO: split words
        selector[field] = { '$regex' : `.*${string}.*`, '$options' : 'i'};
        return selector
      }
    },
  }),
});
