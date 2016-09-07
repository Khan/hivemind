import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { EasySearch } from 'meteor/easy:search';

export const entryUploadPath = "entryImages";

export const Entries = new Mongo.Collection("entries");

export function relativeURLForEntryID(entryID) {
  return `entry/${entryID}`
}

export function publishCollections() {
  if (Meteor.isServer) {
    Meteor.publish("entries", () => Entries.find({}));
    Meteor.publish("entry", (id) => Entries.find(id));
  }
}

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
