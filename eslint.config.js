import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'backend', 'public'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // React-compiler-era rules that flag idiomatic fetch-on-mount / ref
      // patterns — tracked debt pending dedicated refactors, not CI blockers
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      // The 5 `any`s in useSpeechRecognition (untyped Web Speech API) are
      // tracked debt — surfaced as warnings, not errors
      '@typescript-eslint/no-explicit-any': 'warn',
      // tsc's noUnusedLocals/noUnusedParameters already enforce this
      '@typescript-eslint/no-unused-vars': 'off',
    },
  }
);
