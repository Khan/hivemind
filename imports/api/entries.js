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

const simpleSearchFields = ['title', 'author', 'description'];
export const EntriesIndex = new EasySearch.Index({
  collection: Entries,
  fields: simpleSearchFields,
  engine: new EasySearch.Minimongo({
    selector: (searchObject, options, aggregation) => {
      let selector = {};
      let searchString = null;
      selector[aggregation] = [];
      for (let entry in searchObject) {
        const field = entry;
        searchString = searchObject[field];

        // Remove any tags from the search string.
        const searchStringWithoutTags = searchString.replace(/\s?(?:#"(.+?)"|#(.+?)(?:\s|$))\s?/g, "");
        let fieldSelector = {};
        fieldSelector[field] = { '$regex' : `.*${searchStringWithoutTags}.*`, '$options' : 'i'};
        selector[aggregation].push(fieldSelector)
      }

      // Now: are there tags in the search string? If so, let's parse 'em out and put them together.
      let tagsSelector = null;
      if (searchString) {
        const tagRegexp = /(?:#"(.+?)"|#(.+?)(?:\s|$))/g;
        let result;
        let tags = [];
        while ((result = tagRegexp.exec(searchString)) !== null) {
          tags.push(result[1] || result[2]);
        }
        if (tags.length > 0) {
          tagsSelector = {tags: {$all: tags}};
        }
      }

      // If we're searching for a tag, $and that in. Otherwise, don't bother.
      if (tagsSelector) {
        selector = {"$and": [selector, tagsSelector]};
      }
      return selector;
    },
  }),
});
