import * as Validate from "../Validate";

test("validates a string", () => {
  expect(Validate.string("")).toBe(true);
  expect(Validate.string("foo")).toBe(true);
  expect(Validate.string(undefined)).toBe(false);
  expect(Validate.string(null)).toBe(false);
  expect(Validate.string(42)).toBe(false);
  expect(Validate.string({})).toBe(false);
});

test("validates an empty object", () => {
  expect(Validate.validateObject({}, {})).toBe(true);
  expect(Validate.validateObject({}, {a: 1})).toBe(true);
  expect(Validate.validateObject({}, {a: 1, b: 2})).toBe(true);
  expect(Validate.validateObject({}, null)).toBe(false);
  expect(Validate.validateObject({}, undefined)).toBe(false);
  expect(Validate.validateObject({}, [])).toBe(false);
  expect(Validate.validateObject({}, [1, 2])).toBe(false);
});

test("validates an object with some properties", () => {
  expect(Validate.validateObject({a: Validate.string}, {a: "foo"})).toBe(true);
  expect(Validate.validateObject({a: Validate.string}, {})).toBe(false);
  expect(Validate.validateObject({a: Validate.string}, {b: "foo"})).toBe(false);
  const validators = {a: Validate.string, b: Validate.string};
  expect(Validate.validateObject(validators, {a: "foo", b: "bar"})).toBe(true);
  expect(Validate.validateObject(validators, {a: "foo"})).toBe(false);
  expect(Validate.validateObject(validators, {b: "bar"})).toBe(false);
  expect(Validate.validateObject(validators, {})).toBe(false);
  expect(Validate.validateObject(validators, {a: "foo", c: "bar"})).toBe(false);
  expect(Validate.validateObject(validators, {c: "foo", b: "bar"})).toBe(false);
  expect(Validate.validateObject(validators, {c: "foo", d: "bar"})).toBe(false);
});
