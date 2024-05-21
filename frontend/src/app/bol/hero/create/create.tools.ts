export type Translations = {
    [key: string]: string;
};

export const translations: Translations = {
    esprit: "Esprit",
    vigueur: "Vigueur",
    agilite: "Agilité",
    aura: "Aura",
    initiative:"Initiative",
    melee: "Mélée",
    tir: "Tir",
    defense: "Défense",
    tooSmallAttr: "ne doit pas être inférieur à -1.",
    tooBigAttr: "ne doit pas être supérieur à 3.",
    required: "ne doit pas être vide.",
    numeric: "n'a pas une valeur correcte."
};
export class BolHeroCreateTools {

    public static translate(key: string): string {
        if (translations[key]) {
            return translations[key];
        }
        return `Translation not found for key: "${key}"`;
    }
}
