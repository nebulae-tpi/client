export const Places = [ 'CALI', 'AERO', 'PALMIRA', 'JAMUNDI', 'YUMBO'];

export const ORIGIN_DESTINATION_MATRIX_FARE = [
  { from: 'CALI', to: 'AERO',    fare: 40000 },
  { from: 'CALI', to: 'PALMIRA', fare: 60000 },
  { from: 'CALI', to: 'JAMUNDI', fare: 15000 },
  { from: 'CALI', to: 'YUMBO',   fare: 20000 },

  { from: 'AERO', to: 'CALI',    fare: 30000 },
  { from: 'AERO', to: 'PALMIRA', fare: 0 },
  { from: 'AERO', to: 'JAMUNDI', fare: 0 },
  { from: 'AERO', to: 'YUMBO',   fare: 0 },

  { from: 'PALMIRA', to: 'CALI',    fare: 60000 },
  { from: 'PALMIRA', to: 'AERO',    fare: 0 },
  { from: 'PALMIRA', to: 'JAMUNDI', fare: 0 },
  { from: 'PALMIRA', to: 'YUMBO',   fare: 0 },

  { from: 'JAMUNDI', to: 'CALI',    fare: 15000 },
  { from: 'JAMUNDI', to: 'AERO',    fare: 0 },
  { from: 'JAMUNDI', to: 'PALMIRA', fare: 0 },
  { from: 'JAMUNDI', to: 'YUMBO',   fare: 0 },

  { from: 'YUMBO', to: 'CALI',      fare: 20000 },
  { from: 'YUMBO', to: 'AERO',      fare: 0 },
  { from: 'YUMBO', to: 'PALMIRA',   fare: 0 },
  { from: 'YUMBO', to: 'JAMUNDI',   fare: 0 }
];
