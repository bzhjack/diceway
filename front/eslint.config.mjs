// Les conventions de CLAUDE.md, vérifiées. Les écarts déjà là sont notés dans eslint-suppressions.json (phase 2 de
// doc/plans/2026-10-31-revue-de-code.md) : ils passent, un nouvel écart bloque, et un écart corrigé se retire avec `npm run lint:prune`.
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

const restricted = (selector, message) => ({selector, message});

export default defineConfig([
  {ignores: ['dist/', '.angular/', 'public/', 'scripts/', 'src/assets/']},
  {
    files: ['src/**/*.ts'],
    extends: [eslint.configs.recommended, tseslint.configs.recommended, angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {ignoreRestSiblings: true}],
      '@angular-eslint/component-selector': ['error', {type: 'element', prefix: ['bol', 'dw', 'app'], style: 'kebab-case'}],
      '@angular-eslint/directive-selector': ['error', {type: 'attribute', prefix: ['bol', 'dw', 'app'], style: 'camelCase'}],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-host-metadata-property': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      'no-restricted-syntax': [
        'error',
        restricted("Property[key.name='standalone'][value.value=true]", "Inutile depuis Angular 20 : les composants sont standalone par défaut."),
        restricted("CallExpression[callee.property.name='mutate']", 'Sur un signal : .set() ou .update().'),
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [{group: ['primeng', 'primeng/*', 'primeicons'], message: 'Angular Material seulement.'}],
        },
      ],
    },
  },
  {
    // Types exportés : dans un dossier models/, un fichier <nom>.model.ts.
    files: ['src/app/**/*.ts'],
    ignores: ['**/models/**', '**/*.spec.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        restricted("Property[key.name='standalone'][value.value=true]", "Inutile depuis Angular 20 : les composants sont standalone par défaut."),
        restricted("CallExpression[callee.property.name='mutate']", 'Sur un signal : .set() ou .update().'),
        restricted('ExportNamedDeclaration > TSInterfaceDeclaration', "Un type exporté va dans models/<nom>.model.ts."),
        restricted('ExportNamedDeclaration > TSTypeAliasDeclaration', "Un type exporté va dans models/<nom>.model.ts."),
        restricted('ExportNamedDeclaration > TSEnumDeclaration', "Un type exporté va dans models/<nom>.model.ts."),
      ],
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/prefer-class-binding': 'error',
      '@angular-eslint/template/prefer-style-binding': 'error',
      '@angular-eslint/template/no-inline-styles': ['error', {allowBindToStyle: true}],
      '@angular-eslint/template/no-any': 'error',
      '@angular-eslint/template/prefer-at-empty': 'off',
      'no-restricted-syntax': [
        'error',
        restricted("TextAttribute[name='size'][value='small']", "Les boutons Material n'ont pas d'entrée size : l'attribut n'a aucun effet."),
        restricted("Element[name='mat-form-field'] > TextAttribute[name='appearance'][value='outline']", 'Déjà le réglage par défaut (app.config.ts).'),
        restricted("Element[name='img'] > TextAttribute[name='src']", 'Une image statique passe par NgOptimizedImage (ngSrc).'),
        restricted("TextAttribute[name=/^p[A-Z]/]", 'PrimeNG est retiré.'),
      ],
    },
  },
]);
