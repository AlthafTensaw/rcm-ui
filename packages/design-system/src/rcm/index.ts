/**
 * RCM domain components.
 *
 * Healthcare-RCM-specific fields and validators: payer/patient address fields,
 * coding fields (CPT/ICD/HCPCS/POS), validators (NPI/SSN/EIN/DOB/phone/money),
 * RCM-styled value fields, and the HIPAA `<PrivacyField>` wrapper.
 *
 * These are NOT platform-agnostic primitives — they encode US-healthcare-RCM
 * formats, validators, and disclosure rules. Apps outside the RCM domain
 * should not import from this sub-path.
 */
export * from './address';
export * from './coding';
export * from './fields';
export * from './privacy';
export * from './validators';
