export interface FallingItemDefinition {
  id: string;
  name: string;
  icon: string;
  isHealthy: boolean;
  points: number;
  glucoseEffect: number; // Positive = increases glucose (bad if too high), negative/balancing = lowers/stabilizes
  explanation: string;
  tag: string;
}

export const GAME_ITEMS: FallingItemDefinition[] = [
  // Healthy items (+points, stabilizes glucose toward 90-100 mg/dL)
  {
    id: 'water',
    name: 'Vaso de Agua Pura',
    icon: '💧',
    isHealthy: true,
    points: 100,
    glucoseEffect: -6,
    explanation: 'El agua favorece la eliminación del exceso de glucosa a través de la orina.',
    tag: 'Hidratación Vital'
  },
  {
    id: 'vegetables',
    name: 'Verduras & Fibras',
    icon: '🥦',
    isHealthy: true,
    points: 120,
    glucoseEffect: -8,
    explanation: 'La fibra soluble ralentiza la digestión de carbohidratos, evitando picos de azúcar.',
    tag: 'Nutrición Óptima'
  },
  {
    id: 'exercise',
    name: 'Caminata 30 Minutos',
    icon: '👟',
    isHealthy: true,
    points: 150,
    glucoseEffect: -12,
    explanation: 'El ejercicio activa los transportadores GLUT4 permitiendo a los músculos usar la glucosa sin depender solo de insulina.',
    tag: 'Actividad Física'
  },
  {
    id: 'apple',
    name: 'Fruta Entera con Cáscara',
    icon: '🍎',
    isHealthy: true,
    points: 90,
    glucoseEffect: -4,
    explanation: 'Comer la fruta entera mantiene la fibra intacta, a diferencia de los jugos exprimidos.',
    tag: 'Fibra Natural'
  },
  {
    id: 'sleep',
    name: 'Descanso 7-8 Horas',
    icon: '🌙',
    isHealthy: true,
    points: 110,
    glucoseEffect: -6,
    explanation: 'Dormir bien equilibra el cortisol y la grelina, reduciendo la ansiedad por azúcares.',
    tag: 'Regeneración'
  },
  {
    id: 'checkup',
    name: 'Chequeo Médico & Glucemia',
    icon: '🩺',
    isHealthy: true,
    points: 160,
    glucoseEffect: -10,
    explanation: 'Una prueba sencilla de glucosa en ayunas o Hemoglobina Glicosilada (HbA1c) salva vidas a tiempo.',
    tag: 'Detección Temprana'
  },

  // Risky items (penalizes score, raises glucose away from healthy zone)
  {
    id: 'soda',
    name: 'Gaseosa o Refresco Azucarado',
    icon: '🥤',
    isHealthy: false,
    points: -80,
    glucoseEffect: +28,
    explanation: 'Una sola lata puede contener hasta 10 cucharadas de azúcar líquida de absorción inmediata.',
    tag: 'Pico Glucémico'
  },
  {
    id: 'sedentary',
    name: 'Sedentarismo Prolongado',
    icon: '🛋️',
    isHealthy: false,
    points: -60,
    glucoseEffect: +18,
    explanation: 'Pasar horas sentado sin pausas activas reduce la sensibilidad a la insulina hasta un 40%.',
    tag: 'Falta de Movimiento'
  },
  {
    id: 'donut',
    name: 'Ultraprocesados & Bollería',
    icon: '🍩',
    isHealthy: false,
    points: -90,
    glucoseEffect: +26,
    explanation: 'Mezcla de harinas ultra-refinadas y grasas trans que satura el páncreas e inflama el hígado.',
    tag: 'Grasas & Azúcares'
  },
  {
    id: 'stress_smoke',
    name: 'Tabaco & Estrés Excesivo',
    icon: '🚬',
    isHealthy: false,
    points: -70,
    glucoseEffect: +20,
    explanation: 'La nicotina y el estrés crónico aumentan el cortisol y dañan directamente las arterias.',
    tag: 'Daño Cardiovascular'
  }
];

