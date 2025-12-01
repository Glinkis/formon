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

it("can handle a string default value", () => {
  const form = createFormHelper<string>({
    defaultValues: "Hello",
  });

  expect(form.register()).toEqual({
    name: "",
    defaultValue: "Hello",
  });
});

it("can handle a number default value", () => {
  const form = createFormHelper<number>({
    defaultValues: 42,
  });

  expect(form.register()).toEqual({
    name: "",
    defaultValue: "42",
  });
});

it("can handle a boolean default value", () => {
  const form = createFormHelper<boolean>({
    defaultValues: true,
  });

  expect(form.register()).toEqual({
    name: "",
    defaultChecked: true,
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

  expect(form.register.user.sites.at(0)()).toEqual({
    name: "user.sites[0]",
    defaultValue: "site1",
  });

  expect(form.register.user.sites.at(1)()).toEqual({
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

  expect(form.register.users.at(0).name()).toEqual({
    name: "users[0].name",
    defaultValue: "John",
  });

  expect(form.register.users.at(1).name()).toEqual({
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

  expect(form.register.users.at(0).name()).toEqual({
    name: "users[0].name",
    defaultValue: "John",
  });

  expect(form.register.users.at(1).name()).toEqual({
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

it("accepts a callback to get the correct default value when using an unordered index", () => {
  const form = createFormHelper({
    defaultValues: {
      users: [
        { id: 456, name: "Bob" },
        { id: 123, name: "Jane" }, //
      ],
    },
  });

  expect(form.register.users.at(123, ({ id }) => id).name()).toEqual({
    name: "users[123].name",
    defaultValue: "Jane",
  });

  expect(form.register.users.at(456, ({ id }) => id).name()).toEqual({
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

it("can handle empty objects as default values", () => {
  interface Shape {
    name: string;
    tags: string[];
  }

  const form = createFormHelper<Shape>({
    defaultValues: {
      name: "John",
      tags: [],
    },
  });

  expect(form.register.name()).toEqual({
    name: "name",
    defaultValue: "John",
  });

  expect(form.register.tags.at(0)()).toEqual({
    name: "tags[0]",
  });

  expect(form.register.tags.at(1)()).toEqual({
    name: "tags[1]",
  });
});

it("can handle empty arrays as default values", () => {
  interface Shape {
    tags: string[];
  }

  const form = createFormHelper<Shape>({
    defaultValues: {
      tags: [],
    },
  });

  expect(form.register.tags.at(0)()).toEqual({
    name: "tags[0]",
  });

  expect(form.register.tags.at(1)()).toEqual({
    name: "tags[1]",
  });
});
