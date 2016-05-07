export function getUserFirstName(user) {
  return user.profile.name.split(" ")[0];
}
