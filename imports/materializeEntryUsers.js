export default function(entry) {
  if (entry.recommenders) {
    entry.recommenders = entry.recommenders.map((recommenderID) => {
      // TODO: This is pretty pathological, perf-wise, but probably doesn't matter in the short term.
      return Meteor.users.findOne(recommenderID);
    })
  }
  return entry;
}
