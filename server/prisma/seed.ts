import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ============================================
  // 1. Create default superadmin user
  // ============================================
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@chiptunefiles.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const adminName = process.env.ADMIN_NAME || 'Super Admin';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'SUPERADMIN',
        contactName: adminName,
        companyName: 'ChipTuneFiles Pro',
        creditBalance: 0,
        isActive: true,
      },
    });
    console.log(`  Created superadmin: ${adminEmail}`);
  } else {
    console.log(`  Superadmin already exists: ${adminEmail}`);
  }

  // ============================================
  // 2. Create ECU Service Categories
  // ============================================
  const ecuStageCategory = await prisma.serviceCategory.upsert({
    where: { id: 'ecu-stage-tuning' },
    update: {},
    create: {
      id: 'ecu-stage-tuning',
      name: 'Stage Tuning',
      description: 'Performance stage upgrades for your ECU. Select one stage level.',
      sortOrder: 1,
      isActive: true,
      selectionType: 'SINGLE',
      jobType: 'ECU',
    },
  });
  console.log(`  Created ECU category: ${ecuStageCategory.name}`);

  const ecuOptionsCategory = await prisma.serviceCategory.upsert({
    where: { id: 'ecu-options' },
    update: {},
    create: {
      id: 'ecu-options',
      name: 'Options',
      description: 'Additional ECU tuning options. Select multiple if needed.',
      sortOrder: 2,
      isActive: true,
      selectionType: 'MULTIPLE',
      jobType: 'ECU',
    },
  });
  console.log(`  Created ECU category: ${ecuOptionsCategory.name}`);

  // ============================================
  // 3. Create TCU Service Categories
  // ============================================
  const tcuStageCategory = await prisma.serviceCategory.upsert({
    where: { id: 'tcu-stage-tuning' },
    update: {},
    create: {
      id: 'tcu-stage-tuning',
      name: 'TCU Stage Tuning',
      description: 'Transmission control unit stage upgrades. Select one stage level.',
      sortOrder: 1,
      isActive: true,
      selectionType: 'SINGLE',
      jobType: 'TCU',
    },
  });
  console.log(`  Created TCU category: ${tcuStageCategory.name}`);

  const tcuOptionsCategory = await prisma.serviceCategory.upsert({
    where: { id: 'tcu-options' },
    update: {},
    create: {
      id: 'tcu-options',
      name: 'TCU Options',
      description: 'Additional TCU tuning options. Select multiple if needed.',
      sortOrder: 2,
      isActive: true,
      selectionType: 'MULTIPLE',
      jobType: 'TCU',
    },
  });
  console.log(`  Created TCU category: ${tcuOptionsCategory.name}`);

  // ============================================
  // 4. Create ECU Services
  // ============================================
  const ecuStageServices = [
    {
      id: 'ecu-stage1',
      code: 'ECU-STG1',
      name: 'Stage 1',
      description: 'ECU remap optimizing factory parameters for increased power and torque. Safe for stock hardware. Typical gains: 20-30% more power.',
      basePrice: 150,
      estimatedHours: 2,
      icon: 'Zap',
      sortOrder: 1,
      categoryId: ecuStageCategory.id,
    },
    {
      id: 'ecu-stage2',
      code: 'ECU-STG2',
      name: 'Stage 2',
      description: 'Aggressive ECU remap designed for vehicles with supporting hardware modifications (intake, exhaust, intercooler). Typical gains: 30-45% more power.',
      basePrice: 250,
      estimatedHours: 3,
      icon: 'Flame',
      sortOrder: 2,
      categoryId: ecuStageCategory.id,
    },
    {
      id: 'ecu-stage3',
      code: 'ECU-STG3',
      name: 'Stage 3',
      description: 'Maximum performance ECU remap for fully built engines with upgraded turbo/supercharger. Requires extensive hardware modifications. Typical gains: 50%+ more power.',
      basePrice: 400,
      estimatedHours: 5,
      icon: 'Rocket',
      sortOrder: 3,
      categoryId: ecuStageCategory.id,
    },
  ];

  const ecuOptionServices = [
    {
      id: 'ecu-dpf-off',
      code: 'ECU-DPF',
      name: 'DPF Off',
      description: 'Diesel Particulate Filter removal from ECU software. Eliminates DPF regeneration cycles and related error codes. For off-road / competition use only.',
      basePrice: 100,
      estimatedHours: 1.5,
      icon: 'Filter',
      sortOrder: 1,
      categoryId: ecuOptionsCategory.id,
    },
    {
      id: 'ecu-egr-off',
      code: 'ECU-EGR',
      name: 'EGR Off',
      description: 'Exhaust Gas Recirculation valve deactivation in ECU software. Prevents carbon buildup in the intake manifold. For off-road / competition use only.',
      basePrice: 75,
      estimatedHours: 1,
      icon: 'Wind',
      sortOrder: 2,
      categoryId: ecuOptionsCategory.id,
    },
    {
      id: 'ecu-adblue-off',
      code: 'ECU-ADBLUE',
      name: 'AdBlue Off',
      description: 'Selective Catalytic Reduction (SCR) and AdBlue system deactivation. Removes urea injection and related error codes. For off-road / competition use only.',
      basePrice: 100,
      estimatedHours: 1.5,
      icon: 'Droplets',
      sortOrder: 3,
      categoryId: ecuOptionsCategory.id,
    },
    {
      id: 'ecu-lambda-off',
      code: 'ECU-LAMBDA',
      name: 'Lambda/O2 Off',
      description: 'Deactivation of lambda (oxygen) sensors in the ECU. Used when catalytic converters are removed. For off-road / competition use only.',
      basePrice: 50,
      estimatedHours: 1,
      icon: 'Gauge',
      sortOrder: 4,
      categoryId: ecuOptionsCategory.id,
    },
    {
      id: 'ecu-cat-off',
      code: 'ECU-CAT',
      name: 'CAT Off',
      description: 'Catalytic converter removal from ECU software. Deactivates catalyst monitoring and efficiency codes. For off-road / competition use only.',
      basePrice: 75,
      estimatedHours: 1,
      icon: 'CircleOff',
      sortOrder: 5,
      categoryId: ecuOptionsCategory.id,
    },
    {
      id: 'ecu-dtc-off',
      code: 'ECU-DTC',
      name: 'DTC Off',
      description: 'Specific Diagnostic Trouble Code removal. Clears persistent error codes related to hardware modifications. Specify DTCs in notes.',
      basePrice: 50,
      estimatedHours: 1,
      icon: 'AlertTriangle',
      sortOrder: 6,
      categoryId: ecuOptionsCategory.id,
    },
    {
      id: 'ecu-vmax-off',
      code: 'ECU-VMAX',
      name: 'Speed Limiter Off',
      description: 'Removal of the factory top speed limiter. Allows the vehicle to reach its natural maximum speed. For track / competition use only.',
      basePrice: 50,
      estimatedHours: 0.5,
      icon: 'Speedometer',
      sortOrder: 7,
      categoryId: ecuOptionsCategory.id,
    },
    {
      id: 'ecu-popbang',
      code: 'ECU-POP',
      name: 'Pop & Bang / Crackle Map',
      description: 'Adds aggressive exhaust pops, bangs, and crackle sounds on deceleration and gear shifts. Available for petrol engines only.',
      basePrice: 100,
      estimatedHours: 1.5,
      icon: 'Sparkles',
      sortOrder: 8,
      categoryId: ecuOptionsCategory.id,
    },
    {
      id: 'ecu-start-stop',
      code: 'ECU-SS',
      name: 'Start/Stop Off',
      description: 'Deactivation of the automatic engine start/stop system. Engine will remain running when the vehicle comes to a stop.',
      basePrice: 50,
      estimatedHours: 0.5,
      icon: 'Power',
      sortOrder: 9,
      categoryId: ecuOptionsCategory.id,
    },
    {
      id: 'ecu-flap-off',
      code: 'ECU-FLAP',
      name: 'Swirl Flaps Off',
      description: 'Deactivation of intake swirl flaps in ECU software. Prevents flap failure and related engine damage. Common on BMW and other European diesels.',
      basePrice: 75,
      estimatedHours: 1,
      icon: 'RotateCw',
      sortOrder: 10,
      categoryId: ecuOptionsCategory.id,
    },
  ];

  for (const service of [...ecuStageServices, ...ecuOptionServices]) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {},
      create: {
        id: service.id,
        code: service.code,
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        estimatedHours: service.estimatedHours,
        icon: service.icon,
        sortOrder: service.sortOrder,
        isActive: true,
        categoryId: service.categoryId,
      },
    });
    console.log(`  Created ECU service: ${service.name}`);
  }

  // ============================================
  // 5. Create TCU Services
  // ============================================
  const tcuStageServices = [
    {
      id: 'tcu-stage1',
      code: 'TCU-STG1',
      name: 'TCU Stage 1',
      description: 'Optimized shift points and improved torque converter lockup strategy. Faster, smoother gear changes with stock hardware.',
      basePrice: 200,
      estimatedHours: 3,
      icon: 'Zap',
      sortOrder: 1,
      categoryId: tcuStageCategory.id,
    },
    {
      id: 'tcu-stage2',
      code: 'TCU-STG2',
      name: 'TCU Stage 2',
      description: 'Aggressive shift strategy with raised torque limits for modified engines. Designed to handle significantly increased power output.',
      basePrice: 350,
      estimatedHours: 4,
      icon: 'Flame',
      sortOrder: 2,
      categoryId: tcuStageCategory.id,
    },
  ];

  const tcuOptionServices = [
    {
      id: 'tcu-launch',
      code: 'TCU-LAUNCH',
      name: 'Launch Control',
      description: 'Activation or optimization of launch control function for maximum acceleration from standstill. Adjustable RPM and torque settings.',
      basePrice: 100,
      estimatedHours: 1.5,
      icon: 'Rocket',
      sortOrder: 1,
      categoryId: tcuOptionsCategory.id,
    },
    {
      id: 'tcu-torque-limit',
      code: 'TCU-TRQ',
      name: 'Torque Limiter Increase',
      description: 'Raises the gearbox torque limits to safely handle increased engine power. Essential for Stage 2+ ECU tunes.',
      basePrice: 150,
      estimatedHours: 2,
      icon: 'Gauge',
      sortOrder: 2,
      categoryId: tcuOptionsCategory.id,
    },
    {
      id: 'tcu-shift-speed',
      code: 'TCU-SHIFT',
      name: 'Faster Shift Speed',
      description: 'Reduced shift times for quicker gear changes. Applies to both upshifts and downshifts in sport and manual modes.',
      basePrice: 100,
      estimatedHours: 1.5,
      icon: 'Timer',
      sortOrder: 3,
      categoryId: tcuOptionsCategory.id,
    },
  ];

  for (const service of [...tcuStageServices, ...tcuOptionServices]) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {},
      create: {
        id: service.id,
        code: service.code,
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        estimatedHours: service.estimatedHours,
        icon: service.icon,
        sortOrder: service.sortOrder,
        isActive: true,
        categoryId: service.categoryId,
      },
    });
    console.log(`  Created TCU service: ${service.name}`);
  }

  // ============================================
  // 6. Create Credit Packages
  // ============================================
  const creditPackages = [
    {
      id: 'pkg-50',
      name: '50 Credits',
      credits: 50,
      price: 50,
      bonusCredits: 0,
      sortOrder: 1,
    },
    {
      id: 'pkg-100',
      name: '100 Credits',
      credits: 100,
      price: 95,
      bonusCredits: 5,
      sortOrder: 2,
    },
    {
      id: 'pkg-250',
      name: '250 Credits',
      credits: 250,
      price: 225,
      bonusCredits: 25,
      sortOrder: 3,
    },
    {
      id: 'pkg-500',
      name: '500 Credits',
      credits: 500,
      price: 425,
      bonusCredits: 75,
      sortOrder: 4,
    },
    {
      id: 'pkg-1000',
      name: '1000 Credits',
      credits: 1000,
      price: 800,
      bonusCredits: 200,
      sortOrder: 5,
    },
  ];

  for (const pkg of creditPackages) {
    await prisma.creditPackage.upsert({
      where: { id: pkg.id },
      update: {},
      create: {
        id: pkg.id,
        name: pkg.name,
        credits: pkg.credits,
        price: pkg.price,
        bonusCredits: pkg.bonusCredits,
        isActive: true,
        sortOrder: pkg.sortOrder,
      },
    });
    console.log(`  Created credit package: ${pkg.name} (${pkg.credits} credits for EUR ${pkg.price})`);
  }

  // ============================================
  // 7. Create Default Settings
  // ============================================
  const defaultSettings: Record<string, string> = {
    brand_name: 'ChipTuneFiles Pro',
    primary_color: '#dc2626',
    secondary_color: '#ef4444',
    accent_color: '#b91c1c',
    logo_url: '',
    favicon_url: '',
    support_email: 'support@chiptunefiles.com',
    support_phone: '',
    company_address: '',
    currency: 'EUR',
    currency_symbol: '\u20ac',
    default_job_priority: '0',
    max_file_size_mb: '50',
    allowed_file_extensions: '.bin,.ori,.mod,.hex,.s19,.zip,.rar,.7z',
    auto_assign_jobs: 'false',
    email_notifications_enabled: 'true',
    maintenance_mode: 'false',
    terms_url: '',
    privacy_url: '',
    welcome_message: 'Welcome to ChipTuneFiles Pro! Upload your ECU or TCU file to get started with professional tuning.',
    announcement_enabled: 'false',
    announcement_message: '',
    announcement_type: 'INFO',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: {
        key,
        value,
      },
    });
    console.log(`  Created setting: ${key} = ${value || '(empty)'}`);
  }

  console.log('\nDatabase seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
