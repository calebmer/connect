import {communicateTime} from "../communicateTime";

// https://en.wikipedia.org/wiki/The_Impossible_Astronaut
const baseTime = Date.parse("2011-04-22 16:30:00");

const minute = 1000 * 60;
const hour = minute * 60;
const day = hour * 24;
const month = day * 31;
const year = day * 365;

test("shows years for a date 5 years ago", () => {
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - year * 5)),
  ).toEqual("5 years");
});

test("shows years for a date 1 year ago", () => {
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - year)),
  ).toEqual("1 year");
});

test("shows years for a date 12 months ago", () => {
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - month * 12)),
  ).toEqual("1 year");
});

test("shows months for a date 3 months ago", () => {
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - month * 3)),
  ).toEqual("3 months");
});

test("shows months for a date 1 month ago", () => {
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - month)),
  ).toEqual("1 month");
});

test("shows days for a date 5 days ago", () => {
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - day * 5)),
  ).toEqual("5 days");
});

test("shows yesterday for a date 1 day ago", () => {
  expect(communicateTime(new Date(baseTime), new Date(baseTime - day))).toEqual(
    "1 day",
  );
});

test("shows days ago if today is the first day of a new month", () => {
  const baseTime = Date.parse("2011-04-01 16:30:00");
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - day * 5)),
  ).toEqual("5 days");
});

test("shows time for a date 5 hours ago", () => {
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - hour * 5)),
  ).toEqual("11:30am");
});

test("shows time for a date 1 hour ago", () => {
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - hour)),
  ).toEqual("3:30pm");
});

test("shows time for a date 5 minutes ago", () => {
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - minute * 5)),
  ).toEqual("4:25pm");
});

test("shows time for a date 1 minute ago", () => {
  expect(
    communicateTime(new Date(baseTime), new Date(baseTime - minute)),
  ).toEqual("4:29pm");
});

test("shows in local time", () => {
  const currentTime = new Date("2011-04-22T16:30:00-01:00");
  const time = new Date("2011-04-22T16:30:00-04:00");

  expect(communicateTime(currentTime, time)).toEqual("1:30pm");
});
