export enum ServiceState {
  NO_SERVICE = 'NO_SERVICE',
  REQUEST= 'REQUEST',
  REQUEST_STEP_0 = 'REQUEST_STEP_0',
  REQUEST_STEP_1 = 'REQUEST_STEP_1',
  REQUEST_STEP_2 = 'REQUEST_STEP_2',
  REQUESTED= 'REQUESTED',
  ASSIGNED= 'ASSIGNED',
  ARRIVED= 'ARRIVED',
  ON_BOARD= 'ON_BOARD',
  DONE= 'DONE',
  CANCELLED_CLIENT= 'CANCELLED_CLIENT',
  CANCELLED_DRIVER= 'CANCELLED_DRIVER',
  CANCELLED_OPERATOR= 'CANCELLED_OPERATOR',
  CANCELLED_SYSTEM= 'CANCELLED_SYSTEM',
}
