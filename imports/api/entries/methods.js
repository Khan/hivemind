import { Entries } from './entries.js';

export default function () {
  if (Meteor.isServer) {
    Notifications = require('../server/notifications.js');
  }

  Meteor.methods({
    "entry.create"({tags}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      const entryID = Entries.insert({
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: tags
      });

      if (Meteor.isServer) {
        Notifications.scheduleNewEntryEmail(entryID, this.userId);
      }
    },

    "entry.update"({entryID, newEntry}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      const filteredEntry = {
        title: newEntry.title,
        author: newEntry.author,
        URL: newEntry.URL,
        tags: newEntry.tags,
        imageURL: newEntry.imageURL,
        description: newEntry.description,
        updatedAt: new Date(),
      };

      Entries.update(entryID, {$set: filteredEntry});
    },

    "entry.setImage"({entryID, imageURL}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      Entries.update(entryID, {$set: {imageURL}});
    },

    "entry.remove"({entryID}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      Entries.remove(entryID);
    },

    "entry.updateRecommender"({entryID, isNewlyRecommending}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      if (isNewlyRecommending) {
        Entries.update(entryID, {$addToSet: {recommenders: this.userId}});
      } else {
        Entries.update(entryID, {$pull: {recommenders: this.userId}});
      }
    },

    "entry.updateViewer"({entryID, isNewlyViewing}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      if (isNewlyViewing) {
        Entries.update(entryID, {$addToSet: {viewers: this.userId}});
      } else {
        Entries.update(entryID, {$pull: {viewers: this.userId}});
      }
    },
  });
}
