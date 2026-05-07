// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.config.{js,cjs,mjs,ts}',
      'storybook/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.base.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // React
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      // The global `JSX` namespace is reported deprecated in @types/react@19,
      // but the codebase uses React 18 where it is the standard pattern.
      // Disable the rule so we don't have to thread `React.JSX.Element` through
      // every component file. Re-enable when migrating to React 19.
      '@typescript-eslint/no-deprecated': 'off',
      // Allow the `interface X extends Y {}` idiom — used for component prop
      // types where the empty interface gives consumers a stable, named
      // shape they can extend later without breaking imports.
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      // Allow numbers (and a few other primitives) in template literals.
      // Numbers stringify predictably and forcing `String(n)` adds noise
      // without catching real bugs.
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true, allowNullish: false },
      ],
      // Component code legitimately uses `||` for boolean OR (`disabled ||
      // loading`) and ARIA falsy-coerce (`aria-invalid={error || undefined}`).
      // Disable the prefer-?? rule on primitives so those don't get flagged.
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          ignorePrimitives: {
            string: true,
            number: true,
            boolean: true,
            bigint: true,
          },
          ignoreTernaryTests: true,
        },
      ],

      // General
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  // Test-file and Storybook-story overrides — both legitimately use
  // non-null assertions on mock-call records, access untyped helpers, and
  // use no-op arrow function stubs. Story files in particular fail strict
  // type-checks because their `Meta<typeof Component>` typing flows
  // through Storybook generic types that ESLint can't follow. Relaxing
  // these rules in test/story files keeps production code strict while
  // letting the surrounding scaffolding stay readable.
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.stories.ts',
      '**/*.stories.tsx',
      '**/_storybook/**/*.ts',
      '**/_storybook/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'no-console': 'off',
      // Storybook story `render: ({ ... }) => { ... useState(...) ... }`
      // legitimately calls hooks but the function is named `render` (not
      // PascalCase / not `use*`), so rules-of-hooks fires. Disable in
      // test/story files only.
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  prettierConfig,
);
