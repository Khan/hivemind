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

    "entry.startDiscussionThread"({entryID}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      const entry = Entries.findOne(entryID);
      if (entry.mailingListID) {
        throw new Meteor.Error("Entries.methods.startDiscussionThread.alreadyStarted", "Discussion thread has already been started.");
      } else {
        if (Meteor.isServer) {
          Notifications.sendNewEntryEmail(entryID);
        }
        Entries.update(entryID, {$set: {mailingListID: entryID}});
      }
    },
  });
}
