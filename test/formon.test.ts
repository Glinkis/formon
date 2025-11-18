import { expect, it } from "bun:test";
import { createFormHelper } from "../src/formon";

it("can handle a flat object shape", () => {
  interface Shape {
    id: number;
    name: string;
    isUser: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }

  const form = createFormHelper<Shape>({
    defaultValues: {
      name: "John",
      isUser: true,
      isAdmin: false,
    },
  });

  expect(form.register.id()).toEqual({
    name: "id",
  });

  expect(form.register.name()).toEqual({
    name: "name",
    defaultValue: "John",
  });

  expect(form.register.isUser()).toEqual({
    name: "isUser",
    defaultChecked: true,
  });

  expect(form.register.isAdmin()).toEqual({
    name: "isAdmin",
    defaultChecked: false,
  });

  expect(form.register.isSuperAdmin()).toEqual({
    name: "isSuperAdmin",
  });
});

it("can handle a flat object shape with multiple default values", () => {
  interface Shape {
    id: number;
    name: string;
    age: number;
  }

  const form = createFormHelper<Shape>({
    defaultValues: [
      { name: "John", age: 18 },
      { name: "Jane", age: 18 },
    ],
  });

  expect(form.register.id()).toEqual({
    name: "id",
  });

  expect(form.register.name()).toEqual({
    name: "name",
    readOnly: true,
  });

  expect(form.register.age()).toEqual({
    name: "age",
    defaultValue: "18",
  });
});

it("can handle a nested object shape", () => {
  interface Shape {
    id: number;
    user: {
      id: number;
      name: string;
      sites: string[];
    };
  }

  const form = createFormHelper<Shape>({
    defaultValues: {
      user: {
        name: "John",
        sites: ["site1", "site2"],
      },
    },
  });

  expect(form.register.id()).toEqual({
    name: "id",
  });

  expect(form.register.user.id()).toEqual({
    name: "user.id",
  });

  expect(form.register.user.name()).toEqual({
    name: "user.name",
    defaultValue: "John",
  });

  expect(form.register.user.sites.getIndex(0)()).toEqual({
    name: "user.sites[0]",
    defaultValue: "site1",
  });

  expect(form.register.user.sites.getIndex(1)()).toEqual({
    name: "user.sites[1]",
    defaultValue: "site2",
  });
});

it("can handle a nested indexed object shape", () => {
  const form = createFormHelper({
    defaultValues: {
      users: [{ name: "John" }, { name: "Jane" }],
    },
  });

  expect(form.register.users.getIndex(0).name()).toEqual({
    name: "users[0].name",
    defaultValue: "John",
  });

  expect(form.register.users.getIndex(1).name()).toEqual({
    name: "users[1].name",
    defaultValue: "Jane",
  });
});

it("can handle a nested indexed object shape with multiple default values", () => {
  const form = createFormHelper({
    defaultValues: [
      { users: [{ name: "John" }, { name: "Jane" }] }, //
      { users: [{ name: "John" }, { name: "Hans" }] },
    ],
  });

  expect(form.register.users.getIndex(0).name()).toEqual({
    name: "users[0].name",
    defaultValue: "John",
  });

  expect(form.register.users.getIndex(1).name()).toEqual({
    name: "users[1].name",
    readOnly: true,
  });
});

it("can handle multiple default values with different tree shapes", () => {
  const form = createFormHelper({
    defaultValues: [
      { id: 1, user: { age: 18, name: "Jane" } },
      { id: 1, user: { age: 18, name2: "Bob" } }, //
    ],
  });

  expect(form.register.id()).toEqual({
    name: "id",
    defaultValue: "1",
  });

  expect(form.register.user.name()).toEqual({
    name: "user.name",
    readOnly: true,
  });

  expect(form.register.user.age()).toEqual({
    name: "user.age",
    defaultValue: "18",
  });
});

it("accepts a callback to get the correct defualt value when using an unordered index", () => {
  const form = createFormHelper({
    defaultValues: {
      users: [
        { id: 456, name: "Bob" },
        { id: 123, name: "Jane" }, //
      ],
    },
  });

  expect(form.register.users.getIndex(123, ({ id }) => id).name()).toEqual({
    name: "users[123].name",
    defaultValue: "Jane",
  });

  expect(form.register.users.getIndex(456, ({ id }) => id).name()).toEqual({
    name: "users[456].name",
    defaultValue: "Bob",
  });
});

it("throws an error if the accessed property is a symbol", () => {
  const symbol = Symbol("Hey");

  const form = createFormHelper({
    defaultValues: {
      [symbol]: "value",
    },
  });

  expect(() => form.register[symbol]()).toThrowError("Symbol properties are not supported");
});
