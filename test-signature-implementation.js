

import { DigitalSignatureService } from '../src/services/digitalSignatureService';


const testDeviationId = 'test-deviation-123';
const testUserId = 'test-user-456';


const mockSignatureData = {
  signatureImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  userId: testUserId,
  userRole: 'researcher' as const
};


async function testSignatureWorkflow() {
  console.log('🔬 Testing Two-Stage Signature Workflow');
  
  try {
    // Test 1: Check if researcher can sign
    console.log('✅ Test 1: Checking researcher permissions...');
    const researcherPermission = await DigitalSignatureService.canUserSign(
      testDeviationId, 
      testUserId, 
      'researcher'
    );
    console.log('Researcher can sign:', researcherPermission);

    
    if (researcherPermission.canSign) {
      console.log('✅ Test 2: Researcher signing...');
      const researcherSignResult = await DigitalSignatureService.signAsResearcher(
        testDeviationId,
        mockSignatureData
      );
      console.log('Researcher signature result:', researcherSignResult);
    }

    
    console.log('✅ Test 3: Checking staff permissions...');
    const staffPermission = await DigitalSignatureService.canUserSign(
      testDeviationId, 
      'staff-user-789', 
      'staff'
    );
    console.log('Staff can sign:', staffPermission);

    
    if (staffPermission.canSign) {
      console.log('✅ Test 4: Staff signing...');
      const staffSignResult = await DigitalSignatureService.signAsStaff(
        testDeviationId,
        {
          ...mockSignatureData,
          userId: 'staff-user-789',
          userRole: 'staff'
        }
      );
      console.log('Staff signature result:', staffSignResult);
    }

    console.log('✅ Test 5: Verifying signatures...');
    const verification = await DigitalSignatureService.verifySignatures(testDeviationId);
    console.log('Signature verification:', verification);

   
    console.log('✅ Test 6: Getting audit trail...');
    const auditTrail = await DigitalSignatureService.getSignatureAuditTrail(testDeviationId);
    console.log('Audit trail:', auditTrail);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}


export { testSignatureWorkflow };


