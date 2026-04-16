import {definePreset} from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const DwPreset = definePreset(Aura, {
  primitive: {
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#0f172a',
    },
  },
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
    surface: {
      0: '{slate.950}',
      50: '{slate.900}',
      100: '{slate.800}',
      200: '{slate.700}',
      300: '{slate.600}',
      400: '{slate.500}',
      500: '{slate.400}',
      600: '{slate.300}',
      700: '{slate.200}',
      800: '{slate.100}',
      900: '{slate.50}',
      950: '{slate.50}',
    },
  },
  components: {
    dialog: {
      root: {
        background: '{surface.800}',
        borderColor: '{surface.700}',
        color: '{surface.0}',
        borderRadius: '0.5rem',
        shadow: '0 2px 12px rgba(0,0,0,0.3)',
      },
      header: {
        padding: '0.5rem',
      },
      content: {
        padding: '0.5rem',
      },
    },
    card: {
      root: {
        background: '{surface.800}',
        color: '{surface.0}',
        borderRadius: '0.5rem',
        shadow: '0 2px 12px rgba(0,0,0,0.3)',
      },
      body: {
        padding: '1.5rem',
        gap: '1rem',
      },
      title: {
        fontWeight: '600',
        fontSize: '1.25rem',
      },
      subtitle: {
        color: '{surface.300}',
      },
    },
    panel: {
      root: {
        background: '{surface.800}',
        color: '{surface.0}',
        borderColor: '{surface.800}',
      },
      header: {
        color: '{surface.0}',
      },
      css: `
        .p-panel-title {
          font-family: 'Muse Display Harmony', 'Open Sans', -apple-system, Roboto, 'Helvetica Neue', Helvetica, sans-serif;
          font-size: 30px;
          letter-spacing: 0.1em;
        }
      `,
    },
    inputtext: {
      css: `
        .p-inputtext.p-inputtext-sm {
          padding: 5px;
          font-size: 0.9rem;
        }
      `,
    },
    inputnumber: {
      css: `
        .p-inputnumber-input {
          padding: 5px;
          font-size: 0.9rem;
        }
      `,
    },
    tag: {
      css: `
        .p-tag-value {
          line-height: 15px;
        }
      `,
    },
    tooltip: {
      root: {
        maxWidth: '300px',
        padding: '0.75rem',
        borderRadius: '6px',
        background: '#424b57',
        color: 'rgba(255, 255, 255, 0.87)',
        shadow:
          '0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12)',
      },
      css: `
        .p-tooltip .p-tooltip-text {
          font-size: 0.75rem;
        }
      `,
    },
    popover: {
      root: {
        background: '#424b57',
        borderColor: 'transparent',
        color: 'rgba(255, 255, 255, 0.87)',
        borderRadius: '6px',
        shadow:
          '0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12)',
      },
      content: {
        padding: '0.85rem 0.95rem',
      },
      css: `
        .p-popover {
          border-color: transparent;
        }

        .p-popover .p-popover-content {
          font-size: 0.75rem;
        }

        .p-popover::before,
        .p-popover::after {
          border-bottom-color: #424b57;
        }
      `,
    },
  },
});
