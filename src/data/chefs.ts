// SAMPLE creator profiles — fictional people, shown with a "Sample profile" label in the UI.
// Real creator onboarding and verification are planned for a later milestone.
import type { Chef, Localized } from "@/types";

const L = (en: string, rw: string, fr: string): Localized => ({ en, rw, fr });

export const chefs: Chef[] = [
  {
    id: "c-claudine", slug: "claudine-mukamana", name: "Claudine Mukamana", district: "Gasabo", verified: true,
    speciality: L("Traditional Rwandan home cooking", "Guteka gakondo nyarwanda", "Cuisine familiale rwandaise traditionnelle"),
    bio: L(
      "Claudine has cooked for family gatherings in Kimironko for twenty years. Her recipes keep traditional flavour while saving time and money.",
      "Claudine amaze imyaka makumyabiri atekera ibirori by'imiryango i Kimironko. Uburyo bwe bwo guteka bugumana uburyohe gakondo kandi bugatwara igihe n'amafaranga make.",
      "Claudine cuisine pour les réunions familiales à Kimironko depuis vingt ans. Ses recettes gardent le goût traditionnel tout en économisant temps et argent.",
    ),
  },
  {
    id: "c-eric", slug: "eric-niyonsenga", name: "Eric Niyonsenga", district: "Nyarugenge", verified: false,
    speciality: L("Student budget meals", "Amafunguro y'abanyeshuri ahendutse", "Repas économiques pour étudiants"),
    bio: L(
      "A former university student who learned to feed himself well on 20,000 RWF a week. Eric shares simple meals that need few tools.",
      "Yahoze ari umunyeshuri wa kaminuza wize kurya neza akoresheje RWF 20,000 ku cyumweru. Eric asangiza abandi amafunguro yoroshye.",
      "Ancien étudiant qui a appris à bien manger avec 20 000 RWF par semaine. Eric partage des repas simples qui demandent peu d'ustensiles.",
    ),
  },
  {
    id: "c-aline", slug: "aline-uwase", name: "Aline Uwase", district: "Kicukiro", verified: true,
    speciality: L("Quick, balanced family dinners", "Amafunguro y'umuryango yihuta kandi aringaniye", "Dîners familiaux rapides et équilibrés"),
    bio: L(
      "Nutrition graduate and mother of three. Aline plans dinners that are ready in under an hour and balanced for growing children.",
      "Yize iby'imirire kandi ni umubyeyi w'abana batatu. Aline ategura amafunguro ashya mu isaha imwe kandi aringaniye ku bana bakura.",
      "Diplômée en nutrition et mère de trois enfants. Aline prépare des dîners prêts en moins d'une heure et équilibrés pour les enfants.",
    ),
  },
];

export const chefById = (id: string) => chefs.find((c) => c.id === id);
export const chefBySlug = (slug: string) => chefs.find((c) => c.slug === slug);
