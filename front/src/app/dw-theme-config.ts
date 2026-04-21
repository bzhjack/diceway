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
        background: 'rgba(26, 32, 44, 0.96)',
        color: '#f8fafc',
        borderRadius: '0.5rem',
        shadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
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
      css: `
        .p-card {
          border: 1px solid #2d3748;
        }

        .p-card.dw-card--header {
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(12px);
        }

        .p-card.dw-card--header .p-card-body {
          padding: 1.25rem;
        }

        .p-card.dw-card--header .p-card-content {
          padding: 0;
        }

        .p-card.dw-card--demon {
          background: rgba(24, 24, 27, 0.96);
          border-color: #3f3f46;
        }

        .p-card.dw-card--metric {
          height: 100%;
          background: rgba(45, 55, 72, 0.92);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
        }

        .p-card.dw-card--interactive {
          transition:
            transform 150ms ease,
            border-color 150ms ease;
        }

        .p-card.dw-card--metric.dw-card--interactive:hover {
          transform: translateY(-0.125rem);
          border-color: rgba(252, 211, 77, 0.6);
        }

        .p-card.dw-card--blur {
          backdrop-filter: blur(12px);
        }

        @media (min-width: 1024px) {
          .p-card.dw-card--header .p-card-body {
            padding: 1.25rem 1.5rem;
          }
        }
      `,
    },
    datatable: {
      root: {
        borderColor: '#334155',
      },
      header: {
        background: 'transparent',
        borderWidth: '0',
        padding: '0 0 1rem',
      },
      headerCell: {
        background: '#0f172a',
        borderColor: '#334155',
        color: '#e2e8f0',
        padding: '1rem',
      },
      row: {
        background: 'rgba(15, 23, 42, 0.72)',
        hoverBackground: 'rgba(30, 41, 59, 0.95)',
        color: '#e2e8f0',
      },
      bodyCell: {
        borderColor: '#334155',
        padding: '1rem',
      },
      css: `
        .p-datatable .p-datatable-table-container {
          overflow: hidden;
          border: 1px solid #334155;
          border-radius: 0.85rem;
        }

        .p-datatable .p-datatable-tbody > tr > td {
          background: transparent;
          vertical-align: top;
        }

        .p-datatable .p-datatable-tbody > tr:hover > td {
          background: transparent;
        }

        .p-datatable .p-datatable-thead > tr > th:not(:last-child),
        .p-datatable .p-datatable-tbody > tr > td:not(:last-child) {
          border-right: 1px solid #334155;
        }
      `,
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
    iconfield: {
      icon: {
        color: '#94a3b8',
      },
    },
    floatlabel: {
      root: {
        active: {
          fontSize: '0.8rem',
        },
        focusColor: '{form.field.float.label.color}',
      },
      css: `
        .p-floatlabel:has(input:focus) label,
        .p-floatlabel:has(input:-webkit-autofill) label,
        .p-floatlabel:has(textarea:focus) label,
        .p-floatlabel:has(.p-inputwrapper-focus) label {
          font-weight: 700;
        }
      `,
    },
    iftalabel: {
      root: {
        fontSize: '0.8rem',
        focusColor: '{form.field.float.label.color}',
      },
      css: `
        .p-iftalabel:has(input:focus) label,
        .p-iftalabel:has(input:-webkit-autofill) label,
        .p-iftalabel:has(textarea:focus) label,
        .p-iftalabel:has(.p-inputwrapper-focus) label {
          font-weight: 700;
        }
      `,
    },
    inputnumber: {
      css: `
        .p-inputnumber-input {
          padding-block: 5px;
          padding-inline: var(--p-form-field-padding-x);
          font-size: 0.9rem;
        }

        .p-iftalabel .p-inputnumber-input {
          padding-block-start: var(--p-iftalabel-input-padding-top);
          padding-block-end: var(--p-iftalabel-input-padding-bottom);
          padding-inline: var(--p-form-field-padding-x);
        }

        .p-floatlabel:has(.p-inputwrapper-focus) label,
        .p-iftalabel:has(.p-inputwrapper-focus) label {
          font-weight: 700;
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
  css: `
    .library-header-actions__primary .p-button {
      justify-content: center;
      min-width: 9.75rem;
    }

    .dw-creation-form .p-inputtext,
    .dw-creation-form .p-textarea,
    .dw-creation-form .p-inputnumber-input,
    .dw-creation-form .p-select {
      font-size: 0.9rem;
      line-height: 1.2;
    }

    .dw-creation-form .p-iftalabel {
      --p-iftalabel-top: 0.32rem;
      --p-iftalabel-font-size: 0.78rem;
      --p-iftalabel-input-padding-top: 0.95rem;
      --p-iftalabel-input-padding-bottom: 0.32rem;
    }

    .dw-creation-form .p-inputtext,
    .dw-creation-form .p-textarea,
    .dw-creation-form .p-inputnumber-input {
      padding-block: 0.35rem;
    }

    .dw-creation-form .p-select-label {
      padding-top: 0.95rem;
      padding-bottom: 0.32rem;
      font-size: 0.9rem;
    }

    .dw-creation-form .p-select-dropdown {
      width: 2.5rem;
    }
  `,
});
