import {Skimmer} from "../Skimmer";

const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const load = jest.fn(async ({offset, limit}) => {
  return items.slice(offset, offset + limit);
});

const e = undefined;

test("loads from the beginning", async () => {
  let skimmer = Skimmer.create({load});
  expect(skimmer.items).toEqual([]);
  skimmer = await skimmer.load({offset: 0, limit: 3});
  expect(skimmer.items).toEqual([0, 1, 2]);
  expect(load.mock.calls).toEqual([[{offset: 0, limit: 3}]]);
});

test("loads from the end", async () => {
  let skimmer = Skimmer.create({load});
  expect(skimmer.items).toEqual([]);
  skimmer = await skimmer.load({offset: 7, limit: 3});
  expect(skimmer.items).toEqual([e, e, e, e, e, e, e, 7, 8, 9]);
  expect(load.mock.calls).toEqual([[{offset: 7, limit: 3}]]);
});

test("loads from the middle", async () => {
  let skimmer = Skimmer.create({load});
  expect(skimmer.items).toEqual([]);
  skimmer = await skimmer.load({offset: 3, limit: 3});
  expect(skimmer.items).toEqual([e, e, e, 3, 4, 5]);
  expect(load.mock.calls).toEqual([[{offset: 3, limit: 3}]]);
});

test("will not load from the beginning twice", async () => {
  let skimmer = Skimmer.create({load});
  expect(skimmer.items).toEqual([]);
  skimmer = await skimmer.load({offset: 0, limit: 3});
  skimmer = await skimmer.load({offset: 0, limit: 3});
  expect(skimmer.items).toEqual([0, 1, 2]);
  expect(load.mock.calls).toEqual([[{offset: 0, limit: 3}]]);
});

test("will not load from the end twice", async () => {
  let skimmer = Skimmer.create({load});
  expect(skimmer.items).toEqual([]);
  skimmer = await skimmer.load({offset: 7, limit: 3});
  skimmer = await skimmer.load({offset: 7, limit: 3});
  expect(skimmer.items).toEqual([e, e, e, e, e, e, e, 7, 8, 9]);
  expect(load.mock.calls).toEqual([[{offset: 7, limit: 3}]]);
});

test("will not load from the middle twice", async () => {
  let skimmer = Skimmer.create({load});
  expect(skimmer.items).toEqual([]);
  skimmer = await skimmer.load({offset: 3, limit: 3});
  skimmer = await skimmer.load({offset: 3, limit: 3});
  expect(skimmer.items).toEqual([e, e, e, 3, 4, 5]);
  expect(load.mock.calls).toEqual([[{offset: 3, limit: 3}]]);
});

test("loads more after the current items", async () => {
  let skimmer = Skimmer.create({load});
  expect(skimmer.items).toEqual([]);
  skimmer = await skimmer.load({offset: 0, limit: 3});
  expect(skimmer.items).toEqual([0, 1, 2]);
  skimmer = await skimmer.load({offset: 0, limit: 6});
  expect(skimmer.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  expect(load.mock.calls).toEqual([
    [{offset: 0, limit: 3}],
    [{offset: 3, limit: 6}],
  ]);
});

test("loads more before the current items", async () => {
  let skimmer = Skimmer.create({load});
  expect(skimmer.items).toEqual([]);
  skimmer = await skimmer.load({offset: 6, limit: 3});
  expect(skimmer.items).toEqual([e, e, e, e, e, e, 6, 7, 8]);
  skimmer = await skimmer.load({offset: 3, limit: 6});
  expect(skimmer.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  expect(load.mock.calls).toEqual([
    [{offset: 6, limit: 3}],
    [{offset: 0, limit: 6}],
  ]);
});

test("loads more to fill out an items list", async () => {
  let skimmer = Skimmer.create({load});
  expect(skimmer.items).toEqual([]);
  skimmer = await skimmer.load({offset: 7, limit: 3});
  expect(skimmer.items).toEqual([e, e, e, e, e, e, e, 7, 8, 9]);
  skimmer = await skimmer.load({offset: 0, limit: 3});
  expect(skimmer.items).toEqual([0, 1, 2, e, e, e, e, 7, 8, 9]);
  skimmer = await skimmer.load({offset: 0, limit: 10});
  expect(skimmer.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(load.mock.calls).toEqual([
    [{offset: 7, limit: 3}],
    [{offset: 0, limit: 3}],
    [{offset: 3, limit: 4}],
  ]);
});

test("will recognize when the end of a list is reached", async () => {
  let skimmer = Skimmer.create({load});
  expect(skimmer.items).toEqual([]);
  skimmer = await skimmer.load({offset: 7, limit: 3});
  expect(skimmer.items).toEqual([e, e, e, e, e, e, e, 7, 8, 9]);
  skimmer = await skimmer.load({offset: 8, limit: 3});
  skimmer = await skimmer.load({offset: 8, limit: 3});
  skimmer = await skimmer.load({offset: 8, limit: 6});
  expect(skimmer.items).toEqual([e, e, e, e, e, e, e, 7, 8, 9]);
  expect(load.mock.calls).toEqual([
    [{offset: 7, limit: 3}],
    [{offset: 10, limit: 3}],
  ]);
});

test("loads limit number of items after outside of the initial range", async () => {
  let skimmer = Skimmer.create({load});
  skimmer = await skimmer.load({offset: 0, limit: 5});
  expect(skimmer.items).toEqual([0, 1, 2, 3, 4]);
  skimmer = await skimmer.load({offset: 2, limit: 5});
  expect(skimmer.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(load.mock.calls).toEqual([
    [{offset: 0, limit: 5}],
    [{offset: 5, limit: 5}],
  ]);
});

test("loads limit number of items before outside of the initial range", async () => {
  let skimmer = Skimmer.create({load});
  skimmer = await skimmer.load({offset: 5, limit: 5});
  expect(skimmer.items).toEqual([e, e, e, e, e, 5, 6, 7, 8, 9]);
  skimmer = await skimmer.load({offset: 3, limit: 5});
  expect(skimmer.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(load.mock.calls).toEqual([
    [{offset: 5, limit: 5}],
    [{offset: 0, limit: 5}],
  ]);
});

test("loads a small gap of items", async () => {
  let skimmer = Skimmer.create({load});
  skimmer = await skimmer.load({offset: 0, limit: 3});
  skimmer = await skimmer.load({offset: 4, limit: 3});
  expect(skimmer.items).toEqual([0, 1, 2, e, 4, 5, 6]);
  skimmer = await skimmer.load({offset: 2, limit: 3});
  expect(skimmer.items).toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(load.mock.calls).toEqual([
    [{offset: 0, limit: 3}],
    [{offset: 4, limit: 3}],
    [{offset: 3, limit: 1}],
  ]);
});
