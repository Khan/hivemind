import { Entries, entryUploadPath } from './entries.js';

import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';
import MetaInspector from 'node-metainspector';

export default function () {
  if (Meteor.isServer) {
    Notifications = require('../server/notifications.js');
    fs = require('fs');
    path = require('path');
    request = require('request');
    stream = require('stream');
  }

  Meteor.methods({
    "entry.create"({tags}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      const entryID = Entries.insert({
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: tags
      });

      return entryID;
    },

    "entry.update"({entryID, newEntry}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      const filteredEntry = {
        title: newEntry.title,
        author: newEntry.author,
        tags: newEntry.tags,
        imageURL: newEntry.imageURL,
        description: newEntry.description,
        updatedAt: new Date(),
      };

      Entries.update(entryID, {$set: filteredEntry});
    },

    "entry.setImage"({entryID, imageURL}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      Entries.update(entryID, {$set: {
        imageURL,
        updatedAt: new Date(),
      }});
    },

    "entry.setURL"({entryID, URL}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      if (Meteor.isServer) {
        let client = new MetaInspector(URL, { timeout: 5000 });
        client.on("fetch", Meteor.bindEnvironment(() => {
          // OK, so what I'm doing here is not good. It's race-y. I know it's race-y. But I think it's gonna be fine anyway.
          const entry = Entries.findOne(entryID);
          if (entry) {
            let updates = {}
            if ((!entry.title || entry.title === "") && (client.title || client.ogTitle)) {
              updates.title = client.ogTitle || client.title;
            }
            if ((!entry.author || entry.author === "") && client.author) {
              updates.author = client.author;
            }

            if (Object.keys(updates).length > 0) {
              Meteor.call("entry.update", {entryID: entryID, newEntry: updates});
            }

            if ((!entry.imageURL || entry.imageURL === "") && client.image) {
              const extension = path.extname(path.basename(client.image));
              const outputPath = `/tmp/${Random.id()}${extension}`;
              const file = fs.createWriteStream(outputPath);
              console.log(`Getting ${client.image}`);
              request(client.image)
                .pipe(file)
                .on("finish", Meteor.bindEnvironment((err) => {
                  console.log(`Downloaded to ${outputPath}`);
                  if (err) {
                    file.end();
                    console.error(err);
                  } else {
                    S3.knox.putFile(outputPath, `/${S3.config.bucket}/${entryUploadPath}/${Meteor.uuid()}${extension}`, Meteor.bindEnvironment((err, res) => {
                      if (res) {
                        Meteor.call("entry.setImage", {entryID, imageURL: res.socket._httpMessage.url})
                      } else {
                        console.error(`Failed to upload ${client.image}: ${err}`);
                      }
                    }));
                  }
                }));
            }
          }
        }));
        client.on("error", function(err){
            console.log(err);
        });
        client.fetch();
      }

      Entries.update(entryID, {$set: {URL: URL}});
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
      Entries.update(entryID, {$set: {updatedAt: new Date()}});
    },

    "entry.updateViewer"({entryID, isNewlyViewing}) {
      if (!this.userId) { throw new Meteor.Error('not-authorized'); }

      if (isNewlyViewing) {
        Entries.update(entryID, {$addToSet: {viewers: this.userId}});
      } else {
        Entries.update(entryID, {$pull: {viewers: this.userId}});
      }
      Entries.update(entryID, {$set: {updatedAt: new Date()}});
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
        Entries.update(entryID, {$set: {
          mailingListID: entryID,
          updatedAt: new Date(),
        }});
      }
    },

    "entries.fetchAllTagEntriesSortedDescending"() {
      if (Meteor.isServer) {
        return Entries.aggregate([
          {$project: {tags: 1}},
          {$unwind: "$tags"},
          {$group: {
            _id: "$tags",
            count: { $sum: 1 },
          }},
          {$sort: {count: -1}},
        ]).map((entry) => {
          return {tag: entry._id, count: entry.count}
        });
      } else {
        return [];
      }
    },
  });
}
