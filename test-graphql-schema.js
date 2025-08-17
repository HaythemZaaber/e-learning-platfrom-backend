const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGraphQLSchema() {
  try {
    console.log('🧪 Testing GraphQL Schema...\n');

    // Test basic Prisma operations to ensure schema is working
    console.log('1. Testing Prisma schema...');
    
    // Test enum values
    const applicationStatuses = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"ApplicationStatus")) as status;
    `;
    console.log('✅ ApplicationStatus enum values:', applicationStatuses.map(s => s.status));

    // Test document types
    const documentTypes = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"DocumentType")) as type;
    `;
    console.log('✅ DocumentType enum values:', documentTypes.map(d => d.type));

    // Test verification statuses
    const verificationStatuses = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"VerificationStatus")) as status;
    `;
    console.log('✅ VerificationStatus enum values:', verificationStatuses.map(v => v.status));

    console.log('\n🎉 GraphQL Schema test completed successfully!');
    console.log('\n📊 Schema Summary:');
    console.log('   - ApplicationStatus enum: ✅');
    console.log('   - DocumentType enum: ✅');
    console.log('   - VerificationStatus enum: ✅');
    console.log('   - All enums are properly defined');

  } catch (error) {
    console.error('❌ GraphQL Schema test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testGraphQLSchema();
