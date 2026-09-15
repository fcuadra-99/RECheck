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

import { supabase } from "@/DB";

/**
 * Get category code
 * Undergraduate/External -> UG
 * Graduate -> GS
 */
function getCategoryCode(category: string): string {
  const normalized = category.toLowerCase().trim();
  if (normalized.includes("graduate") && !normalized.includes("under")) {
    return "GS"; // Grad School
  }
  return "UG"; // Undergraduate (default for Undergraduate and External)
}

/**
 * Get review type code
 * Full Board -> FR
 * Expedited -> ER
 * Exempt -> EX
 */
function getReviewTypeCode(reviewType: string): string {
  const normalized = reviewType.toLowerCase().trim();
  if (normalized.includes("full")) {
    return "FR"; // Full Review
  } else if (normalized.includes("expedited")) {
    return "ER"; // Expedited Review
  } else if (normalized.includes("exempt")) {
    return "EX"; // Exempt
  }
  return "EX"; // Default to Exempt
}

export async function generateProtocolCode(
  category: string,
  reviewType: string
): Promise<string> {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year

  const categoryCode = getCategoryCode(category);
  const reviewCode = getReviewTypeCode(reviewType);

  // Get the sequence number for this month/year/category/review type combination
  const prefix = `${categoryCode}-${reviewCode}-${month}-${year}`;

  // Query existing protocol codes with this prefix
  const { data, error } = await supabase
    .from("proposals")
    .select("protocol_id")
    .like("protocol_id", `${prefix}-%`)
    .order("protocol_id", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching protocol codes:", error);
    throw error;
  }

  let sequenceNumber = 1;

  if (data && data.length > 0) {
    // Extract the sequence number from the last protocol code
    const lastCode = data[0].protocol_id;
    const parts = lastCode.split("-");
    const lastSequence = parseInt(parts[parts.length - 1], 10);
    sequenceNumber = lastSequence + 1;
  }

  // Format sequence number with leading zeros (4 digits)
  const formattedSequence = String(sequenceNumber).padStart(4, "0");

  return `${prefix}-${formattedSequence}`;
}

/**
 * Update protocol code for a proposal when review type is assigned
 */
export async function updateProtocolCode(
  proposalId: string,
  _unused: string,
  reviewType: string
): Promise<string> {
  // Fetch the proposal's category and existing protocol_id since they're not passed in
  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("category, protocol_id")
    .eq("proposal_id", proposalId)
    .single();

  if (fetchError || !proposal) {
    throw new Error("Could not fetch proposal: " + fetchError?.message);
  }

  // If a protocol code already exists and matches the category/review type, uphold it
  if (proposal.protocol_id) {
    const categoryCode = getCategoryCode(proposal.category);
    const reviewCode = getReviewTypeCode(reviewType);
    if (proposal.protocol_id.startsWith(`${categoryCode}-${reviewCode}-`)) {
      return proposal.protocol_id;
    }
  }

  const protocolCode = await generateProtocolCode(proposal.category, reviewType);

  const { error } = await supabase
    .from("proposals")
    .update({ protocol_id: protocolCode })
    .eq("proposal_id", proposalId);

  if (error) {
    console.error("Error updating protocol code:", error);
    throw error;
  }

  return protocolCode;
}
