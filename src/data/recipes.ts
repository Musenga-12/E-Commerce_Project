// Mock recipes. Quantities are in product units (see catalog.ts) for `servings` people.
// Ratings are SAMPLE values until real reviews exist; chefs are sample profiles.
import type { Localized, Recipe } from "@/types";

const L = (en: string, rw: string, fr: string): Localized => ({ en, rw, fr });

export const recipes: Recipe[] = [
  {
    id: "r-isombe", slug: "isombe", emoji: "🌿", image: "recipes/isombe", chefId: "c-claudine", rating: 4.9, ratingCount: 186, substitutions: [{ productId: "p-amaranth", insteadOf: "p-eggplant" }],
    name: L("Isombe with groundnut sauce", "Isombe n'ubunyobwa", "Isombe à la pâte d'arachide"),
    summary: L("Rwanda's beloved slow-cooked cassava leaves, rich with groundnut paste.", "Isombe itetse buhoro, irimo ubunyobwa.", "Feuilles de manioc mijotées, riches en arachide."),
    servings: 4, prepMin: 20, cookMin: 70, difficulty: "medium", tags: ["traditional", "vegetarian", "family"], slots: ["lunch", "dinner"],
    ingredients: [
      { productId: "p-cassava-leaves", qty: 1 }, { productId: "p-peanut-paste", qty: 0.5 },
      { productId: "p-eggplant", qty: 0.3 }, { productId: "p-onion", qty: 0.25 },
      { productId: "p-oil", qty: 0.1 }, { productId: "p-salt", qty: 0.02 },
    ],
    steps: [
      L("Boil the pounded cassava leaves in salted water for 40 minutes.", "Teka isombe mu mazi arimo umunyu iminota 40.", "Faites bouillir les feuilles de manioc 40 minutes dans l'eau salée."),
      L("Add chopped onion and garden eggs, then simmer 15 minutes.", "Ongeramo ibitunguru n'intoryi, ureke bitekeho iminota 15.", "Ajoutez l'oignon et les aubergines, laissez mijoter 15 minutes."),
      L("Stir in the groundnut paste loosened with a little water.", "Shyiramo ubunyobwa buvanze n'amazi make.", "Incorporez la pâte d'arachide diluée avec un peu d'eau."),
      L("Finish with oil and cook gently until thick and glossy.", "Ongeramo amavuta, uteke buhoro kugeza bishye neza.", "Ajoutez l'huile et laissez épaissir à feu doux."),
    ],
  },
  {
    id: "r-beans-rice", slug: "beans-and-rice", emoji: "🍚", image: "recipes/beans-rice", chefId: "c-eric", rating: 4.7, ratingCount: 241, substitutions: [{ productId: "p-maize-flour", insteadOf: "p-rice" }],
    name: L("Beans and rice", "Ibishyimbo n'umuceri", "Haricots et riz"),
    summary: L("The everyday classic: tomato-braised beans over fluffy rice.", "Ifunguro rya buri munsi: ibishyimbo n'umuceri.", "Le classique du quotidien : haricots à la tomate et riz."),
    servings: 4, prepMin: 10, cookMin: 55, difficulty: "easy", tags: ["budget", "vegetarian", "family"], slots: ["lunch", "dinner"],
    ingredients: [
      { productId: "p-beans", qty: 0.5 }, { productId: "p-rice", qty: 0.6 },
      { productId: "p-tomato", qty: 0.4 }, { productId: "p-onion", qty: 0.2 },
      { productId: "p-oil", qty: 0.08 }, { productId: "p-salt", qty: 0.02 },
    ],
    steps: [
      L("Boil the soaked beans until tender, about 45 minutes.", "Teka ibishyimbo byabanje kwinikwa, iminota 45.", "Cuisez les haricots trempés environ 45 minutes."),
      L("Fry onion and tomato in oil to make a sauce, add the beans.", "Karanga ibitunguru n'inyanya, ushyiremo ibishyimbo.", "Faites revenir oignon et tomate, ajoutez les haricots."),
      L("Cook the rice in salted water, covered, for 18 minutes.", "Teka umuceri mu mazi arimo umunyu iminota 18.", "Cuisez le riz couvert 18 minutes."),
      L("Serve the beans over the rice.", "Gabura ibishyimbo hejuru y'umuceri.", "Servez les haricots sur le riz."),
    ],
  },
  {
    id: "r-matoke-beef", slug: "matoke-with-beef", emoji: "🍌", image: "recipes/matoke-beef", chefId: "c-claudine", rating: 4.8, ratingCount: 132, substitutions: [{ productId: "p-chicken", insteadOf: "p-beef" }, { productId: "p-potato", insteadOf: "p-matoke" }],
    name: L("Igitoki with beef", "Igitoki n'inyama", "Bananes plantains au bœuf"),
    summary: L("Cooking bananas stewed with beef, tomato and garlic.", "Igitoki gitekanywe n'inyama, inyanya na tungurusumu.", "Bananes plantains mijotées au bœuf et à la tomate."),
    servings: 4, prepMin: 20, cookMin: 45, difficulty: "medium", tags: ["traditional", "protein", "family"], slots: ["lunch", "dinner"],
    ingredients: [
      { productId: "p-matoke", qty: 1.5 }, { productId: "p-beef", qty: 0.5 },
      { productId: "p-tomato", qty: 0.4 }, { productId: "p-onion", qty: 0.2 },
      { productId: "p-garlic", qty: 0.2 }, { productId: "p-oil", qty: 0.08 },
    ],
    steps: [
      L("Brown the cubed beef with onion and garlic.", "Karanga inyama hamwe n'ibitunguru na tungurusumu.", "Faites dorer le bœuf avec l'oignon et l'ail."),
      L("Add tomatoes and a cup of water; simmer 20 minutes.", "Ongeramo inyanya n'amazi, ureke bitekeho iminota 20.", "Ajoutez tomates et eau, laissez mijoter 20 minutes."),
      L("Add the peeled bananas and cook until soft.", "Shyiramo igitoki gihase, uteke kugeza koroshye.", "Ajoutez les bananes épluchées et cuisez jusqu'à tendreté."),
      L("Season and serve hot.", "Shyiramo umunyu ugabure gishyushye.", "Assaisonnez et servez chaud."),
    ],
  },
  {
    id: "r-sambaza-ugali", slug: "sambaza-with-ugali", emoji: "🐟", image: "recipes/sambaza-ugali", chefId: "c-eric", rating: 4.6, ratingCount: 97, substitutions: [{ productId: "p-beans", insteadOf: "p-sambaza" }],
    name: L("Crispy sambaza with ugali", "Isambaza n'ubugari", "Sambaza croustillants et ugali"),
    summary: L("Lake Kivu sardines fried crisp, with ugali and fresh tomato.", "Isambaza zikaranze, ubugari n'inyanya.", "Sardines du lac Kivu frites, ugali et tomate fraîche."),
    servings: 4, prepMin: 10, cookMin: 20, difficulty: "easy", tags: ["quick", "protein"], slots: ["lunch", "dinner"],
    ingredients: [
      { productId: "p-sambaza", qty: 1 }, { productId: "p-maize-flour", qty: 0.6 },
      { productId: "p-tomato", qty: 0.3 }, { productId: "p-onion", qty: 0.15 },
      { productId: "p-oil", qty: 0.15 }, { productId: "p-salt", qty: 0.02 },
    ],
    steps: [
      L("Rinse and salt the sambaza, then fry until golden.", "Oza isambaza, ushyiremo umunyu, uzikarange.", "Rincez, salez puis faites frire les sambaza."),
      L("Bring water to the boil and whisk in maize flour.", "Teka amazi, ushyiremo kawunga buhoro uvanga.", "Portez l'eau à ébullition et incorporez la farine de maïs."),
      L("Stir the ugali firmly until it pulls from the pan.", "Vanga ubugari kugeza bukomeye.", "Remuez l'ugali jusqu'à ce qu'il se détache."),
      L("Serve with sliced tomato and onion.", "Gabura n'inyanya n'ibitunguru bikase.", "Servez avec tomate et oignon émincés."),
    ],
  },
  {
    id: "r-chicken-stew", slug: "chicken-vegetable-stew", emoji: "🍗", image: "recipes/chicken-stew", chefId: "c-aline", rating: 4.8, ratingCount: 158, substitutions: [{ productId: "p-beef", insteadOf: "p-chicken" }],
    name: L("Chicken and vegetable stew", "Isupu y'inkoko n'imboga", "Ragoût de poulet aux légumes"),
    summary: L("A generous family stew with potatoes and carrots.", "Isupu y'umuryango irimo ibirayi na karoti.", "Un ragoût familial généreux, pommes de terre et carottes."),
    servings: 5, prepMin: 20, cookMin: 50, difficulty: "medium", tags: ["protein", "family"], slots: ["dinner"],
    ingredients: [
      { productId: "p-chicken", qty: 1 }, { productId: "p-potato", qty: 1 },
      { productId: "p-carrot", qty: 0.4 }, { productId: "p-onion", qty: 0.25 },
      { productId: "p-tomato", qty: 0.4 }, { productId: "p-garlic", qty: 0.2 }, { productId: "p-oil", qty: 0.08 },
    ],
    steps: [
      L("Cut the chicken into pieces and brown in oil.", "Kata inkoko, uyikarange mu mavuta.", "Découpez le poulet et faites-le dorer."),
      L("Add onion, garlic and tomato; cook until soft.", "Ongeramo ibitunguru, tungurusumu n'inyanya.", "Ajoutez oignon, ail et tomate."),
      L("Add potatoes, carrots and water; simmer 35 minutes.", "Shyiramo ibirayi, karoti n'amazi, uteke iminota 35.", "Ajoutez légumes et eau, mijotez 35 minutes."),
      L("Season to taste and serve.", "Shyiramo umunyu ugabure.", "Rectifiez l'assaisonnement et servez."),
    ],
  },
  {
    id: "r-chapati-eggs", slug: "chapati-with-eggs", emoji: "🥚", image: "recipes/chapati", chefId: "c-eric", rating: 4.5, ratingCount: 204, substitutions: [{ productId: "p-amaranth", insteadOf: "p-cabbage" }],
    name: L("Chapati egg rolls", "Chapati n'amagi", "Chapatis roulés aux œufs"),
    summary: L("Soft homemade chapati rolled around a vegetable omelette.", "Chapati yoroshye izingiyemo amagi n'imboga.", "Chapatis maison roulés autour d'une omelette aux légumes."),
    servings: 4, prepMin: 15, cookMin: 20, difficulty: "easy", tags: ["quick", "vegetarian"], slots: ["lunch"],
    ingredients: [
      { productId: "p-wheat-flour", qty: 0.5 }, { productId: "p-eggs", qty: 0.67 },
      { productId: "p-cabbage", qty: 0.3 }, { productId: "p-tomato", qty: 0.25 },
      { productId: "p-onion", qty: 0.1 }, { productId: "p-oil", qty: 0.1 },
    ],
    steps: [
      L("Knead flour, salt, oil and warm water into a soft dough.", "Vanga ifarini, umunyu, amavuta n'amazi ashyushye.", "Pétrissez farine, sel, huile et eau tiède."),
      L("Roll thin and cook each chapati on a hot pan.", "Rambura chapati, uzoteke ku isafuriya ishyushye.", "Étalez finement et cuisez chaque chapati à la poêle."),
      L("Whisk eggs with shredded cabbage, tomato and onion; fry.", "Vanga amagi n'imboga, ubikarange.", "Battez les œufs avec les légumes et faites cuire."),
      L("Roll the omelette inside each chapati.", "Zingira amagi muri chapati.", "Roulez l'omelette dans chaque chapati."),
    ],
  },
  {
    id: "r-pumpkin-dodo", slug: "pumpkin-and-dodo", emoji: "🎃", image: "recipes/pumpkin-dodo", chefId: "c-aline", rating: 4.4, ratingCount: 64, substitutions: [{ productId: "p-cabbage", insteadOf: "p-amaranth" }],
    name: L("Pumpkin with dodo greens", "Igihaza na dodo", "Citrouille aux feuilles d'amarante"),
    summary: L("A light, low-cost plate of steamed pumpkin and sautéed greens.", "Ifunguro ryoroheje kandi rihendutse.", "Une assiette légère et économique."),
    servings: 4, prepMin: 10, cookMin: 25, difficulty: "easy", tags: ["budget", "vegetarian", "quick"], slots: ["lunch", "dinner"],
    ingredients: [
      { productId: "p-pumpkin", qty: 1.5 }, { productId: "p-amaranth", qty: 2 },
      { productId: "p-onion", qty: 0.15 }, { productId: "p-tomato", qty: 0.25 },
      { productId: "p-oil", qty: 0.05 }, { productId: "p-salt", qty: 0.02 },
    ],
    steps: [
      L("Peel and cube the pumpkin, then steam for 15 minutes.", "Hata igihaza, ugikate, ugiteke n'umwuka iminota 15.", "Épluchez et faites cuire la citrouille à la vapeur."),
      L("Sauté onion and tomato in a little oil.", "Karanga ibitunguru n'inyanya mu mavuta make.", "Faites revenir oignon et tomate."),
      L("Add chopped dodo and cook 5 minutes.", "Ongeramo dodo ikase, uteke iminota 5.", "Ajoutez l'amarante et cuisez 5 minutes."),
      L("Serve the greens beside the pumpkin.", "Gabura dodo iruhande rw'igihaza.", "Servez avec la citrouille."),
    ],
  },
  {
    id: "r-tilapia-avocado", slug: "grilled-tilapia-avocado", emoji: "🐠", image: "recipes/tilapia", chefId: "c-aline", rating: 4.7, ratingCount: 88, substitutions: [{ productId: "p-sambaza", insteadOf: "p-tilapia" }],
    name: L("Grilled tilapia, avocado salad", "Tilapiya yokeje n'avoka", "Tilapia grillé, salade d'avocat"),
    summary: L("Whole tilapia grilled with garlic, served with avocado and tomato salad.", "Ifi yokeje na tungurusumu, n'avoka n'inyanya.", "Tilapia grillé à l'ail, salade avocat-tomate."),
    servings: 4, prepMin: 15, cookMin: 25, difficulty: "medium", tags: ["protein", "quick"], slots: ["dinner"],
    ingredients: [
      { productId: "p-tilapia", qty: 1.2 }, { productId: "p-avocado", qty: 1 },
      { productId: "p-tomato", qty: 0.3 }, { productId: "p-onion", qty: 0.1 },
      { productId: "p-garlic", qty: 0.2 }, { productId: "p-oil", qty: 0.05 },
    ],
    steps: [
      L("Score the fish and rub with garlic, salt and oil.", "Kata ifi buhoro, uyisige tungurusumu n'umunyu.", "Incisez le poisson et frottez-le d'ail et de sel."),
      L("Grill 10–12 minutes per side.", "Yotsa iminota 10–12 kuri buri ruhande.", "Grillez 10 à 12 minutes de chaque côté."),
      L("Dice avocado, tomato and onion for the salad.", "Kata avoka, inyanya n'ibitunguru.", "Coupez avocat, tomate et oignon en dés."),
      L("Serve the fish with the salad.", "Gabura ifi hamwe na salade.", "Servez le poisson avec la salade."),
    ],
  },
];

export const recipeById = (id: string) => recipes.find((r) => r.id === id);
export const recipeBySlug = (slug: string) => recipes.find((r) => r.slug === slug);
