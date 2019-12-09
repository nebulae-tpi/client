export const Places = [ 'CALI', 'AERO', 'PALMIRA', 'JAMUNDI', 'YUMBO'];

export const ORIGIN_DESTINATION_MATRIX_FARE = [
  { from: 'CALI', to: 'AERO',    fare: 40000 },
  { from: 'CALI', to: 'PALMIRA', fare: 60000 },
  { from: 'CALI', to: 'JAMUNDI', fare: 15000 },
  { from: 'CALI', to: 'YUMBO',   fare: 20000 },

  { from: 'AERO', to: 'CALI',    fare: 30000 },

  { from: 'AERO', to: 'PALMIRA', fare: null },
  { from: 'AERO', to: 'JAMUNDI', fare: null },
  { from: 'AERO', to: 'YUMBO',   fare: null },

  { from: 'PALMIRA', to: 'CALI',    fare: 60000 },
  { from: 'PALMIRA', to: 'AERO',    fare: null },
  { from: 'PALMIRA', to: 'JAMUNDI', fare: null },
  { from: 'PALMIRA', to: 'YUMBO',   fare: null },

  { from: 'JAMUNDI', to: 'CALI',    fare: 20000 },
  { from: 'JAMUNDI', to: 'AERO',    fare: null },
  { from: 'JAMUNDI', to: 'PALMIRA', fare: null },
  { from: 'JAMUNDI', to: 'YUMBO',   fare: null },

  { from: 'YUMBO', to: 'CALI',      fare: 20000 },
  { from: 'YUMBO', to: 'AERO',      fare: null },
  { from: 'YUMBO', to: 'PALMIRA',   fare: null },
  { from: 'YUMBO', to: 'JAMUNDI',   fare: null }
];
