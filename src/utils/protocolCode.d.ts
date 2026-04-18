/**
 * Generate REC Protocol Code
 * Pattern: CategoryCode-ReviewCode-Month-Year-SequenceNumber
 * Examples:
 * - EXEMPT UNDERGRAD: UG-EX-01-26-0001
 * - EXEMPT GRAD SCHOOL: GS-EX-01-26-0001
 * - FULL BOARD UNDERGRAD: UG-FR-01-26-0001
 * - FULL BOARD GRAD SCHOOL: GS-FR-01-26-0001
 * - EXPEDITED UNDERGRAD: UG-ER-01-26-0001
 * - EXPEDITED GRAD SCHOOL: GS-ER-01-26-0001
 */
export declare function generateProtocolCode(category: string, reviewType: string): Promise<string>;
/**
 * Update protocol code for a proposal when review type is assigned
 */
export declare function updateProtocolCode(proposalId: string, _unused: string, reviewType: string): Promise<string>;
