async function seed() {
  try {
    await prisma.property.deleteMany({});
    await prisma.propertyType.deleteMany({});

    await prisma.propertyType.createMany({
      data: [
        { id: 1, typeName: 'barn' },
        { id: 2, typeName: 'triangular' },
        { id: 3, typeName: 'sauna' },
      ],
      skipDuplicates: true,
    });

    await prisma.property.createMany({
      data: [
        { propertyTypeId: 1, propertyName: 'Барн-дом 1' },
        { propertyTypeId: 1, propertyName: 'Барн-дом 2' },
        { propertyTypeId: 2, propertyName: 'А-фрейм 1' },
        { propertyTypeId: 2, propertyName: 'А-фрейм 2' },
        { propertyTypeId: 2, propertyName: 'А-фрейм 3' },
        { propertyTypeId: 2, propertyName: 'А-фрейм 4' },
        { propertyTypeId: 2, propertyName: 'А-фрейм 5' },
        { propertyTypeId: 3, propertyName: 'Баня 1' },
        { propertyTypeId: 3, propertyName: 'Баня 2' },
      ],
      skipDuplicates: true,
    });

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
