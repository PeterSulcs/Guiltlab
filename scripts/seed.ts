import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test GitLab instance
  const gitlabInstance = await prisma.gitLabInstance.create({
    data: {
      name: 'Test GitLab',
      baseUrl: 'https://gitlab.com',
      token: 'test-token',
    },
  });

  // Create test team members
  const teamMember1 = await prisma.teamMember.create({
    data: {
      displayName: 'John Doe',
      instanceUsernames: {
        create: {
          instanceId: gitlabInstance.id,
          username: 'johndoe',
          instanceType: 'gitlab',
        },
      },
    },
  });

  const teamMember2 = await prisma.teamMember.create({
    data: {
      displayName: 'Jane Smith',
      instanceUsernames: {
        create: {
          instanceId: gitlabInstance.id,
          username: 'janesmith',
          instanceType: 'gitlab',
        },
      },
    },
  });

  console.log('Created test data:', {
    gitlabInstance,
    teamMember1,
    teamMember2,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 