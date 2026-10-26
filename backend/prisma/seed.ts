import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const Role = { ADMIN: 'ADMIN', GUARD: 'GUARD', MEMBER: 'MEMBER' };
const MemberType = { STUDENT: 'STUDENT', FACULTY: 'FACULTY', EMPLOYEE: 'EMPLOYEE', MANAGEMENT: 'MANAGEMENT' };
const VisitType = { PRE_REGISTERED: 'PRE_REGISTERED', WALK_IN: 'WALK_IN', DELIVERY: 'DELIVERY' };
const VisitStatus = { EXPECTED: 'EXPECTED', PENDING_VERIFICATION: 'PENDING_VERIFICATION', CHECKED_IN: 'CHECKED_IN', CHECKED_OUT: 'CHECKED_OUT', CANCELLED: 'CANCELLED' };
const VehicleType = { CAR: 'CAR', BIKE: 'BIKE', TRUCK: 'TRUCK', AUTO: 'AUTO', OTHER: 'OTHER', NONE: 'NONE' };

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean up existing data
  await prisma.notification.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.universityMember.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({ data: { name: 'Computer Science' } }),
    prisma.department.create({ data: { name: 'Electrical Engineering' } }),
    prisma.department.create({ data: { name: 'Mechanical Engineering' } }),
    prisma.department.create({ data: { name: 'Administration' } }),
    prisma.department.create({ data: { name: 'Library Services' } }),
  ]);

  const hash = async (pw: string) => bcrypt.hash(pw, 12);

  // === ADMIN ===
  const admin = await prisma.user.create({
    data: {
      email: 'admin@suvms.edu',
      passwordHash: await hash('admin123'),
      role: 'ADMIN',
      name: 'Dr. Rajesh Kumar',
      phone: '9800000001',
    },
  });

  // === GUARDS ===
  const guard1 = await prisma.user.create({
    data: {
      email: 'guard1@suvms.edu',
      passwordHash: await hash('guard123'),
      role: 'GUARD',
      name: 'Ramesh Singh',
      phone: '9800000002',
    },
  });

  const guard2 = await prisma.user.create({
    data: {
      email: 'guard2@suvms.edu',
      passwordHash: await hash('guard123'),
      role: 'GUARD',
      name: 'Suresh Yadav',
      phone: '9800000003',
    },
  });

  // === STUDENTS (10) ===
  const studentData = [
    { name: 'Arjun Sharma', email: 'arjun@suvms.edu', phone: '9811000001', rollNo: 'CS2021001', dept: 'Computer Science' },
    { name: 'Priya Patel', email: 'priya@suvms.edu', phone: '9811000002', rollNo: 'CS2021002', dept: 'Computer Science' },
    { name: 'Rahul Gupta', email: 'rahul@suvms.edu', phone: '9811000003', rollNo: 'EE2021001', dept: 'Electrical Engineering' },
    { name: 'Sneha Reddy', email: 'sneha@suvms.edu', phone: '9811000004', rollNo: 'ME2021001', dept: 'Mechanical Engineering' },
    { name: 'Vikram Mehta', email: 'vikram@suvms.edu', phone: '9811000005', rollNo: 'CS2022001', dept: 'Computer Science' },
    { name: 'Ananya Singh', email: 'ananya@suvms.edu', phone: '9811000006', rollNo: 'CS2022002', dept: 'Computer Science' },
    { name: 'Karthik Nair', email: 'karthik@suvms.edu', phone: '9811000007', rollNo: 'EE2022001', dept: 'Electrical Engineering' },
    { name: 'Pooja Iyer', email: 'pooja@suvms.edu', phone: '9811000008', rollNo: 'ME2022001', dept: 'Mechanical Engineering' },
    { name: 'Rohan Verma', email: 'rohan@suvms.edu', phone: '9811000009', rollNo: 'CS2023001', dept: 'Computer Science' },
    { name: 'Divya Krishnan', email: 'divya@suvms.edu', phone: '9811000010', rollNo: 'CS2023002', dept: 'Computer Science' },
  ];

  const students = await Promise.all(
    studentData.map(s =>
      prisma.user.create({
        data: {
          email: s.email,
          passwordHash: bcrypt.hashSync('member123', 12),
          role: Role.MEMBER,
          name: s.name,
          phone: s.phone,
          member: {
            create: {
              memberType: MemberType.STUDENT,
              rollNo: s.rollNo,
              department: s.dept,
              publicMeetingPoint: 'Hostel B Reception',
            },
          },
        },
      })
    )
  );

  // === FACULTY (5) ===
  const facultyData = [
    { name: 'Prof. Anil Kumar', email: 'anil.kumar@suvms.edu', phone: '9822000001', empId: 'FAC001', dept: 'Computer Science' },
    { name: 'Dr. Meera Nair', email: 'meera.nair@suvms.edu', phone: '9822000002', empId: 'FAC002', dept: 'Electrical Engineering' },
    { name: 'Prof. Suresh Babu', email: 'suresh.babu@suvms.edu', phone: '9822000003', empId: 'FAC003', dept: 'Mechanical Engineering' },
    { name: 'Dr. Kavya Reddy', email: 'kavya.reddy@suvms.edu', phone: '9822000004', empId: 'FAC004', dept: 'Computer Science' },
    { name: 'Prof. Ravi Shankar', email: 'ravi.shankar@suvms.edu', phone: '9822000005', empId: 'FAC005', dept: 'Computer Science' },
  ];

  const faculty = await Promise.all(
    facultyData.map(f =>
      prisma.user.create({
        data: {
          email: f.email,
          passwordHash: bcrypt.hashSync('member123', 12),
          role: Role.MEMBER,
          name: f.name,
          phone: f.phone,
          member: {
            create: {
              memberType: MemberType.FACULTY,
              employeeId: f.empId,
              department: f.dept,
              publicMeetingPoint: 'Academic Block Lobby',
            },
          },
        },
      })
    )
  );

  // === EMPLOYEES (5) ===
  const employeeData = [
    { name: 'Prakash Rao', email: 'prakash.rao@suvms.edu', phone: '9833000001', empId: 'EMP001', dept: 'Administration' },
    { name: 'Lalitha Devi', email: 'lalitha.devi@suvms.edu', phone: '9833000002', empId: 'EMP002', dept: 'Library Services' },
    { name: 'Mohan Das', email: 'mohan.das@suvms.edu', phone: '9833000003', empId: 'EMP003', dept: 'Administration' },
    { name: 'Shobha Kumari', email: 'shobha.kumari@suvms.edu', phone: '9833000004', empId: 'EMP004', dept: 'Administration' },
    { name: 'Ganesh Pillai', email: 'ganesh.pillai@suvms.edu', phone: '9833000005', empId: 'EMP005', dept: 'Library Services' },
  ];

  const employees = await Promise.all(
    employeeData.map(e =>
      prisma.user.create({
        data: {
          email: e.email,
          passwordHash: bcrypt.hashSync('member123', 12),
          role: Role.MEMBER,
          name: e.name,
          phone: e.phone,
          member: {
            create: {
              memberType: MemberType.EMPLOYEE,
              employeeId: e.empId,
              department: e.dept,
              publicMeetingPoint: 'Admin Block Reception',
            },
          },
        },
      })
    )
  );

  console.log('✅ Users created');

  // === VISITORS (20) ===
  const visitorData = [
    { name: 'Sunita Sharma', phone: '9900000001' },
    { name: 'Deepak Malhotra', phone: '9900000002' },
    { name: 'Rekha Gupta', phone: '9900000003' },
    { name: 'Amit Joshi', phone: '9900000004' },
    { name: 'Nisha Kapoor', phone: '9900000005' },
    { name: 'Sanjay Thakur', phone: '9900000006' },
    { name: 'Geeta Singh', phone: '9900000007' },
    { name: 'Raj Kumar', phone: '9900000008' },
    { name: 'Meena Patel', phone: '9900000009' },
    { name: 'Vinod Tiwari', phone: '9900000010' },
    { name: 'Asha Bhatt', phone: '9900000011' },
    { name: 'Manoj Dubey', phone: '9900000012' },
    { name: 'Savita Yadav', phone: '9900000013' },
    { name: 'Rajan Mishra', phone: '9900000014' },
    { name: 'Kamala Devi', phone: '9900000015' },
    { name: 'Sunil Pandey', phone: '9900000016' },
    { name: 'Rohini Tripathi', phone: '9900000017' },
    { name: 'Quick Delivery Co.', phone: '9900000018' },
    { name: 'Kavitha Rao', phone: '9900000019' },
    { name: 'Ratan Lal', phone: '9900000020' },
  ];

  const visitors = await Promise.all(
    visitorData.map(v => prisma.visitor.create({ data: v }))
  );

  console.log('✅ Visitors created');

  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const twoDaysAgo = new Date(now); twoDaysAgo.setDate(now.getDate() - 2);
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);

  const toTime = (h: number, m: number = 0) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };

  // === VISITS ===

  // EXPECTED visits (future / today)
  await prisma.visit.create({
    data: {
      visitorId: visitors[0].id,
      hostMemberId: students[0].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Family visit - parents from hometown',
      campusLocation: 'Hostel',
      expectedDate: tomorrow,
      expectedTime: '10:00',
      expectedDuration: '2 hours',
      status: VisitStatus.EXPECTED,
      vehicleType: VehicleType.CAR,
      vehicleNumber: 'MH12AB1234',
      notes: 'Mother and father visiting',
    },
  });

  await prisma.visit.create({
    data: {
      visitorId: visitors[1].id,
      hostMemberId: students[1].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Academic counseling meeting',
      campusLocation: 'Academic Block',
      expectedDate: tomorrow,
      expectedTime: '14:00',
      expectedDuration: '1 hour',
      status: VisitStatus.EXPECTED,
      vehicleType: VehicleType.BIKE,
      vehicleNumber: 'DL5SB5678',
    },
  });

  await prisma.visit.create({
    data: {
      visitorId: visitors[2].id,
      hostMemberId: faculty[0].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Research collaboration meeting',
      campusLocation: 'Academic Block',
      expectedDate: now,
      expectedTime: '15:00',
      expectedDuration: '3 hours',
      status: VisitStatus.EXPECTED,
      idVerified: false,
    },
  });

  await prisma.visit.create({
    data: {
      visitorId: visitors[3].id,
      hostMemberId: students[2].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Friend visiting for project work',
      campusLocation: 'Library',
      expectedDate: now,
      expectedTime: '11:00',
      expectedDuration: '4 hours',
      status: VisitStatus.EXPECTED,
    },
  });

  await prisma.visit.create({
    data: {
      visitorId: visitors[4].id,
      hostMemberId: students[3].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Personal visit - sibling',
      campusLocation: 'Hostel',
      expectedDate: nextWeek,
      expectedTime: '09:00',
      expectedDuration: '5 hours',
      status: VisitStatus.EXPECTED,
    },
  });

  // CHECKED_IN visits (currently inside)
  const ci1 = await prisma.visit.create({
    data: {
      visitorId: visitors[5].id,
      hostMemberId: students[4].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Career guidance session',
      campusLocation: 'Academic Block',
      expectedDate: now,
      expectedTime: '09:00',
      status: VisitStatus.CHECKED_IN,
      actualEntryTime: toTime(9, 15),
      idVerified: true,
      vehicleType: VehicleType.CAR,
      vehicleNumber: 'KA09CD2345',
    },
  });

  const ci2 = await prisma.visit.create({
    data: {
      visitorId: visitors[6].id,
      hostMemberId: faculty[1].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Guest lecture on IoT',
      campusLocation: 'Academic Block',
      expectedDate: now,
      expectedTime: '10:00',
      status: VisitStatus.CHECKED_IN,
      actualEntryTime: toTime(10, 5),
      idVerified: true,
    },
  });

  const ci3 = await prisma.visit.create({
    data: {
      visitorId: visitors[7].id,
      hostMemberId: students[5].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Project submission help',
      campusLocation: 'Library',
      expectedDate: now,
      expectedTime: '11:00',
      status: VisitStatus.CHECKED_IN,
      actualEntryTime: toTime(11, 0),
      idVerified: true,
      vehicleType: VehicleType.BIKE,
      vehicleNumber: 'TN02EF3456',
    },
  });

  // Walk-in CHECKED_IN
  const wi1 = await prisma.visit.create({
    data: {
      visitorId: visitors[8].id,
      hostMemberId: null,
      visitType: VisitType.WALK_IN,
      purpose: 'Vendor meeting - supplies',
      campusLocation: 'Admin Block',
      status: VisitStatus.CHECKED_IN,
      actualEntryTime: toTime(8, 30),
      idVerified: true,
      vehicleType: VehicleType.TRUCK,
      vehicleNumber: 'GJ05GH4567',
    },
  });

  // Delivery CHECKED_IN
  const del1 = await prisma.visit.create({
    data: {
      visitorId: visitors[17].id,
      hostMemberId: null,
      visitType: VisitType.DELIVERY,
      purpose: 'Courier delivery',
      campusLocation: 'Admin Block',
      status: VisitStatus.CHECKED_IN,
      actualEntryTime: toTime(10, 45),
      idVerified: true,
      vehicleType: VehicleType.BIKE,
      vehicleNumber: 'MH01IJ5678',
      deliveryCompany: 'Quick Delivery Co.',
      receivingPerson: 'Admin Office',
      deliveryDest: 'Admin Block, Room 101',
    },
  });

  // Create notifications for checked-in visits
  await prisma.notification.create({
    data: {
      userId: students[4].id,
      message: `Your visitor ${visitors[5].name} has arrived at Academic Block.`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: faculty[1].id,
      message: `Your visitor ${visitors[6].name} has arrived at Academic Block.`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: students[5].id,
      message: `Your visitor ${visitors[7].name} has arrived at Library.`,
      isRead: true,
    },
  });

  // CHECKED_OUT visits (past)
  const co1 = await prisma.visit.create({
    data: {
      visitorId: visitors[9].id,
      hostMemberId: students[6].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Birthday celebration',
      campusLocation: 'Cafeteria',
      expectedDate: yesterday,
      expectedTime: '14:00',
      status: VisitStatus.CHECKED_OUT,
      actualEntryTime: new Date(yesterday.setHours(14, 10)),
      actualExitTime: new Date(yesterday.setHours(16, 30)),
      idVerified: true,
    },
  });

  const co2 = await prisma.visit.create({
    data: {
      visitorId: visitors[10].id,
      hostMemberId: students[7].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Medical emergency - family',
      campusLocation: 'Hostel',
      expectedDate: yesterday,
      status: VisitStatus.CHECKED_OUT,
      actualEntryTime: new Date(twoDaysAgo.setHours(10, 0)),
      actualExitTime: new Date(twoDaysAgo.setHours(12, 45)),
      idVerified: true,
      vehicleType: VehicleType.CAR,
      vehicleNumber: 'UP32KL6789',
    },
  });

  const co3 = await prisma.visit.create({
    data: {
      visitorId: visitors[11].id,
      hostMemberId: faculty[2].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Industry-academia collaboration',
      campusLocation: 'Academic Block',
      expectedDate: twoDaysAgo,
      status: VisitStatus.CHECKED_OUT,
      actualEntryTime: new Date(twoDaysAgo.setHours(11, 0)),
      actualExitTime: new Date(twoDaysAgo.setHours(14, 0)),
      idVerified: true,
      vehicleType: VehicleType.CAR,
      vehicleNumber: 'HR26MN7890',
    },
  });

  // Walk-in CHECKED_OUT
  await prisma.visit.create({
    data: {
      visitorId: visitors[12].id,
      hostMemberId: null,
      visitType: VisitType.WALK_IN,
      purpose: 'Equipment repair technician',
      campusLocation: 'Academic Block',
      status: VisitStatus.CHECKED_OUT,
      actualEntryTime: new Date(yesterday.setHours(9, 0)),
      actualExitTime: new Date(yesterday.setHours(12, 0)),
      idVerified: true,
      vehicleType: VehicleType.AUTO,
      vehicleNumber: 'MH15OP8901',
    },
  });

  // Delivery CHECKED_OUT
  await prisma.visit.create({
    data: {
      visitorId: visitors[13].id,
      hostMemberId: null,
      visitType: VisitType.DELIVERY,
      purpose: 'Lab equipment delivery',
      campusLocation: 'Academic Block',
      status: VisitStatus.CHECKED_OUT,
      actualEntryTime: new Date(yesterday.setHours(11, 30)),
      actualExitTime: new Date(yesterday.setHours(12, 15)),
      idVerified: true,
      vehicleType: VehicleType.TRUCK,
      vehicleNumber: 'GJ01PQ9012',
      deliveryCompany: 'TechSupply India',
      receivingPerson: 'Prof. Suresh Babu',
      deliveryDest: 'Mechanical Lab, Block C',
    },
  });

  // More CHECKED_OUT for analytics
  for (let i = 0; i < 5; i++) {
    const daysAgo = new Date(now);
    daysAgo.setDate(now.getDate() - (i + 3));
    await prisma.visit.create({
      data: {
        visitorId: visitors[i + 14].id,
        hostMemberId: students[i + 3].id,
        visitType: VisitType.PRE_REGISTERED,
        purpose: 'Regular family visit',
        campusLocation: ['Hostel', 'Academic Block', 'Library', 'Cafeteria', 'Sports Complex'][i],
        status: VisitStatus.CHECKED_OUT,
        actualEntryTime: new Date(daysAgo.setHours(10 + i, 0)),
        actualExitTime: new Date(daysAgo.setHours(13 + i, 0)),
        idVerified: true,
      },
    });
  }

  // CANCELLED visit
  await prisma.visit.create({
    data: {
      visitorId: visitors[14].id,
      hostMemberId: students[8].id,
      visitType: VisitType.PRE_REGISTERED,
      purpose: 'Cancelled trip',
      campusLocation: 'Hostel',
      expectedDate: tomorrow,
      status: VisitStatus.CANCELLED,
      notes: 'Visitor cancelled due to personal reasons',
    },
  });

  // Notifications for checkouts
  await prisma.notification.create({
    data: {
      userId: students[6].id,
      message: `Your visitor ${visitors[9].name} has exited the campus.`,
      isRead: true,
    },
  });

  console.log('✅ Visits and notifications created');

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('🎓 SUVMS DEMO CREDENTIALS');
  console.log('═'.repeat(60));
  console.log('\n📋 Role: Administrator');
  console.log('   Email:    admin@suvms.edu');
  console.log('   Password: admin123');
  console.log('\n🔒 Role: Security Guard');
  console.log('   Email:    guard1@suvms.edu');
  console.log('   Password: guard123');
  console.log('\n👤 Role: University Member (Student)');
  console.log('   Email:    arjun@suvms.edu');
  console.log('   Password: member123');
  console.log('\n👤 Role: University Member (Faculty)');
  console.log('   Email:    anil.kumar@suvms.edu');
  console.log('   Password: member123');
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Seeding completed successfully!\n');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
