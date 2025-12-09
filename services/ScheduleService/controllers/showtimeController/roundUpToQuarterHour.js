// Hàm làm tròn lên mốc 00, 15, 30, 45
function roundUpToQuarterHour(date) {
  const minutes = date.getMinutes();
  const remainder = minutes % 15;
  const adjustment = remainder === 0 ? 0 : 15 - remainder;

  date.setMinutes(minutes + adjustment);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

module.exports = roundUpToQuarterHour;

