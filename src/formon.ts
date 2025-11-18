const NON_SHARED_VALUE = Symbol("NON_SHARED_VALUE");

type NonOptional<TValue> = TValue extends undefined ? never : TValue;

type TDefaultValues<TObject> = TObject | { [TName in keyof TObject]?: TDefaultValues<TObject[TName]> | null };

type FormHelperOptions<TObject> = {
  defaultValues?: TDefaultValues<TObject> | TDefaultValues<TObject>[];
};

type InputProps = {
  name: string;
  defaultValue?: string;
  defaultChecked?: boolean;
  readOnly?: boolean;
};

type GetInputProps = () => InputProps;

/**
 * Used to match the default value to the correct indexed field.
 */
type GetIndex<TValue> = (defualtValue: TValue) => number;

/** */
type RegisteredNestedInput<TValue> = {
  [TName in keyof TValue]-?: RegisterInput<TValue[TName]>;
};

type RegisteredIndexedInput<TValue> = {
  getIndex: (index: number, getIndex?: GetIndex<TValue>) => RegisterInput<TValue>;
};

/**
 * Infers nested input registration accessors from the object shape.
 */
type RegisterInput<TValue> = TValue extends (infer TArrayItem)[]
  ? RegisteredIndexedInput<TArrayItem>
  : TValue extends object
    ? RegisteredNestedInput<TValue>
    : GetInputProps;

type RegisteredNestedInputName<TValue, Path extends string> = {
  [TName in keyof TValue]: TName extends string
    ? RegisteredInputName<TValue[TName], Path extends "" ? TName : `${Path}.${TName}`>
    : never;
}[keyof TValue];

type RegisteredIndexedInputName<TValue, Path extends string> = RegisteredInputName<TValue, `${Path}[${string}]`>;

/**
 * Infers nested input name strings from the object shape.
 * Should have the same general structure as `RegisterInput`.
 */
type RegisteredInputName<TValue, Path extends string> = TValue extends (infer TArrayItem)[]
  ? RegisteredIndexedInputName<TArrayItem, Path>
  : NonOptional<TValue> extends object
    ? RegisteredNestedInputName<TValue, Path>
    : Path;

type NestedPath = Array<string | number | { index: number; getIndex: GetIndex<unknown> }>;

type FormHelper<TObject> = {
  register: RegisterInput<TObject>;
};

/**
 * Creates a form helper object that can be used to register form inputs and submit the form.
 */
export function createFormHelper<TObject>(options: FormHelperOptions<TObject> = {}): FormHelper<NoInfer<TObject>> {
  return {
    register: createNestedGetProps<TObject>([], options.defaultValues),
  };
}

export function createNestedGetProps<TNested>(path: NestedPath, defaultValues: unknown): RegisterInput<TNested> {
  const proxied = (() => {}) as RegisterInput<TNested>;

  return new Proxy(proxied, {
    apply: () => {
      // @ts-ignore Allow dynamic arguments.
      return createGetProps(path, defaultValues);
    },
    get: (_, prop) => {
      if (typeof prop === "symbol") {
        throw new Error("Symbol properties are not supported");
      }

      if (prop === "getIndex") {
        return (index: number, getIndex?: GetIndex<unknown>) => {
          if (typeof getIndex === "function") {
            return createNestedGetProps([...path, { index, getIndex }], defaultValues);
          }

          return createNestedGetProps([...path, index], defaultValues);
        };
      }

      return createNestedGetProps([...path, prop], defaultValues);
    },
  });
}

function createGetProps(path: NestedPath, defaultValues: unknown): InputProps {
  const name = getNameFromPath(path);
  const defaultValue = getMaybeSharedDefaultValue(path, defaultValues);

  if (defaultValue === NON_SHARED_VALUE) {
    return {
      name: name,
      readOnly: true,
    };
  }

  if (typeof defaultValue === "boolean") {
    return {
      name: name,
      defaultChecked: defaultValue,
    };
  }

  if (typeof defaultValue === "string") {
    return {
      name: name,
      defaultValue: defaultValue,
    };
  }

  if (typeof defaultValue === "number") {
    return {
      name: name,
      defaultValue: defaultValue.toString(),
    };
  }

  return {
    name: name,
  };
}

function getNameFromPath(path: NestedPath) {
  let name = "";

  for (const value of path) {
    if (name === "") {
      name += value;
      continue;
    }

    if (typeof value === "string") {
      name += `.${value}`;
      continue;
    }

    if (typeof value === "number") {
      name += `[${value}]`;
      continue;
    }

    if (typeof value === "object") {
      name += `[${value.index}]`;
    }
  }

  return name;
}

function getMaybeSharedDefaultValue(path: NestedPath, defaultValues: unknown) {
  // This part is a bit tricky, as we need to figure out non-shared
  // default values for nested objects in multi-edit forms.
  if (Array.isArray(defaultValues)) {
    const [firstDefaultValues, ...otherDefaultValues] = defaultValues;
    const firstDefaultValue = getDefaultValue(path, firstDefaultValues);

    for (const otherDefaultValue of otherDefaultValues) {
      const currentDefaultValue = getDefaultValue(path, otherDefaultValue);

      if (currentDefaultValue !== firstDefaultValue) {
        return NON_SHARED_VALUE;
      }
    }

    return firstDefaultValue;
  }

  return getDefaultValue(path, defaultValues);
}

function getDefaultValue(path: NestedPath, defaultValues: unknown) {
  for (const value of path) {
    if (defaultValues == null) {
      break;
    }

    if (typeof value === "object") {
      defaultValues = (defaultValues as unknown[]).find((defaultValue) => {
        return value.index === value.getIndex(defaultValue);
      });
      continue;
    }

    defaultValues = (defaultValues as Record<string, unknown>)[value];
  }

  return defaultValues;
}
