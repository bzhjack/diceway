import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const DwPreset = definePreset(Aura, {
  semantic: {
    // Couleur principale (utilisée pour les boutons, liens, etc.)
    primary: {
      50:  '#1a202c',  // Très sombre
      100: '#2d3748',  // Un peu plus clair
      200: '#4a5568',
      300: '#718096',
      400: '#a0aec0',
      500: '#cbd5e0',  // Couleur principale "claire" pour le contraste
      600: '#a0aec0',
      700: '#718096',
      800: '#4a5568',
      900: '#2d3748',
      950: '#1a202c',
    },

    // Couleurs de surface (fond, cartes, etc.)
    surface: {
      0:   '#1a202c',  // Fond principal
      50:  '#2d3748',  // Surface légèrement plus claire
      100: '#4a5568',
      200: '#718096',
      300: '#a0aec0',
      400: '#cbd5e0',
      500: '#e2e8f0',
      600: '#cbd5e0',
      700: '#a0aec0',
      800: '#718096',
      900: '#4a5568',
      950: '#2d3748',
    },

    // Définition des schémas de couleur (même pour light/dark)
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',       // Texte/icônes sur fond primary
          inverseColor: '{surface.0}',  // Texte inverse (pour les boutons)
          hoverColor: '{primary.400}',
          activeColor: '{primary.300}',
        },
        surface: {
          0: '{surface.0}',
          50: '{surface.50}',
          100: '{surface.100}',
          // ... jusqu'à 950
        },
        highlight: {
          background: '{primary.500}',
          color: '{surface.0}',
          focusBackground: '{primary.400}',
          focusColor: '{surface.0}',
        },
        formField: {
          background: '{surface.0}',
          color: '{surface.500}',
          borderColor: '{surface.500}',
          hoverBorderColor: '{primary.500}',
          focusBorderColor: '{primary.500}',
        },
        focusRing: {
          width: '2px',
          style: 'solid',
          color: '{primary.500}',
          offset: '0',
        },
      },
      dark: {
        // Identique à light pour un thème sombre fixe
        primary: {
          color: '{primary.500}',
          inverseColor: '{surface.0}',
          hoverColor: '{primary.400}',
          activeColor: '{primary.300}',
        },
        surface: {
          0: '{surface.0}',
          50: '{surface.50}',
          // ... jusqu'à 950
        },
        highlight: {
          background: '{primary.500}',
          color: '{surface.0}',
          focusBackground: '{primary.400}',
          focusColor: '{surface.0}',
        },
        formField: {
          background: '{surface.0}',
          color: '{surface.500}',
          borderColor: '{surface.500}',
          hoverBorderColor: '{primary.500}',
          focusBorderColor: '{primary.500}',
        },
      },
    },

    components: {
      button: {
        colorScheme: {
          light: {
            root: {
              background: '{primary.500}',
              color: '{surface.0}',
            },
          },
        },
      },
      card: {
        colorScheme: {
          light: {
            root: {
              background: '{surface.50}',
              color: '{surface.500}',
            },
          },
        },
      },
    }

  },

});