export interface TriviaQuestion {
  id: number;
  question: string;
  context: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  category: 'Prevención' | 'Alimentación' | 'Síntomas' | 'Historia 14N' | 'Mitos';
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 1,
    question: '¿Es posible prevenir o retrasar la aparición de la diabetes tipo 2 con el estilo de vida?',
    context: 'Dato de la Federación Internacional de Diabetes (FID) y la OMS.',
    options: [
      { text: 'No, la diabetes tipo 2 es 100% inevitable si tus padres la tuvieron', isCorrect: false },
      { text: 'Sí, hasta en un 80% de los casos adoptando alimentación equilibrada y actividad física regular', isCorrect: true },
      { text: 'Solo es prevenible tomando costosos suplementos farmacéuticos', isCorrect: false },
      { text: 'Únicamente se puede prevenir en personas menores de 20 años', isCorrect: false }
    ],
    explanation: '¡Respuesta correcta: B! La evidencia médica demuestra que hasta 8 de cada 10 casos de diabetes tipo 2 se pueden prevenir o posponer con cambios de vida sostenibles.',
    category: 'Prevención'
  },
  {
    id: 2,
    question: '¿Por qué los especialistas recomiendan comer la fruta entera en vez de tomar jugos colados?',
    context: 'Impacto de la fibra en el índice glucémico y la digestión.',
    options: [
      { text: 'Porque la fruta entera contiene menos agua que los jugos', isCorrect: false },
      { text: 'Porque los jugos colados pierden todos sus minerales al contacto con el aire', isCorrect: false },
      { text: 'Porque la fibra natural de la fruta frena la absorción del azúcar, evitando picos bruscos de glucosa', isCorrect: true },
      { text: 'No hay ninguna diferencia real en cómo el cuerpo absorbe el azúcar', isCorrect: false }
    ],
    explanation: '¡Respuesta correcta: C! Al licuar y colar la fruta se elimina la matriz de fibra, lo que hace que el azúcar (fructosa) se absorba velozmente y dispare la insulina.',
    category: 'Alimentación'
  },
  {
    id: 3,
    question: '¿Cuáles de los siguientes síntomas son señales de alerta frecuentes ante niveles elevados de glucosa?',
    context: 'Detección temprana y sospecha clínica según las guías médicas.',
    options: [
      { text: 'Tener mucha sed constante y boca seca (Polidipsia)', isCorrect: false },
      { text: 'Necesidad de orinar con mucha frecuencia, incluso de noche (Poliuria)', isCorrect: false },
      { text: 'Cansancio o fatiga inexplicable y pérdida de peso involuntaria', isCorrect: false },
      { text: 'Todas las anteriores son señales de alarma que requieren chequear la glucosa', isCorrect: true }
    ],
    explanation: '¡Respuesta correcta: D (Todas las anteriores)! Estas corresponden a las señales clásicas del cuerpo intentando expulsar el exceso de azúcar a través del riñón.',
    category: 'Síntomas'
  },
  {
    id: 4,
    question: '¿Por qué se eligió el 14 de Noviembre como el Día Mundial de la Diabetes?',
    context: 'Hito histórico que cambió para siempre el tratamiento de la diabetes.',
    options: [
      { text: 'En conmemoración del natalicio de Frederick Banting, codescubridor de la insulina en 1921', isCorrect: true },
      { text: 'Porque fue el día en que la OMS inventó el primer glucómetro digital', isCorrect: false },
      { text: 'Por ser el aniversario del primer hospital de endocrinología en América', isCorrect: false },
      { text: 'Porque fue el día en que se declaró obligatoria la actividad física en escuelas', isCorrect: false }
    ],
    explanation: '¡Respuesta correcta: A! Frederick Banting y Charles Best descubrieron la insulina en 1921, convirtiendo lo que era una condena fatal en una condición médicamente controlable.',
    category: 'Historia 14N'
  },
  {
    id: 5,
    question: '¿Cuáles de las siguientes acciones forman parte de un plan diario para prevenir la diabetes?',
    context: 'Hábitos protectores recomendados para toda la familia.',
    options: [
      { text: 'Preferir agua pura en lugar de gaseosas, refrescos o jugos azucarados', isCorrect: false },
      { text: 'Realizar al menos 30 minutos de movimiento diario (caminar, bailar, pedalear)', isCorrect: false },
      { text: 'Realizarse un chequeo anual de glucemia en ayunas o Hemoglobina Glicosilada (HbA1c)', isCorrect: false },
      { text: 'Todas las anteriores son medidas preventivas comprobadas y fundamentales', isCorrect: true }
    ],
    explanation: '¡Respuesta correcta: D (Todas las anteriores)! Hidratación sin azúcar, movimiento constante y chequeos a tiempo forman el triángulo de oro para blindar tu salud metabólica.',
    category: 'Mitos'
  }
];

export const PREVENTION_PILLARS = [
  {
    title: '1. Hidratación Inteligente',
    desc: 'Prefiere siempre agua natural o infusiones sin endulzar. Sustituir una sola bebida azucarada al día reduce significativamente el riesgo cardiometabólico.',
    icon: '💧'
  },
  {
    title: '2. Movimiento Diario (30 min)',
    desc: 'Caminar a paso ligero, bailar o subir escaleras estimula la captación de glucosa por tus músculos incluso horas después de haber terminado.',
    icon: '🏃'
  },
  {
    title: '3. El Plato Saludable (Método 50-25-25)',
    desc: 'Llena la mitad de tu plato con verduras frescas, un cuarto con proteínas de calidad (huevo, pescado, legumbres) y el otro cuarto con carbohidratos integrales.',
    icon: '🥗'
  },
  {
    title: '4. Chequeo Anual Preventivo',
    desc: 'La diabetes tipo 2 puede ser silenciosa durante años. Un examen de sangre de rutina permite detectar prediabetes a tiempo para revertirla.',
    icon: '🩺'
  },
  {
    title: '5. Calidad de Sueño & Manejo del Estrés',
    desc: 'Dormir menos de 6 horas continuas altera las hormonas que regulan la glucosa. Prioriza el descanso y momentos de desconexión mental.',
    icon: '🧘'
  }
];
