export const demoFinanceRecords = [
  {
    id: 'fin-p-wonkup-workspace',
    workspaceId: 'w-wonkup',
    projectId: 'p-wonkup-workspace',
    settings: {
      currency: 'PEN',
      contractedAmount: 18000,
      internalBudget: 12500,
      taxRate: 0,
      discount: 0,
      plannedHours: 320,
      targetMargin: 30,
      paymentTerms: '40% al inicio, 30% con el MVP y 30% al cierre.',
      billingNotes: 'Proyecto interno de WonkUp.'
    },
    memberRates: [
      { userId: 'usr-edinson', userName: 'Edinson', costRate: 38, billableRate: 75, weeklyCapacity: 20 },
      { userId: 'usr-rodrigo', userName: 'Rodrigo', costRate: 34, billableRate: 70, weeklyCapacity: 18 }
    ],
    incomes: [
      { id: 'inc-won-001', type: 'advance', status: 'paid', concept: 'Adelanto inicial', amount: 6000, dueDate: '2026-08-03', paidDate: '2026-08-03', reference: 'OP-001', evidenceUrl: '', notes: '' },
      { id: 'inc-won-002', type: 'partial', status: 'pending', concept: 'Pago por MVP', amount: 5400, dueDate: '2026-09-15', paidDate: '', reference: '', evidenceUrl: '', notes: '' },
      { id: 'inc-won-003', type: 'final', status: 'pending', concept: 'Cierre y publicación', amount: 6600, dueDate: '2026-10-30', paidDate: '', reference: '', evidenceUrl: '', notes: '' }
    ],
    costs: [
      { id: 'cost-won-001', category: 'software', vendor: 'Servicios cloud', amount: 420, date: '2026-08-03', responsible: 'Rodrigo', paymentStatus: 'paid', receiptUrl: '', notes: 'Herramientas de desarrollo.' },
      { id: 'cost-won-002', category: 'services', vendor: 'Diseño externo', amount: 900, date: '2026-08-04', responsible: 'Edinson', paymentStatus: 'pending', receiptUrl: '', notes: 'Apoyo visual inicial.' }
    ],
    timeEntries: [
      { id: 'time-won-001', userId: 'usr-edinson', userName: 'Edinson', date: '2026-08-03', hours: 18, workType: 'management', reference: 'Arquitectura', description: 'Definición funcional y planificación.', source: 'manual', billable: true },
      { id: 'time-won-002', userId: 'usr-rodrigo', userName: 'Rodrigo', date: '2026-08-04', hours: 22, workType: 'development', reference: 'MVP', description: 'Construcción del núcleo del workspace.', source: 'manual', billable: true }
    ],
    createdAt: '2026-08-03T12:00:00-05:00',
    updatedAt: '2026-08-04T18:00:00-05:00'
  },
  {
    id: 'fin-p-taxichurro',
    workspaceId: 'w-agora',
    projectId: 'p-taxichurro',
    settings: {
      currency: 'PEN',
      contractedAmount: 8500,
      internalBudget: 6000,
      taxRate: 0,
      discount: 0,
      plannedHours: 140,
      targetMargin: 32,
      paymentTerms: '30% de adelanto, 30% con prototipo y 40% al publicar.',
      billingNotes: 'Pagos coordinados con el responsable del proyecto.'
    },
    memberRates: [
      { userId: 'usr-rodrigo', userName: 'Rodrigo', costRate: 35, billableRate: 75, weeklyCapacity: 20 },
      { userId: 'usr-brenda', userName: 'Brenda', costRate: 27, billableRate: 58, weeklyCapacity: 15 }
    ],
    incomes: [
      { id: 'inc-taxi-001', type: 'advance', status: 'paid', concept: 'Adelanto del proyecto', amount: 2550, dueDate: '2026-07-10', paidDate: '2026-07-10', reference: 'YAPE-0710', evidenceUrl: '', notes: '' },
      { id: 'inc-taxi-002', type: 'partial', status: 'paid', concept: 'Validación del prototipo', amount: 2550, dueDate: '2026-08-01', paidDate: '2026-08-02', reference: 'TRX-0802', evidenceUrl: '', notes: '' },
      { id: 'inc-taxi-003', type: 'final', status: 'pending', concept: 'Publicación y cierre', amount: 3400, dueDate: '2026-08-30', paidDate: '', reference: '', evidenceUrl: '', notes: '' }
    ],
    costs: [
      { id: 'cost-taxi-001', category: 'software', vendor: 'Hosting y dominio', amount: 320, date: '2026-07-12', responsible: 'Rodrigo', paymentStatus: 'paid', receiptUrl: 'https://example.com/comprobante-hosting', notes: '' },
      { id: 'cost-taxi-002', category: 'mobility', vendor: 'Pruebas de campo', amount: 260, date: '2026-07-28', responsible: 'Brenda', paymentStatus: 'paid', receiptUrl: '', notes: 'Traslados para entrevistas.' },
      { id: 'cost-taxi-003', category: 'services', vendor: 'Diseño de interfaz', amount: 680, date: '2026-08-03', responsible: 'Rodrigo', paymentStatus: 'pending', receiptUrl: '', notes: '' }
    ],
    timeEntries: [
      { id: 'time-taxi-001', userId: 'usr-rodrigo', userName: 'Rodrigo', date: '2026-07-18', hours: 28, workType: 'development', reference: 'MVP', description: 'Flujo de reserva y conductor.', source: 'manual', billable: true },
      { id: 'time-taxi-002', userId: 'usr-brenda', userName: 'Brenda', date: '2026-07-25', hours: 22, workType: 'design', reference: 'UX/UI', description: 'Prototipo y validación con usuarios.', source: 'manual', billable: true },
      { id: 'time-taxi-003', userId: 'usr-rodrigo', userName: 'Rodrigo', date: '2026-08-03', hours: 18, workType: 'development', reference: 'Integración', description: 'Ajustes de publicación.', source: 'manual', billable: true }
    ],
    createdAt: '2026-07-10T09:00:00-05:00',
    updatedAt: '2026-08-04T18:00:00-05:00'
  },
  {
    id: 'fin-p-compraya',
    workspaceId: 'w-agora',
    projectId: 'p-compraya',
    settings: {
      currency: 'PEN', contractedAmount: 6200, internalBudget: 4300, taxRate: 0, discount: 200,
      plannedHours: 110, targetMargin: 30, paymentTerms: '50% al inicio y 50% al aprobar.',
      billingNotes: ''
    },
    memberRates: [
      { userId: 'usr-edinson', userName: 'Edinson', costRate: 38, billableRate: 75, weeklyCapacity: 15 }
    ],
    incomes: [
      { id: 'inc-compra-001', type: 'advance', status: 'paid', concept: 'Adelanto', amount: 3000, dueDate: '2026-06-18', paidDate: '2026-06-18', reference: 'DEP-0618', evidenceUrl: '', notes: '' },
      { id: 'inc-compra-002', type: 'final', status: 'pending', concept: 'Saldo final', amount: 3000, dueDate: '2026-09-05', paidDate: '', reference: '', evidenceUrl: '', notes: '' }
    ],
    costs: [
      { id: 'cost-compra-001', category: 'marketing', vendor: 'Producción de piezas', amount: 540, date: '2026-07-10', responsible: 'Edinson', paymentStatus: 'paid', receiptUrl: '', notes: '' }
    ],
    timeEntries: [
      { id: 'time-compra-001', userId: 'usr-edinson', userName: 'Edinson', date: '2026-07-15', hours: 44, workType: 'management', reference: 'Validación', description: 'Diseño del modelo y coordinación.', source: 'manual', billable: true }
    ],
    createdAt: '2026-06-18T09:00:00-05:00', updatedAt: '2026-08-03T10:00:00-05:00'
  },
  {
    id: 'fin-p-huellitas',
    workspaceId: 'w-agora',
    projectId: 'p-huellitas',
    settings: {
      currency: 'PEN', contractedAmount: 5600, internalBudget: 4000, taxRate: 0, discount: 0,
      plannedHours: 100, targetMargin: 28, paymentTerms: '40% al inicio y 60% al publicar.',
      billingNotes: ''
    },
    memberRates: [
      { userId: 'usr-brenda', userName: 'Brenda', costRate: 27, billableRate: 58, weeklyCapacity: 12 }
    ],
    incomes: [
      { id: 'inc-huellitas-001', type: 'advance', status: 'paid', concept: 'Adelanto', amount: 2240, dueDate: '2026-07-22', paidDate: '2026-07-22', reference: 'YAPE-0722', evidenceUrl: '', notes: '' },
      { id: 'inc-huellitas-002', type: 'final', status: 'pending', concept: 'Publicación', amount: 3360, dueDate: '2026-09-20', paidDate: '', reference: '', evidenceUrl: '', notes: '' }
    ],
    costs: [],
    timeEntries: [
      { id: 'time-huellitas-001', userId: 'usr-brenda', userName: 'Brenda', date: '2026-08-01', hours: 26, workType: 'design', reference: 'Prototipo', description: 'Flujos de mascotas perdidas y adopción.', source: 'manual', billable: true }
    ],
    createdAt: '2026-07-22T09:00:00-05:00', updatedAt: '2026-08-04T10:00:00-05:00'
  },
  {
    id: 'fin-p-selvaviva',
    workspaceId: 'w-agora',
    projectId: 'p-selvaviva',
    settings: {
      currency: 'PEN', contractedAmount: 6900, internalBudget: 4800, taxRate: 0, discount: 0,
      plannedHours: 125, targetMargin: 30, paymentTerms: '30% al inicio, 30% en diseño y 40% al cierre.',
      billingNotes: ''
    },
    memberRates: [
      { userId: 'usr-edinson', userName: 'Edinson', costRate: 38, billableRate: 75, weeklyCapacity: 16 }
    ],
    incomes: [
      { id: 'inc-selva-001', type: 'advance', status: 'paid', concept: 'Adelanto', amount: 2070, dueDate: '2026-06-30', paidDate: '2026-06-30', reference: 'DEP-0630', evidenceUrl: '', notes: '' },
      { id: 'inc-selva-002', type: 'partial', status: 'pending', concept: 'Diseño aprobado', amount: 2070, dueDate: '2026-08-20', paidDate: '', reference: '', evidenceUrl: '', notes: '' },
      { id: 'inc-selva-003', type: 'final', status: 'pending', concept: 'Cierre', amount: 2760, dueDate: '2026-09-12', paidDate: '', reference: '', evidenceUrl: '', notes: '' }
    ],
    costs: [
      { id: 'cost-selva-001', category: 'materials', vendor: 'Fotografía local', amount: 480, date: '2026-07-12', responsible: 'Edinson', paymentStatus: 'paid', receiptUrl: '', notes: '' }
    ],
    timeEntries: [
      { id: 'time-selva-001', userId: 'usr-edinson', userName: 'Edinson', date: '2026-07-20', hours: 48, workType: 'design', reference: 'Experiencia', description: 'Diseño de contenidos y recorrido.', source: 'manual', billable: true }
    ],
    createdAt: '2026-06-30T09:00:00-05:00', updatedAt: '2026-08-04T10:00:00-05:00'
  },
  {
    id: 'fin-p-personalclass',
    workspaceId: 'w-personalclass',
    projectId: 'p-personalclass',
    settings: {
      currency: 'PEN', contractedAmount: 15000, internalBudget: 11200, taxRate: 0, discount: 0,
      plannedHours: 300, targetMargin: 25, paymentTerms: 'Pagos mensuales según avance.',
      billingNotes: ''
    },
    memberRates: [
      { userId: 'usr-edinson', userName: 'Edinson', costRate: 38, billableRate: 75, weeklyCapacity: 22 }
    ],
    incomes: [
      { id: 'inc-pc-001', type: 'advance', status: 'paid', concept: 'Primer pago', amount: 5000, dueDate: '2026-05-15', paidDate: '2026-05-15', reference: 'DEP-0515', evidenceUrl: '', notes: '' },
      { id: 'inc-pc-002', type: 'partial', status: 'paid', concept: 'Segundo pago', amount: 4000, dueDate: '2026-07-15', paidDate: '2026-07-16', reference: 'DEP-0716', evidenceUrl: '', notes: '' },
      { id: 'inc-pc-003', type: 'final', status: 'pending', concept: 'Saldo final', amount: 6000, dueDate: '2026-09-30', paidDate: '', reference: '', evidenceUrl: '', notes: '' }
    ],
    costs: [
      { id: 'cost-pc-001', category: 'software', vendor: 'Servicios de mensajería', amount: 980, date: '2026-06-01', responsible: 'Edinson', paymentStatus: 'paid', receiptUrl: '', notes: '' },
      { id: 'cost-pc-002', category: 'services', vendor: 'Desarrollo externo', amount: 1800, date: '2026-07-02', responsible: 'Edinson', paymentStatus: 'paid', receiptUrl: '', notes: '' }
    ],
    timeEntries: [
      { id: 'time-pc-001', userId: 'usr-edinson', userName: 'Edinson', date: '2026-07-31', hours: 118, workType: 'management', reference: 'Plataforma', description: 'Gestión, pruebas y coordinación del desarrollo.', source: 'manual', billable: true }
    ],
    createdAt: '2026-05-15T09:00:00-05:00', updatedAt: '2026-08-04T10:00:00-05:00'
  },
  {
    id: 'fin-p-nija-growth',
    workspaceId: 'w-nija',
    projectId: 'p-nija-growth',
    settings: {
      currency: 'PEN', contractedAmount: 9200, internalBudget: 6200, taxRate: 0, discount: 0,
      plannedHours: 150, targetMargin: 32, paymentTerms: 'Pagos por campaña y entregables.',
      billingNotes: ''
    },
    memberRates: [
      { userId: 'usr-rodrigo', userName: 'Rodrigo', costRate: 35, billableRate: 75, weeklyCapacity: 16 }
    ],
    incomes: [
      { id: 'inc-nija-001', type: 'advance', status: 'paid', concept: 'Inicio de campaña', amount: 3000, dueDate: '2026-07-01', paidDate: '2026-07-01', reference: 'DEP-0701', evidenceUrl: '', notes: '' },
      { id: 'inc-nija-002', type: 'partial', status: 'pending', concept: 'Captación de partners', amount: 3000, dueDate: '2026-09-01', paidDate: '', reference: '', evidenceUrl: '', notes: '' },
      { id: 'inc-nija-003', type: 'final', status: 'pending', concept: 'Cierre comercial', amount: 3200, dueDate: '2026-11-15', paidDate: '', reference: '', evidenceUrl: '', notes: '' }
    ],
    costs: [
      { id: 'cost-nija-001', category: 'marketing', vendor: 'Pauta digital', amount: 650, date: '2026-07-20', responsible: 'Rodrigo', paymentStatus: 'paid', receiptUrl: '', notes: '' }
    ],
    timeEntries: [
      { id: 'time-nija-001', userId: 'usr-rodrigo', userName: 'Rodrigo', date: '2026-08-01', hours: 38, workType: 'marketing', reference: 'Partners', description: 'Propuesta comercial y piezas de captación.', source: 'manual', billable: true }
    ],
    createdAt: '2026-07-01T09:00:00-05:00', updatedAt: '2026-08-04T10:00:00-05:00'
  }
];
