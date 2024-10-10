# Coding Guidelines for Email Recovery Demo

This document outlines the coding guidelines for contributing to the **Email Recovery Demo**. Following these guidelines will help maintain a consistent and high-quality codebase.

## 1. Code Formatting

- **Tool**: Use **Prettier** to automatically format your code. Ensure that all code is formatted before committing.
  - Run `npx prettier --write .` to format the entire codebase.
- **Indentation**: Use 2 spaces per indentation level. Do not use tabs.
- **Line Length**: Aim to keep lines under 100 characters. Longer lines should be broken up for readability.
- **Function Length**: Aim to keep functions short and focused. If a function is too long, consider breaking it up into smaller functions.
- **Imports**: Organize imports into the following sections:

  1. External dependencies (e.g., libraries from `node_modules`).
  2. Absolute imports (e.g., `import { func } from 'src/utils';`).
  3. Relative imports (e.g., `import { func } from '../utils';`).

  Example:

  ```ts
  import fs from "fs";
  import { validateEmail } from "src/utils";
  import { parseInput } from "../parsers";
  ```

- **Braces**: Use braces for all control structures, even single-line blocks.

  Example:

  ```ts
  if (condition) {
    doSomething();
  }
  ```

- **Semicolons**: Always use semicolons to terminate statements.
- **Whitespace**: Use a single space after commas and colons, but no space before them.

  Example:

  ```ts
  const arr = [1, 2, 3];
  const obj = { name: "Alice", age: 30 };
  ```

## 2. Code Linting

- **Tool**: Use **ESLint** to enforce code quality. Run `npx eslint .` before committing your code.
- **Handling Lints**: Address all warnings and errors reported by ESLint. Avoid ignoring lint rules unless necessary, and if you do, provide a comment explaining why.

## 3. Naming Conventions

- **Variables and Functions**: Use `camelCase` for variable and function names.

  Example:

  ```ts
  const userName = "Alice";
  ```

- **Classes and Interfaces**: Use `PascalCase`.

  Example:

  ```ts
  class UserAccount { ... }
  ```

- **Constants**: Use `UPPER_CASE` for constant values.

  Example:

  ```ts
  const MAX_USERS = 100;
  ```

## 4. Documentation

- **JSDoc**: Document all public functions, methods, and classes using JSDoc comments.

  Example:

  ```ts
  /**
   * Creates a new user account.
   * @param {string} name - The name of the user.
   * @returns {UserAccount} A new UserAccount object.
   */
  function createUserAccount(name: string): UserAccount {
    // function body
  }
  ```

- **Inline Comments**: Add comments in code where the intent or logic is not immediately clear.

## 5. Error Handling

- **Use of `try`/`catch`**: Use `try`/`catch` blocks for error-prone code. Always handle errors gracefully.

  Example:

  ```ts
  try {
    const data = await fetchData();
  } catch (error) {
    console.error("Error fetching data", error);
  }
  ```

- **Custom Errors**: When appropriate, define custom error types by extending the `Error` class.

## 6. Testing

- **Tool**: Use **Jest** for writing unit and integration tests. Ensure that all new functionality has corresponding tests.
  - Run `npm test` to execute the test suite.
- **Test Structure**: Organize tests in a `__tests__` directory or in files with the `.test.ts` or `.spec.ts` suffix.
- **Coverage**: Aim for at least 80% code coverage. Run `npm test -- --coverage` to check coverage metrics.
