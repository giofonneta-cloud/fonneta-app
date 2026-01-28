export interface City {
    id: string;
    name: string;
    departmentId: string;
}

export interface Department {
    id: string;
    name: string;
}

export const COLOMBIA_DEPARTMENTS: Department[] = [
    { id: "05", name: "Antioquia" },
    { id: "08", name: "Atlántico" },
    { id: "11", name: "Bogotá, D.C." },
    { id: "13", name: "Bolívar" },
    { id: "15", name: "Boyacá" },
    { id: "17", name: "Caldas" },
    { id: "18", name: "Caquetá" },
    { id: "19", name: "Cauca" },
    { id: "20", name: "Cesar" },
    { id: "23", name: "Córdoba" },
    { id: "25", name: "Cundinamarca" },
    { id: "27", name: "Chocó" },
    { id: "41", name: "Huila" },
    { id: "44", name: "La Guajira" },
    { id: "47", name: "Magdalena" },
    { id: "50", name: "Meta" },
    { id: "52", name: "Nariño" },
    { id: "54", name: "Norte de Santander" },
    { id: "63", name: "Quindío" },
    { id: "66", name: "Risaralda" },
    { id: "68", name: "Santander" },
    { id: "70", name: "Sucre" },
    { id: "73", name: "Tolima" },
    { id: "76", name: "Valle del Cauca" },
    { id: "81", name: "Arauca" },
    { id: "85", name: "Casanare" },
    { id: "86", name: "Putumayo" },
    { id: "88", name: "Archipiélago de San Andrés, Providencia y Santa Catalina" },
    { id: "91", name: "Amazonas" },
    { id: "94", name: "Guainía" },
    { id: "95", name: "Guaviare" },
    { id: "97", name: "Vaupés" },
    { id: "99", name: "Vichada" }
];

export const COLOMBIA_CITIES_BY_DEPT: Record<string, string[]> = {
    "11": ["Bogotá, D.C."],
    "05": ["Medellín", "Bello", "Itagüí", "Envigado", "Rionegro", "Apartadó", "Turbo", "Caucasia"],
    "08": ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Puerto Colombia"],
    "76": ["Cali", "Buenaventura", "Palmira", "Tuluá", "Cartago", "Jamundí", "Buga"],
    "13": ["Cartagena de Indias", "Magangué", "Turbaco", "El Carmen de Bolívar"],
    "68": ["Bucaramanga", "Floridablanca", "Barrancabermeja", "Girón", "Piedecuesta"],
    "54": ["Cúcuta", "Villa del Rosario", "Los Patios", "Ocaña"],
    "52": ["Pasto", "Ipiales", "Tumaco"],
    "73": ["Ibagué", "Espinal", "Melgar"],
    "50": ["Villavicencio", "Acacías", "Granada"],
    "17": ["Manizales", "La Dorada", "Riosucio"],
    "66": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"],
    "63": ["Armenia", "Calarcá", "La Tebaida"],
    "25": ["Soacha", "Facatativá", "Chía", "Zipaquirá", "Fusagasugá", "Girardot", "Mosquera", "Madrid", "Funza", "Cajicá"],
    "41": ["Neiva", "Pitalito", "Garzón"],
    "20": ["Valledupar", "Aguachica", "Codazzi"],
    "47": ["Santa Marta", "Ciénaga", "Fundación"],
    "23": ["Montería", "Cereté", "Lorica", "Sahagún"],
    "70": ["Sincelejo", "Corozal"],
    "15": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá"],
    "19": ["Popayán", "Santander de Quilichao"],
    "44": ["Riohacha", "Maicao", "Uribia"],
    "18": ["Florencia"],
    "27": ["Quibdó"],
    "81": ["Arauca", "Tame"],
    "85": ["Yopal", "Aguazul"],
    "86": ["Mocoa", "Puerto Asís"],
    "88": ["San Andrés"],
    "91": ["Leticia"],
    "94": ["Inírida"],
    "95": ["San José del Guaviare"],
    "97": ["Mitú"],
    "99": ["Puerto Carreño"]
};
