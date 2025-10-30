// my-dark-preset.ts
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const DwPreset = definePreset(Aura, {
  semantic: {
    // Définir les couleurs principales pour le mode sombre
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      // ... jusqu'à 950
      500: '{indigo.400}', // Couleur principale plus claire pour le contraste
    },
    // Définir les surfaces sombres
    surface: {
      0: '{slate.950}',    // Fond très sombre
      50: '{slate.900}',
      100: '{slate.800}',
      // ... jusqu'à 950
      900: '{slate.200}',  // Pour les surfaces "claires" en mode sombre
    },
    // Personnaliser d'autres tokens si nécessaire
    colorScheme: {
      light: {
        // Même configuration que dark, car tu veux un thème sombre par défaut
        surface: {
          0: '{slate.950}',
          50: '{slate.900}',
          // ...
        },
      },
      dark: {
        // Identique à light, car tu ne veux pas de bascule
        surface: {
          0: '{slate.950}',
          50: '{slate.900}',
          // ...
        },
      },
    },
  },
});
