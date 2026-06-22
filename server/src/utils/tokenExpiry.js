export function getTokenExpiry(expiresIn = process.env.JWT_EXPIRES_IN || "7d") {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  const now = new Date();

  if (!match) {
    now.setDate(now.getDate() + 7);
    return now;
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d":
      now.setDate(now.getDate() + value);
      break;
    case "h":
      now.setHours(now.getHours() + value);
      break;
    case "m":
      now.setMinutes(now.getMinutes() + value);
      break;
    case "s":
      now.setSeconds(now.getSeconds() + value);
      break;
    default:
      now.setDate(now.getDate() + 7);
  }

  return now;
}
