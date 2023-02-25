import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      // id: 1,
      email: 'kia@fake-mail.com',
      email_confirmed: true,
      email_activation_code: '',
      is_admin: false,
      name: 'kia',
      credential: {
        create: {
          hash: 'password',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      // id: 2,
      email: 'kia2@fake-mail.com',
      email_confirmed: true,
      email_activation_code: '',
      is_admin: false,
      name: 'kia2',
      credential: {
        create: {
          hash: 'password',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      // id: 3,
      email: 'mamaUser@fake-mail.com',
      email_confirmed: true,
      email_activation_code: '',
      is_admin: false,
      name: 'Mama',
      credential: {
        create: {
          hash: 'password',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      // id: 4,
      email: 'admin@fake-mail.com',
      email_confirmed: true,
      email_activation_code: '',
      is_admin: true,
      name: 'Mama',
      credential: {
        create: {
          hash: 'password',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      // id: 5,
      email: 'adminaaa@fake-mail.com',
      email_confirmed: true,
      email_activation_code: '',
      is_admin: true,
      name: 'Mama',
      credential: {
        create: {
          hash: 'password',
        },
      },
    },
  });
  await prisma.user.create({
    data: {
      // id: 6,
      email: 'admaaainaaa@fake-mail.com',
      email_confirmed: true,
      email_activation_code: '',
      is_admin: true,
      name: 'Mama',
      credential: {
        create: {
          hash: 'password',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      // id: 7,
      email: 'admaaainaaaaaaa@fake-mail.com',
      email_confirmed: true,
      email_activation_code: '',
      is_admin: true,
      name: 'Mama',
      credential: {
        create: {
          hash: 'password',
        },
      },
    },
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
