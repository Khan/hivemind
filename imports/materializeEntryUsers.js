function findUserByID(userID) {
  return Meteor.users.findOne(userID);
}

export default function(entry) {
  // TODO: This is pretty pathological, perf-wise, but probably doesn't matter in the short term.
  if (entry.recommenders) {
    entry.recommenders = entry.recommenders.map(findUserByID);
  }
  if (entry.viewers) {
    entry.viewers = entry.viewers.map(findUserByID);
  }
  return entry;
}
